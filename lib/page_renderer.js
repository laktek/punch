var _ = require("underscore");
var path = require("path");

var module_utils = require("./utils/module_utils.js");

module.exports = {

	templates: null,

	contents: null,

	templateEngine: null,

	compilers: {},

	helpers: [],

	setup: function(config) {
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
		self.templateEngine = module_utils.requireAndSetup(config.plugins.template_engine, config);

		_.each(config.plugins.compilers, function(value, key) {
			self.compilers[key] = module_utils.requireAndSetup(value, config);
		});

		_.each(config.plugins.helpers, function(helper) {
			self.helpers.push(module_utils.requireAndSetup(helper, config));
		});
	},

	createTemplateEngine: function(options) {
		var self = this;

		return new self.templateEngine(options);
	},

	getHelpers: function(basepath, output_extension, options, callback) {
		var self = this;

		var collected_helpers = { "tag": {}, "block": {} };
		var collected_helper_options = {};
		var collected_helpers_last_modified = null;
		var cloned_helpers = self.helpers.slice(0);

		var get_helper_content = function(helper, helper_callback) {
			helper.get(basepath, output_extension, options, function(err, helper_tags, helper_options, last_modified){
				if (!err) {
					collected_helpers["tag"] = _.extend(collected_helpers["tag"], helper_tags["tag"]);
					collected_helpers["block"] = _.extend(collected_helpers["block"], helper_tags["block"]);
					collected_helper_options = _.extend(collected_helper_options, helper_options);

					if (last_modified > collected_helpers_last_modified) {
						collected_helpers_last_modified = last_modified;
					}
				}

				return helper_callback();
			});
		};

		var get_helper_callback = function() {
			if (cloned_helpers.length) {
				return get_helper_content(cloned_helpers.shift(), get_helper_callback);
			} else {
				return callback(null, collected_helpers, collected_helper_options, collected_helpers_last_modified);
			}
		};

		return get_helper_callback();
	},

	serveStatic: function(request_path, last_modified, callback) {
		var self = this;

		self.templates.getTemplate(request_path, function(err, stat) {
			if (err) {
				return callback({ "ignore": true, "message": err }, null);
			}

			if (stat.last_modified > last_modified) {
				self.templates.readTemplate(request_path, function(err, output) {
					if (err) {
						return callback({ "ignore": false, "message": err }, null);
					}
					return callback(null, { "body": output, "modified": true });
				});
			} else {
				return callback(null, { "body": null, "modified": false });
			}
		});
	},

	compileTo: function(request_path, output_extension, last_modified, callback) {
		var self = this;

		// If there are 2 or more request path portions,
		// we assume the filename is defined by the first,
		// and let all others be part of the extension.
		var request_path_portions = request_path.split(".");
		var basepath = request_path_portions.shift();

		if (request_path_portions.length) {
			output_extension = "." + request_path_portions.join(".");
		}

		var compiler = self.compilers[output_extension];

		if (!compiler) {
			return callback({ "ignore": true, "message": "no compiler found" }, null);
		}

		self.templates.getTemplates(basepath, function(err, templates_list) {
			if (err) {
				return callback({ "ignore": true, "message": err }, null);
			}

			var checkForCompilableTemplates = function() {
				var template = templates_list.pop();
				var template_extension = path.extname(template.full_path);

				if (_.include(compiler.input_extensions, template_extension)) {
					if (compiler.force_compile || template.last_modified > last_modified) {

						self.templates.readTemplate(template.full_path, function(err, template_output) {
							if (err) {
								return callback({ "ignore": false, "message": err }, null);
							}

							var compiler_callback = function (err, output) {
								if (err) {
									return callback({ "ignore": false, "message": err }, null);
								}
								return callback(null, { "body": output, "modified": true });
							};

							return compiler.compile(template_output, path.join(self.templates.templateDir, template.full_path), compiler_callback);
						});
					} else {
						return callback(null, { "body": null, "modified": false });
					}
				} else {
					checkForCompilableTemplatesCallback();
				}
			};

			var checkForCompilableTemplatesCallback = function() {
				if (templates_list.length) {
					return checkForCompilableTemplates();
				} else {
					return callback({ "ignore": true, "message": "no compilable template found" }, null);
				}
			};

			return checkForCompilableTemplatesCallback();
		});
	},

	renderContent: function(request_path, output_extension, last_modified, options, callback) {
		var self = this;
		var basepath = request_path.split(".")[0];
		var response_options = {};
		var render_options = { "lastRender": last_modified };

		var template_engine = self.createTemplateEngine(render_options);

		template_engine.on("renderComplete", function(rendered_output, modified) {
			return callback(null, { "body": rendered_output, "modified": modified, "options": response_options });
		});

		template_engine.on("renderCanceled", function(err, status_code) {
			return callback(null, { "body": null, "modified": true, "options": { "status": status_code, "log": { "message": err } } });
		});

		self.contents.negotiateContent(basepath, output_extension, options, function(err, content_obj, content_options, content_last_modified) {
			response_options = _.extend(response_options, content_options);
			if (!err) {
				return template_engine.setContent(content_obj, content_last_modified);
			} else {
				return template_engine.cancelRender(err);
			}
		});

		self.templates.negotiateTemplate(basepath, output_extension, template_engine.extension, options, function(err, template_output, template_last_modified) {
			if (!err) {
				return template_engine.setTemplate(template_output, template_last_modified);
			} else {
				return template_engine.cancelRender(err);
			}
		});

		self.templates.getPartials(basepath, template_engine.extension, options, function(err, partials, partials_last_modified) {
			return template_engine.setPartials(partials, partials_last_modified);
		});

		self.getHelpers(basepath, output_extension, options, function(err, helper_obj, helper_options, helper_last_modified) {
			response_options = _.extend(response_options, helper_options);
			if (!err) {
				return template_engine.setHelpers(helper_obj, helper_last_modified);
			}
		});
	},

	render: function(request_path, output_extension, last_modified, options, callback) {
		var self = this;

		// First, check if request path is a template or content section
		if (self.templates.isSection(request_path) || self.contents.isSection(request_path)) {
			request_path = path.join(request_path, "index");
		}

		var callback_handler = function(err, output) {
			if (!err) {
				if (_.has(output, "body") && _.has(output, "modified")) {
					return callback(output);
				} else {
					return callback({ "body": null, "modified": true, "options": { "status": 500, "log": { "message": "[Error] Response should contain body and modified properties" } } });
				}
			} else if (!err.ignore) {
				return callback({ "body": null, "modified": true, "options": { "status": 500, "log": { "message": "[Error] " + err.message } } });
			} else if (rendering_steps.length) {
					return rendering_steps.shift().call();
			}
		};

		var rendering_steps = [
			function() { return self.serveStatic((request_path + output_extension), last_modified, callback_handler); },
			function() { return self.compileTo(request_path, output_extension, last_modified, callback_handler); },
			function() { return self.renderContent(request_path, output_extension, last_modified, options, callback_handler); }
		];

		rendering_steps.shift().call();
	}

};
