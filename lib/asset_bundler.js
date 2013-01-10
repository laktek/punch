var path = require("path");
var _ = require("underscore");

var module_utils = require("./utils/module_utils.js");
var object_utils = require("./utils/object_utils.js");
var path_utils = require("./utils/path_utils.js");

var withoutFingerprint = function(name) {
	return name.replace(/-\d+$/, "");
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

		self.bundleOptions = _.extend(self.bundleOptions, config.asset_bundling);

	},

	compileAndMinify: function(template_path, template_extension, compiler, minifier, callback) {
		var self = this;

		if (!minifier) {
			return callback("No minifier found", null);
		}

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

				var current_template_path = cloned_bundle_templates.shift();
				var current_template_extension = path_utils.getExtension(current_template_path);

				self.compileAndMinify(current_template_path, current_template_extension, compiler, minifier, function(err, minified_output) {
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

	getContainedFilesInBundle: function(bundle_name, file_extension, callback) {
		var self = this;
		var defined_paths = self.bundles[bundle_name + file_extension];
		var resolved_paths = [];

		if (!defined_paths) {
			return callback("[Error: There's no Bundle for the given path]", null);
		} else {
			// create a copy of the paths
			defined_paths = defined_paths.slice(0);
		}

		var add_all_matching_paths = function(basename, extension_to_match, cb) {
			var dirpath = path.dirname(basename);
			var matching_paths = [];

			self.templates.getTemplates(dirpath, function(err, template_paths) {
				if (err) {
					return cb(err, matching_paths);
				}

				_.each(template_paths, function(current_path_obj) {
					var current_path = current_path_obj.full_path;
					var current_ext = path.extname(current_path);
					if (extension_to_match === "" || current_ext === extension_to_match) {
						matching_paths.push(current_path);
					}
				});

				return cb(null, matching_paths);
			});
		};

		var resolve_defined_paths = function(err, given_paths) {

			resolved_paths = resolved_paths.concat(given_paths);

			if (defined_paths.length) {
				var current_path = defined_paths.shift();
				var current_extension = path.extname(current_path);
				var current_basename = path_utils.getBasename(current_path, current_extension);

				if (self.isBundlePath(current_basename, current_extension)) {
					return self.getContainedFilesInBundle(current_basename, current_extension, resolve_defined_paths);
				}

				if (current_basename[current_basename.length - 1] === "*") {
					return add_all_matching_paths(current_basename, current_extension, resolve_defined_paths);
				}

				return resolve_defined_paths(null, current_path);
			}	else {
				return callback(null, resolved_paths);
			}
		};

		return resolve_defined_paths(null, []);
	},

	getBundle: function(request_basename, file_extension, request_options, callback) {
		var self = this;
		var bundle_name = withoutFingerprint(request_basename);
		var bundle_options = _.extend({}, self.bundleOptions);
		var bundle_header = bundle_options.header || {};

		self.getContainedFilesInBundle(bundle_name, file_extension, function(err, bundled_files) {

			if (err) {
				return callback(err, null);
			}

			var prepare_bundle_and_update_cache = function() {
				return self.prepareBundle(bundled_files, file_extension, function(minified_output) {
					return self.cacheStore.update(bundle_name, file_extension, object_utils.cacheObj(minified_output, bundle_header), request_options, function(err, cache_obj) {
						bundle_options.header = cache_obj.options.header;
						return callback(null, { "body": minified_output, "modified": true, "options": bundle_options });
					});
				});
			};

			self.cacheStore.stat(bundle_name, file_extension, request_options, function(err, stat) {
				if (err) {
					return prepare_bundle_and_update_cache();
				}

				var cloned_bundled_files = bundled_files.slice(0);

				var check_for_modified = function() {
					if (cloned_bundled_files.length) {
						self.templates.getTemplate(cloned_bundled_files.shift(), function(err, template) {
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
						return self.cacheStore.get(bundle_name, file_extension, object_utils.cacheObj(null, bundle_header), request_options, function(err, cache_obj) {
							bundle_options.header = cache_obj.options.header;
							return callback(null, { "body": cache_obj.body, "modified": false, "options": bundle_options });
						});
					}
				};

				return check_for_modified();
			});

		});
	},

	statBundle: function(request_basename, file_extension, callback) {
		var self = this;
		var bundle_name = withoutFingerprint(request_basename);

		self.getContainedFilesInBundle(bundle_name, file_extension, function(err, bundled_files) {

			if (err) {
				return callback(err, null);
			}

			var bundle_mtime = null;

			var traverse_bundled_files = function() {
				if (bundled_files.length) {
					self.templates.getTemplate(bundled_files.shift(), function(err, template) {
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
		});
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

				//push the options
				params.push({});

				params.push(function(err, bundle_obj) {
					var bundle_path = params[0] + params[1];

					// create the fingerprinted bundle
					if (self.bundleOptions.fingerprint) {
						self.fingerprintBundle(bundle_path, after);
					}

					// set the bundle path only if the bundle is modified.
					// this is to let generator hooks to skip the callback if path is null.
					var path_to_notify = (bundle_obj.modified) ? bundle_path : null;
					after(path_to_notify, function() {
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

	fingerprintBundle: function(bundle_path, callback) {
		var self = this;

		if (!bundle_path) {
			return callback();
		}

		var bundle_extension = path_utils.getExtension(bundle_path);
		var bundle_basename = path_utils.getBasename(bundle_path, bundle_extension);

		self.statBundle(bundle_basename, bundle_extension, function(err, stat) {
			if (err) {
				return callback();
			}

			var bundle_fingerprint = stat.mtime.getTime();
			var fingerprinted_bundle_path = bundle_basename + "-" + bundle_fingerprint;

			self.cacheStore.get(bundle_basename, bundle_extension, {}, null, function(err, bundle_content) {
				if (err) {
					return callback();
				}

				self.cacheStore.update(fingerprinted_bundle_path, bundle_extension, bundle_content, {}, function(err) {
					return callback(fingerprinted_bundle_path + bundle_extension, function() { });
				});
			});
		});
	},

	isBundlePath: function(basename, file_extension) {
		var self = this;

		var bundle_names = _.keys(self.bundles);

		var bundle_path = withoutFingerprint(basename) + file_extension;

		return (bundle_names.indexOf(bundle_path) >  -1);
	}

};
