var path = require("path");
var fs = require("fs");

module.exports = {

	templateDir: null,

	// get the template matching the exact path
	getTemplate: function(template_path, callback){
		var self = this;

		fs.stat(path.join(self.templateDir, template_path), function(err, stat){
			if(err){
				return callback(err, null);	
			}	
			
			return callback(null, {"full_path": template_path, "last_modified": stat.mtime });		
		});		
	},

  // get all templates fuzzly matches the path
	getTemplates: function(basepath, callback){
	
	},

	// reads and outputs the template matching the exact path
	readTemplate: function(template_path, callback){
		var self = this;

		fs.readFile(path.join(self.templateDir, template_path), function(err, data){
			return callback(err, data);	
		});	
	},

 // read the best template fuzzly matches the path
	negotiateTemplate: function(basepath, extension, options, callback){
	
	},

	// get all partials matching the given path
	getPartials: function(basepath, extension, options, callback){
	
	}

}
