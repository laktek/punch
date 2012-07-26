var _ = require("underscore");
var path = require("path");
var module_utils = require("./utils/module_utils.js");

module.exports = {

	templates: null,

	contents: null,

	templateEngine: null,	

	setup: function(config){
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
		self.templateEngine = module_utils.requireAndSetup(config.plugins.template_engine, config);
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
						
				}
			});
		});
	},

	generate: function(){
		var self = this;	
		
		// collect sections
		// for each section
		// -- get contents
		// -- get static and compilable templates
		// -- render each path
		// -- store the result in cache
	}

}
