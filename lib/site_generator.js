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

	setup: function(config){
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
		self.templateEngine = module_utils.requireAndSetup(config.plugins.template_engine, config);
		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);
	},

	collectSections: function(callback){
		var self = this;
		var collected_sections = [];

		self.templates.getSections("", function(template_sections){
			self.contents.getSections("", function(content_sections){
				collected_sections = _.union(template_sections, content_sections);
				callback(null, collected_sections);
			});
		});
	},

	getStaticAndCompilableTemplates: function(section, callback){
		var self = this;
		var collected_paths = [];

		self.templates.getTemplates(section, function(err, templates){
			if(err){
				return callback(err, null);	
			}
			
			_.each(templates, function(template){
				var template_path = template.full_path;
				var extname = path.extname(template_path);

				if(extname !== self.templateEngine.extension){
					collected_paths.push(template_path);	
				}
			});

			return callback(null, collected_paths);
		});
	},

	storeOutput: function(request_path, callback){
		var self = this;
		var file_extension = path_utils.getExtension(request_path, []);
		var options = {};

		var store_if_modified = function(rendered_obj){
			if(rendered_obj.modified){
				// cache the result
				self.cacheStore.update(request_path, file_extension, rendered_obj.body, function(err){
					return callback();
				});
			} else {
				return callback();
			} 
		};

		self.cacheStore.lastUpdated(request_path, file_extension, function(err, cache_last_updated){
			renderer.render(request_path, file_extension, cache_last_updated, options, store_if_modified);	
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
		
		self.collectSections("", function(sections){

			var collectPathsCallback = function(err, section_paths){
				Array.prototype.push.apply(collected_paths, section_paths);

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
