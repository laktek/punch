var fs = require("fs");

module.exports = {

	// if a directory is given, combine all JSON files in it into a single input

	readConfig: function(config_path, callback) {
		var self = this;

		fs.stat(config_path, function(err, stat) {
			if (err) {
				return callback(err, null);	
			}

			if (stat.isDirectory()) {
				return self.readConfigDir(config_path, callback);			
			}	else {
				return self.readConfigFile(config_path, callback);			
			}
		});
	},

	readConfigFile: function(config_path, callback) {
		var self = this;	

		fs.readFile(config_path, function(err, output) {
			if (err) {
				return callback(err, null);	
			}

			try {
				return callback(null, JSON.parse(output));	
			} catch(e) {
				return callback(e, null);	
			}
		});
	},

	readConfigDir: function(config_path, callback) {
	
	}
	
	// extend the default config, with given config
	// extend exisiting array and object values correctly
	// only override the existing array and object values if "propertyOverride" is defined

}
