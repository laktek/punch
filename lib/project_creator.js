var Fs = require("fs");
var Os = require("os");
var Path = require("path");
var ChildProcess = require("child_process");

module.exports = {

	getDefaultTemplate: function() {
		return Path.join(__dirname, "../boilerplates/default");
	},

	createStructure: function(dir_path, template_path) {
		var self = this;

		// if template path is undefined, use the default bare template
		template_path = template_path || self.getDefaultTemplate();

		var createSiteDirectory = function(site_dir_path, callback) {
			Fs.stat(site_dir_path, function(err, stat) {
				if (err || !stat.isDirectory()) {
					return Fs.mkdir(site_dir_path, callback);
				} else {
					return callback(null, site_dir_path);
				}
			});
		};

		var createSiteStructure = function(destination_path, source_path) {
			var copy_command;

			if (Os.platform() === "win32") {
				copy_command = "ROBOCOPY " + source_path + " " + destination_path + " *.* /E";
			} else {
				copy_command = "cp -r " + source_path + "/* " + destination_path;
			}

			ChildProcess.exec(copy_command, function(err, stdout, stderr) {
				if (err && Os.platform() === "win32" && err.code <= 3) {
				} else if(err) {
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
