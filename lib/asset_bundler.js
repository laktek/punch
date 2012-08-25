var path = require("path");
var _ = require("underscore");

var module_utils = require("./utils/module_utils.js");

var withoutFingerprint = function(name) {
	return name.replace(/-[\S]*$/, "");
};

module.exports = {

	templates: null,

	cacheStore: null,

	minifiers: {},

	compilers: {},

	bundleOptions: {},

	bundles: {},

	setup: function(config) {
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);

		_.each(config.plugins.compilers, function(value, key) {
			self.compilers[key] = module_utils.requireAndSetup(value, config);
		});

		_.each(config.plugins.minifiers, function(value, key) {
			self.minifiers[key] = module_utils.requireAndSetup(value, config);
		});

		self.bundles = _.extend(self.bundles, config.bundles);

		self.bundleOptions = _.extend(self.bundleOptions, config.bundle_options);
	},

	compileAndMinify: function(template_path, compiler, minifier, callback) {
		var self = this;

		if (!minifier) {
			return callback("No minifier found", null);
		}

		var template_extension = path.extname(template_path);

		self.templates.readTemplate(template_path, function(err, template_output) {
			if (err) {
				return callback(err, null);
			}

			if (compiler && compiler.input_extensions.indexOf(template_extension) > -1)	{
				compiler.compile(template_output, path.join(self.templates.templateDir, template_path), function(err, compiled_output) {
					if(err) {
						return callback(err, null);
					}

					return minifier.minify(compiled_output, callback);
				});
			} else {
				return minifier.minify(template_output, callback);
			}
		});
	},

	prepareBundle: function(bundle, output_extension, callback) {
		var self = this;

		var compiler = self.compilers[output_extension];
		var minifier = self.minifiers[output_extension];

		var cloned_bundle_templates = bundle.slice(0);
		var minified_outputs = [];

		var fetch_compile_and_minify = function() {
			if (cloned_bundle_templates.length) {
				self.compileAndMinify(cloned_bundle_templates.shift(), compiler, minifier, function(err, minified_output) {
					if (!err) {
						minified_outputs.push(minified_output);
					}

					return fetch_compile_and_minify();
				});
			} else {
				return callback(minified_outputs.join(""));
			}
		};

		return fetch_compile_and_minify();
	},

	getBundle: function(request_basename, file_extension, callback) {
		var self = this;
		var bundle_name = withoutFingerprint(request_basename);
		var bundle_options = _.extend({}, self.bundleOptions);
		var bundle_header = bundle_options.header || {};

		var bundle = self.bundles[bundle_name + file_extension];

		if (!bundle) {
			return callback("[Error: There's no Bundle for the given path]", null);
		}

		var prepare_bundle_and_update_cache = function() {
			return self.prepareBundle(bundle, file_extension, function(minified_output) {
				return self.cacheStore.update(bundle_name, file_extension, minified_output, bundle_header, function(err, cache_obj){
					bundle_options.header = cache_obj.options.header;
					return callback(null, { "body": minified_output, "modified": true, "options": bundle_options });
				});
			});
		};

		self.cacheStore.stat(bundle_name, file_extension, function(err, stat) {
			if (err) {
				return prepare_bundle_and_update_cache();
			}

			var cloned_bundle_files = bundle.slice(0);

			var check_for_modified = function() {
				if (cloned_bundle_files.length) {
					self.templates.getTemplate(cloned_bundle_files.shift(), function(err, template) {
						if (err) {
							return check_for_modified();
						}

						if (template.last_modified > stat.mtime) {
							return prepare_bundle_and_update_cache();
						} else {
							return check_for_modified();
						}
					});
				} else {
					return self.cacheStore.get(bundle_name, file_extension, bundle_header, function(err, cache_obj) {
						bundle_options.header = cache_obj.options.header;
						return callback(null, { "body": cache_obj.body, "modified": false, "options": bundle_options });
					});
				}
			};

			return check_for_modified();
		});
	},

	statBundle: function(request_basename, file_extension, callback) {
		var self = this;
		var bundle_name = withoutFingerprint(request_basename);

		var bundle = self.bundles[bundle_name + file_extension];

		if (!bundle) {
			return callback("[Error: There's no Bundle for the given path]", null);
		}

		var cloned_bundle_files = bundle.slice(0);
		var bundle_mtime = null;

		var traverse_bundled_files = function() {
			if (cloned_bundle_files.length) {
				self.templates.getTemplate(cloned_bundle_files.shift(), function(err, template) {
					if (err) {
						return traverse_bundled_files();
					}

					var current_mtime = template.last_modified;
					if (current_mtime > bundle_mtime) {
						bundle_mtime = current_mtime;
					}

					return traverse_bundled_files();
				});
			} else {
				return callback(null, { "mtime": bundle_mtime });
			}
		};

		return traverse_bundled_files();
	},

	touchBundles: function(after, complete) {
		var self = this;

		var collected_bundles = [];

		_.each(self.bundles, function(value, entry) {
			var extension = path.extname(entry);
			var basename = entry.substr(0, entry.indexOf(extension));

			collected_bundles.push([ basename, extension ]);
		});

		var touch_next_bundle = function() {
			if (collected_bundles.length) {
				var params = collected_bundles.shift();

				params.push(function(err, bundle_obj) {
					// set the bundle path only for the modified bundles
					// this is to let generator hooks to skip callbacks without a path.
					var bundle_path = (bundle_obj.modified) ? ( params[0] + params[1] ) : null;
					after(bundle_path, function() {
						return touch_next_bundle();
					});
				});

				return self.getBundle.apply(self, params);
			} else {
				return complete();
			}
		};

		return touch_next_bundle();
	},

	isBundlePath: function(basename, file_extension) {
		var self = this;

		var bundle_names = _.keys(self.bundles);

		var bundle_path = withoutFingerprint(basename) + file_extension;

		return (bundle_names.indexOf(bundle_path) >  -1);
	}

};
