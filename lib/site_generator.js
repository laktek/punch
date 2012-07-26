var _ = require("underscore");
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

	getStaticAndCompilableTemplates: function(){
	
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
