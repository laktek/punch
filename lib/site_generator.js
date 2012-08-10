var _ = require("underscore");
var path = require("path");

var renderer = require("./page_renderer.js");
var module_utils = require("./utils/module_utils.js");
var path_utils = require("./utils/path_utils.js");

module.exports = {

	templates: null,

	contents: null,

	templateEngine: null,	

	cacheStore: null,

	compilers: {},

	setup: function(config){
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
		self.templateEngine = module_utils.requireAndSetup(config.plugins.template_engine, config);
		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);

		_.each(config.plugins.compilers, function(value, key){
			self.compilers[key] = module_utils.requireAndSetup(value, config);	
		});

		renderer.setup(config);
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

	storeOutput: function(request_path, callback){
		var self = this;

		var file_extension = path_utils.getExtension(request_path, []);
		var request_basename = path_utils.getBasename(request_path, file_extension);

		var options = {};

		var store_if_modified = function(rendered_obj){
			if(rendered_obj.modified){
				// cache the result
				self.cacheStore.update(request_basename, file_extension, rendered_obj.body, function(err){
					return callback();
				});
			} else {
				return callback();
			} 
		};

		self.cacheStore.stat(request_basename, file_extension, function(err, stat){
			return renderer.render(request_basename, file_extension, stat.mtime, options, store_if_modified);	
		});
	},

	collectPaths: function(section, callback){
		var self = this;
		var collected_paths = [];

		self.contents.getContents(section, function(err, content_paths){
			self.getStaticAndCompilableTemplates(section, function(err, template_paths){
				return callback(null, _.union(content_paths, template_paths));
			});
		});
	},

	generate: function(callback){
		var self = this;	
		var collected_paths = [];

		var render_path_callback = function(){
			if(collected_paths.length){
				return self.storeOutput(collected_paths.pop(), render_path_callback);	
			} else {
				return callback();	
			}		
		};
		
		self.collectSections(function(err, sections){

			var collectPathsCallback = function(err, paths_for_section){
				Array.prototype.push.apply(collected_paths, paths_for_section);

				if(sections.length){
					return self.collectPaths(sections.pop(), collectPathsCallback);		
				}	else {
					return render_path_callback();		
				}
			};
			
			return collectPathsCallback(null, []);
		});

	}

}
