var project_creator = require("../lib/project_creator.js");

var fs = require("fs");
var child_process = require("child_process");

describe("creating a bare structure", function() {

	it("create the site directory if needed", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(fs, "mkdir");

		project_creator.createStructure("site_path");

		expect(fs.mkdir).toHaveBeenCalledWith("site_path", jasmine.any(Function));
	});

	it("create the structure using the given template", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(child_process, "exec");

		project_creator.createStructure("site_path", "path/to/template");

		expect(child_process.exec).toHaveBeenCalledWith("cp -r path/to/template/* site_path", jasmine.any(Function));
	});

	it("use the default template to create the structure if no template given", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(child_process, "exec");

		spyOn(project_creator, "getDefaultTemplate").andReturn("default_template_path");

		project_creator.createStructure("site_path");

		expect(child_process.exec).toHaveBeenCalledWith("cp -r default_template_path/* site_path", jasmine.any(Function));
	});

	it("don't create the structure if site directory creation fails", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(fs, "mkdir").andCallFake(function(path, callback) {
			return callback("error");
		});

		spyOn(child_process, "exec");

		project_creator.createStructure("site_path");

		expect(child_process.exec).not.toHaveBeenCalled();

	});

	it("use the current path if no path is given", function(){
		spyOn(process, "cwd").andReturn("current_path");

		spyOn(child_process, "exec");

		project_creator.createStructure(null, "path/to/template");

		expect(child_process.exec).toHaveBeenCalledWith("cp -r path/to/template/* current_path", jasmine.any(Function));
	});

	it("use the current path if dot is given as the path", function(){
		spyOn(process, "cwd").andReturn("current_path");
		spyOn(child_process, "exec");

		project_creator.createStructure(".", "path/to/template");

		expect(child_process.exec).toHaveBeenCalledWith("cp -r path/to/template/* current_path", jasmine.any(Function));
	});

});
