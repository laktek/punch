var _ = require("underscore");
var fs = require("fs");
var path = require("path");

var default_config = require("./default_config.js");
var deep_extend = require("./utils/deep_extend.js");

module.exports = {

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

			var parsed_output, error;

			try {
				parsed_output = JSON.parse(output);
			} catch(e) {
				error = e;
			}

			return callback(error, parsed_output);
		});
	},

	readConfigDir: function(config_path, callback) {
		var self = this;
		var combined_config = {};

		fs.readdir(config_path, function(err, files){
			if(err) {
				return callback(err, null);
			}

			var isConfigFile = function(file){
				return path.extname(file) === ".json";
			};

			var readNextFileInDir = function(file, next) {
				if (isConfigFile(file)) {
					self.readConfigFile(path.join(config_path, file), function(err, parsed_output){
						if(!err) {
							var section_config = {};

							if (file !== "main.json") {
								section_config[path.basename(file, ".json")] = parsed_output;
							} else {
								section_config = parsed_output;
							}

							combined_config = _.extend(combined_config, section_config);
						}

						return next();
					});
				} else {
					return next();
				}
			};

			var readNexFileInDirCallback = function() {
				if (files.length) {
					return readNextFileInDir(files.pop(), readNexFileInDirCallback);
				} else {
					return callback(null, combined_config);
				}
			};

			return readNexFileInDirCallback();
		});
	},

	getConfig: function(config_path, callback) {
		var self = this;
		var alternate_config_paths = [ "config.json", "config" ];

		if (config_path) {
			alternate_config_paths.unshift(config_path);
		}

		var readConfigCallback = function() {
			self.readConfig(alternate_config_paths.shift(), function(err, user_defined_config) {
				if (err) {
					if (alternate_config_paths.length) {
						return readConfigCallback();
					} else {
						throw("Failed to read the configurations.\nIf you have already created a config file, please check it for any syntax errors.");
					}
				} else {
					var default_config_clone = deep_extend({}, default_config);
					return callback(deep_extend(default_config_clone, user_defined_config));
				}
			});
		};

		return readConfigCallback();
	}

};
