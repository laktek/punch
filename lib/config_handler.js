var _ = require("underscore");
var Fs = require("fs");
var Path = require("path");

var DefaultConfig = require("./default_config");
var DeepExtend = require("./utils/deep_extend");

module.exports = {

	readConfig: function(config_path, callback) {
		var self = this;

		Fs.stat(config_path, function(err, stat) {
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

		Fs.readFile(config_path, function(err, output) {
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

		if (!config_path) {
			return callback("config path can't be null", null);
		}

		Fs.readdir(config_path, function(err, files){
			if(err) {
				return callback(err, null);
			}

			var isConfigFile = function(file){
				return Path.extname(file) === ".json";
			};

			var readNextFileInDir = function(file, next) {
				if (isConfigFile(file)) {
					self.readConfigFile(Path.join(config_path, file), function(err, parsed_output){
						if(!err) {
							var section_config = {};

							if (file !== "main.json") {
								section_config[Path.basename(file, ".json")] = parsed_output;
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
					var default_config_clone = DeepExtend({}, DefaultConfig);
					return callback(DeepExtend(default_config_clone, user_defined_config));
				}
			});
		};

		return readConfigCallback();
	}

};
