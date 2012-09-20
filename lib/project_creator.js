var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

module.exports = {

	getDefaultTemplate: function() {
		return path.join(__dirname, "../boilerplates/default");
	},

	createStructure: function(dir_path, template_path) {
		var self = this;

		// if template path is undefined, use the default bare template
		template_path = template_path || self.getDefaultTemplate();

		var createSiteDirectory = function(site_dir_path, callback) {
			fs.stat(site_dir_path, function(err, stat) {
				if (err || !stat.isDirectory()) {
					return fs.mkdir(site_dir_path, callback);
				} else {
					return callback(null, site_dir_path);
				}
			});
		};

		var createSiteStructure = function(destination_path, source_path) {
			var copy_command = "cp -r " + source_path + "/* " + destination_path;

			child_process.exec(copy_command, function(err, stdout, stderr) {
				if(err) {
					throw err;
				}

				console.log("Created a new site in " + destination_path);
				console.log("To get started, run: cd " + destination_path + "; punch s");
			});
		};

		if (dir_path && dir_path !== ".") {
			createSiteDirectory(dir_path, function(err) {
				if (err) {
					console.log("Failed to create the site in " + dir_path);
					return false;
				}
				return createSiteStructure(dir_path, template_path);
			});
		} else {
			createSiteStructure(process.cwd(), template_path);
		}
	}

};
