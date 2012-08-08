var fs = require("fs");
var path = require("path");

module.exports = {

	bare_structure: function(dir_path) {
		var self = this;

		var createSiteDirectory = function(site_dir_path, callback) {
			fs.stat(site_dir_path, function(err, stat) {
				if (err || !stat.isDirectory()) {
					return fs.mkdir(site_dir_path, callback); 
				} else {
					return callback(null, site_dir_path);	
				}	
			});
		};

		var createSiteStructure = function(use_dir_path) {
			console.log("Setting up site structure inside " + use_dir_path);

			fs.mkdir(path.join(use_dir_path, "templates"), function(err) {
				if (!err) {
					console.log("Created templates directory");	
				}	
			});

			fs.mkdir(path.join(use_dir_path, "contents"), function(err) {
				if (!err) {
					console.log("Created contents directory");	
				}	
			});

			var config_file = '{\n\"template_dir": "templates",\n\"content_dir": "contents",\n\"output_dir": "public",\n\"server": {\n\  "port": 9009\n\ }\n\}';
			fs.writeFile(path.join(use_dir_path, "config.json"), config_file, function(err) {
				if (!err)	{
					console.log("Created config.json");	
				}
			});
		};

		if (dir_path && dir_path !== ".") {
			createSiteDirectory(dir_path, function(err) {
				if (err) {
					console.log("Failed to create the site in " + dir_path);
					return
				}
				return createSiteStructure(dir_path);	
			});
		} else {
			createSiteStructure(process.cwd());
		}	
	},

	// TODO
	from_template: function(template_path) {
		var self = this;		

	}	

}
