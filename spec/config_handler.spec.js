var ConfigHandler = require("../lib/config_handler.js");

var Fs = require("fs");
var Path = require("path");

describe("read the given config", function() {

	it("check if the config path is a directory", function() {
		spyOn(Fs, "stat");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfig("path/config", spyCallback);

		expect(Fs.stat).toHaveBeenCalledWith("path/config", jasmine.any(Function));
	});

	it("read the directory if given config is a directory", function() {
		spyOn(Fs, "stat").andCallFake(function(config_path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(ConfigHandler, "readConfigDir");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfig("path/config", spyCallback);

		expect(ConfigHandler.readConfigDir).toHaveBeenCalledWith("path/config", spyCallback);
	});

	it("read the file if given config is a file", function() {
		spyOn(Fs, "stat").andCallFake(function(config_path, callback) {
			return callback(null, { "isDirectory": function() { return false } });
		});

		spyOn(ConfigHandler, "readConfigFile");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfig("path/config", spyCallback);

		expect(ConfigHandler.readConfigFile).toHaveBeenCalledWith("path/config", spyCallback);
	});

	it("call the callback with an error if stat returns an error", function() {
		spyOn(Fs, "stat").andCallFake(function(config_path, callback) {
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfig("path/config", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

});

describe("read the config form a file", function() {

	it("read the config file from the file system", function() {
		spyOn(Fs, "readFile");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigFile("path/config", spyCallback);

		expect(Fs.readFile).toHaveBeenCalledWith("path/config", jasmine.any(Function));
	});

	it("call the callback with the parsed output of the config file", function() {

		var sample_json = {"key": "value"};

		spyOn(Fs, "readFile").andCallFake(function(config_path, callback) {
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigFile("path/config", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, sample_json);
	});

	it("call the callback with the error if an error occurrs when reading the file", function() {
		spyOn(Fs, "readFile").andCallFake(function(config_path, callback) {
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigFile("path/config", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("call the callback with the error if an error occurrs when parsing the file", function() {

		var sample_json = {"key": "value"};

		spyOn(Fs, "readFile").andCallFake(function(config_path, callback) {
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		spyOn(JSON, "parse").andCallFake(function() {
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigFile("path/config", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});

describe("read the config from a directory", function() {

	it("call the callback with the error if config path is null", function() {
		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir(null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("config path can't be null", null);
	});

	it("fetch all files in the given directory", function() {
		spyOn(Fs, "readdir");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir("path/config_dir", spyCallback);

		expect(Fs.readdir).toHaveBeenCalledWith("path/config_dir", jasmine.any(Function));
	});

	it("call the callback with the error if reading directory gives an error", function() {
		spyOn(Fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir("path/config_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("read only the config files in given directory", function() {
		spyOn(Fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback(null, ["plugins.json", "subdir", "publish.json", ".hidden_file"]);
		});

		spyOn(ConfigHandler, "readConfigFile").andCallFake(function(config_file, callback){
			return callback(null, { });
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir("path/config_dir", spyCallback);

		expect(ConfigHandler.readConfigFile.callCount).toEqual(2);
	});

	it("call the callback with the combined output of each config file", function() {
		spyOn(Fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback(null, [ "plugins.json", "subdir", "publish.json", ".hidden_file" ]);
		});

		spyOn(ConfigHandler, "readConfigFile").andCallFake(function(config_file, callback){
			if (config_file === Path.join("path/config_dir/plugins.json") ) {
				return callback(null, { "plugin_name": "plugin_path" });
			} else {
				return callback(null, { "strategy": "" });
			}
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir("path/config_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "plugins": { "plugin_name": "plugin_path" }, "publish": { "strategy": "" } });
	});

	it("don't nest main config values", function() {
		spyOn(Fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback(null, [ "main.json", "plugins.json", "subdir", "publish.json", ".hidden_file" ]);
		});

		spyOn(ConfigHandler, "readConfigFile").andCallFake(function(config_file, callback){
			if (config_file === Path.join("path/config_dir/main.json") ) {
				return callback(null, { "main_key": "main_value" });
			} else if (config_file === Path.join("path/config_dir/plugins.json") ) {
				return callback(null, { "plugin_name": "plugin_path" });
			} else {
				return callback(null, { "strategy": "" });
			}
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.readConfigDir("path/config_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "main_key": "main_value", "plugins": { "plugin_name": "plugin_path" }, "publish": { "strategy": "" } });
	});

});

describe("get config", function() {

	it("read the config in given path", function() {
		spyOn(ConfigHandler, "readConfig");

		var spyCallback = jasmine.createSpy();
		ConfigHandler.getConfig("custom_config.json", spyCallback);

		expect(ConfigHandler.readConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("read the config directory if user-defined config path is invalid", function() {
		spyOn(ConfigHandler, "readConfig").andCallFake(function(config_path, callback) {
			if (config_path === "config") {
				return callback(null, {});
			}	else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.getConfig("custom_config.json", spyCallback);

		expect(ConfigHandler.readConfig).toHaveBeenCalledWith("config", jasmine.any(Function));
	});

	it("try to read config.json if there's no config directory or path is given", function() {
		spyOn(ConfigHandler, "readConfig").andCallFake(function(config_path, callback) {
			if (config_path === "config.json") {
				return callback(null, {});
			}	else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		ConfigHandler.getConfig("custom_config.json", spyCallback);

		expect(ConfigHandler.readConfig).toHaveBeenCalledWith("config.json", jasmine.any(Function));
	});

	it("extend the user-defined config with default config", function() {
		spyOn(ConfigHandler, "readConfig").andCallFake(function(config_path, callback) {
			return callback(null, { "server": { "port": 3001 } });
		});

		ConfigHandler.getConfig("custom_config.json", function(output) {
			expect(output.server.port).toEqual(3001);
		});
	});

	it("return the default config if no user-defined config can be found", function() {
		spyOn(ConfigHandler, "readConfig").andCallFake(function(config_path, callback) {
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		expect(function() {
			ConfigHandler.getConfig("custom_config.json", spyCallback);
		}).toThrow();

	});

});

