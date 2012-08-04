var config_handler = require("../lib/config_handler.js");

var fs = require("fs");

describe("read the given config", function() {

	it("check if the config path is a directory", function() {
		spyOn(fs, "stat");

		var spyCallback = jasmine.createSpy();
		config_handler.readConfig("path/config", spyCallback);	

		expect(fs.stat).toHaveBeenCalledWith("path/config", jasmine.any(Function));
	});

	it("read the directory if given config is a directory", function() {
		spyOn(fs, "stat").andCallFake(function(config_path, callback) {
			return callback(null, { "isDirectory": function() { return true } });	
		});

		spyOn(config_handler, "readConfigDir");

		var spyCallback = jasmine.createSpy();
		config_handler.readConfig("path/config", spyCallback);	

		expect(config_handler.readConfigDir).toHaveBeenCalledWith("path/config", spyCallback);
	});

	it("read the file if given config is a file", function() {
		spyOn(fs, "stat").andCallFake(function(config_path, callback) {
			return callback(null, { "isDirectory": function() { return false } });	
		});

		spyOn(config_handler, "readConfigFile");

		var spyCallback = jasmine.createSpy();
		config_handler.readConfig("path/config", spyCallback);	

		expect(config_handler.readConfigFile).toHaveBeenCalledWith("path/config", spyCallback);
	});

	it("call the callback with an error if stat returns an error", function() {
		spyOn(fs, "stat").andCallFake(function(config_path, callback) {
			return callback("error", null);	
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfig("path/config", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

});

describe("read the config form a file", function() {

	it("read the config file from the file system", function() {
		spyOn(fs, "readFile");

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigFile("path/config", spyCallback);	
		
		expect(fs.readFile).toHaveBeenCalledWith("path/config", jasmine.any(Function));
	});

	it("call the callback with the parsed output of the config file", function() {

		var sample_json = {"key": "value"};

		spyOn(fs, "readFile").andCallFake(function(config_path, callback) {
			return callback(null, new Buffer(JSON.stringify(sample_json)));	
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigFile("path/config", spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith(null, sample_json);
	});

	it("call the callback with the error if an error occurrs when reading the file", function() {
		spyOn(fs, "readFile").andCallFake(function(config_path, callback) {
			return callback("error", null);	
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigFile("path/config", spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("call the callback with the error if an error occurrs when parsing the file", function() {

		var sample_json = {"key": "value"};

		spyOn(fs, "readFile").andCallFake(function(config_path, callback) {
			return callback(null, new Buffer(JSON.stringify(sample_json)));	
		});

		spyOn(JSON, "parse").andCallFake(function() {
			throw "error"	
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigFile("path/config", spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

});

describe("read the config from a directory", function() {

	it("fetch all files in the given directory", function() {
		spyOn(fs, "readdir");

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigDir("path/config_dir", spyCallback);

		expect(fs.readdir).toHaveBeenCalledWith("path/config_dir", jasmine.any(Function));
	});

	it("call the callback with the error if reading directory gives an error", function() {
		spyOn(fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigDir("path/config_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("read only the config files in given directory", function() {
		spyOn(fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback(null, ["plugins.json", "subdir", "publish.json", ".hidden_file"]);
		});

		spyOn(config_handler, "readConfigFile").andCallFake(function(config_file, callback){
			return callback(null, { });
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigDir("path/config_dir", spyCallback);

		expect(config_handler.readConfigFile.callCount).toEqual(2);
	});

	it("call the callback with the combined output of each config file", function() {
		spyOn(fs, "readdir").andCallFake(function(dir_path, callback) {
			return callback(null, [ "plugins.json", "subdir", "publish.json", ".hidden_file" ]);
		});

		spyOn(config_handler, "readConfigFile").andCallFake(function(config_file, callback){
			if (config_file === "plugins.json") {
				return callback(null, { "plugin_name": "plugin_path" });
			} else {
				return callback(null, { "strategy": "" });
			}
		});

		var spyCallback = jasmine.createSpy();
		config_handler.readConfigDir("path/config_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "plugins": { "plugin_name": "plugin_path" }, "publish": { "strategy": "" } });
	});
	
});

