var module_utils = require("./utils/module_utils.js");

module.exports = {

	templates: null,

	contents: null,

	setup: function(config){
		var self = this;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
	},

	generate: function(){
		var self = this;	

		self.templates.getSections("", function(sections){
			console.log(sections);	
		});
		
		self.contents.getSections("", function(sections){
			console.log(sections);	
		});
	}

}
