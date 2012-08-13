var path = require("path");
var _ = require("underscore");

var module_utils = require("./utils/module_utils.js");

module.exports = {

	templates: null,

	cacheStore: null,

	minifiers: {},

	compilers: {},

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
				compiler.compile(template_output, function(err, compiled_output) {
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

	prepareBundle: function(bundle, bundle_type, callback) {
		var self = this;

		var output_extension = "." + bundle_type;
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
		}

		return fetch_compile_and_minify();	
	},	
		
	getBundle: function(request_basename, file_extension, callback) {
		var self = this;

		var bundle_type = file_extension.substr(1);	
		var bundle = self.bundles[bundle_type][request_basename + file_extension];

		if (!bundle) {
			return callback("There's no Bundle for the given path", null);
		}

		self.cacheStore.stat(request_basename, file_extension, function(err, stat) {
			if (err) {
				return self.prepareBundle(bundle, bundle_type, callback);	
			}	

			var cloned_bundle_files = bundle.slice(0);

			var check_for_modified = function() {
				if (cloned_bundle_files.length) {
					self.templates.getTemplate(cloned_bundle_files.shift(), function(err, template) {
						if (err) {
							return check_for_modified();	
						}

						if (template.last_modified > stat.mtime) {
							return self.prepareBundle(bundle, bundle_type, function(minified_output) {
								return self.cacheStore.update(request_basename, file_extension, minified_output, {}, function(err){
									return callback(minified_output);
								});							
							});	
						} else {
							return check_for_modified();	
						}
					});
				} else {
					return self.cacheStore.get(request_basename, file_extension, {}, function(err, cache_obj) {
						return callback(cache_obj.body);
					});	
				}
			}

			return check_for_modified();
		});
	},

	touchEachBundle: function() {
		var self = this;

		var bundle_types = _.keys(self.bundles);	

	}	

}
