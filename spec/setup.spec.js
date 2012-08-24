var setup = require("../lib/setup.js");

var fs = require("fs");

describe("creating a bare structure", function() {

	it("create the site directory if needed", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(fs, "mkdir");

		setup.bare_structure("site_path");

		expect(fs.mkdir).toHaveBeenCalledWith("site_path", jasmine.any(Function));

	});

	it("create the structure if site directory already exists", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			return callback(null);
		});

		setup.bare_structure("site_path");

		expect(fs.mkdir).toHaveBeenCalledWith("site_path/templates", jasmine.any(Function));
	});

	it("don't create the structure if site directory creation fails", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			if (path === "site_path") {
				return callback("error");
			}

			return callback(null);
		});

		setup.bare_structure("site_path");

		expect(fs.mkdir).not.toHaveBeenCalledWith("site_path/templates", jasmine.any(Function));
	});

	it("create the templates directory in the given path", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return false } });
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			return callback(null);
		});

		setup.bare_structure("site_path");

		expect(fs.mkdir).toHaveBeenCalledWith("site_path/templates", jasmine.any(Function));
	});

	it("create the contents directory in the given path", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return false } });
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			return callback(null);
		});

		setup.bare_structure("site_path");

		expect(fs.mkdir).toHaveBeenCalledWith("site_path/contents", jasmine.any(Function));
	});

	it("create the config file in the given path", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return false } });
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			return callback(null);
		});

		var config_file = "{\n  \"template_dir\": \"templates\",\n  \"content_dir\": \"contents\",\n  \"output_dir\": \"public\",\n  \"server\": {\n    \"port\": 9009\n  }\n}";
		spyOn(fs, "writeFile");

		setup.bare_structure("site_path");

		expect(fs.writeFile).toHaveBeenCalledWith("site_path/config.json", config_file, jasmine.any(Function));
	});

	it("use the current path if no path is given", function(){
		spyOn(process, "cwd").andReturn("current_path");
		spyOn(fs, "mkdir");

		setup.bare_structure();

		expect(fs.mkdir).toHaveBeenCalledWith("current_path/templates", jasmine.any(Function));
	});

	it("use the current path if dot is given as the path", function(){
		spyOn(process, "cwd").andReturn("current_path");
		spyOn(fs, "mkdir");

		setup.bare_structure(".");

		expect(fs.mkdir).toHaveBeenCalledWith("current_path/templates", jasmine.any(Function));
	});

});

// TODO
describe("creating from a template", function() {

});
