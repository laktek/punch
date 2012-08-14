var _ = require("underscore");
var path = require("path");

var renderer = require("./page_renderer.js");
var asset_bundler = require("./asset_bundler.js");
var module_utils = require("./utils/module_utils.js");
var path_utils = require("./utils/path_utils.js");

module.exports = {

	templates: null,

	contents: null,

	templateEngine: null,	

	cacheStore: null,

	clearCache: false,

	compilers: {},

	generatorHooks: [],

	setup: function(config){
		var self = this;

		self.blankState = config.generator.blank;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
		self.templateEngine = module_utils.requireAndSetup(config.plugins.template_engine, config);
		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);

		_.each(config.plugins.compilers, function(value, key) {
			self.compilers[key] = module_utils.requireAndSetup(value, config);	
		});

		_.each(config.plugins.generator_hooks, function(hook, key) {
			self.generatorHooks.push(module_utils.requireAndSetup(hook, config));	
		});

		renderer.setup(config);
		asset_bundler.setup(config);
	},

	clearCache: function(callback) {
		var self = this;

		if(self.blankState) {
			self.cacheStore.clear(function() {
				return callback();	
			});
		} else {
			return callback();	
		}		
	},

	collectSections: function(callback){
		var self = this;
		var collected_sections = [];

		self.templates.getSections(function(template_sections){
			self.contents.getSections(function(content_sections){
				collected_sections = _.union(template_sections, content_sections);
				return callback(null, collected_sections);
			});
		});
	},

	getStaticAndCompilableTemplates: function(section, callback){
		var self = this;
		var collected_paths = [];

		self.templates.getTemplates(section, function(err, templates){
			if(err){
				return callback(err, []);	
			}
			
			_.each(templates, function(template){
				var template_path = template.full_path;
				var extname = path.extname(template_path);

				// check whether the given template is non-renderble.
				if(extname !== self.templateEngine.extension){
					// check if the template can be compiled
					var matching_extension = _.find(_.keys(self.compilers), function(compiler_name){
						return _.include(self.compilers[compiler_name].input_extensions, extname)
					});

					if(matching_extension){
						collected_paths.push(template_path.replace(extname, matching_extension));	
					} else {
						collected_paths.push(template_path);	
					}
				}
			});

			return callback(null, collected_paths);
		});
	},

	collectPathsForSection: function(section, callback) {
		var self = this;

		self.contents.getContents(section, function(err, content_paths){
			self.getStaticAndCompilableTemplates(section, function(err, template_paths){
				return callback(null, _.union(content_paths, template_paths));
			});
		});
	},

	collectPaths: function(callback){
		var self = this;
		var collected_paths = [];

		self.collectSections(function(err, sections) {

			var collectPathsCallback = function(err, paths_for_section) {
				Array.prototype.push.apply(collected_paths, paths_for_section);

				if(sections.length){
					return self.collectPathsForSection(sections.pop(), collectPathsCallback);		
				}	else {
					return callback(collected_paths);		
				}
			};
				
			return self.collectPathsForSection(sections.pop(), collectPathsCallback);		
		});
	},

	renderPath: function(request_path, callback) {
		var self = this;

		var file_extension = path_utils.getExtension(request_path, []);
		var request_basename = path_utils.getBasename(request_path, file_extension);

		var options = {};

		var store_if_modified = function(rendered_obj){
			if(rendered_obj.modified){
				self.cacheStore.update(request_basename, file_extension, rendered_obj.body, {}, function(err){
					return callback(request_path);
				});
			} else {
				return callback();
			} 
		};

		self.cacheStore.stat(request_basename, file_extension, function(err, stat){
			var last_modified = (stat && stat.mtime) || null;
			return renderer.render(request_basename, file_extension, last_modified, options, store_if_modified);	
		});
	},

	renderEachPath: function(paths, callback) {
		var self = this;
		
		var move_to_next_path = function() {
			if (paths.length) {
				return self.renderPath(paths.pop(), function(rendered_path) {
					return self.runGeneratorHooks(rendered_path, move_to_next_path);	
				});	
			} else {
				return callback();	
			}
		}

		return move_to_next_path();
	},

	buildBundles: function(callback) {
		var self = this;

		var run_generator_hooks = function(bundled_path, bundler_callback) {
			return self.runGeneratorHooks(bundled_path, bundler_callback);	
		};

		return asset_bundler.touchBundles(run_generator_hooks, callback);
	},

	runGeneratorHooks: function(rendered_path, callback) {
		var self = this;

		var generator_hooks_cloned = self.generatorHooks.slice(0);

		var run_generator_hooks = function() {
			if (generator_hooks_cloned.length) {
				var generator_hook = generator_hooks_cloned.pop();
				return generator_hook.run(rendered_path, run_generator_hooks);	
			} else {
				return callback();	
			}
		}

		return run_generator_hooks();
	},

	generate: function(complete) {
		var self = this;	
		
		var steps = [
			self.clearCache,
			self.collectPaths,
			self.renderEachPath,
			self.buildBundles
		];

		var run_next_step = function(result) {
			var method_args = [run_next_step];

			if (result) {
				method_args.unshift(result);	
			}

			if (steps.length) {
				return steps.shift().apply(self, method_args);
			} else {
				return complete();	
			}
		}

		return run_next_step();
	}
}
