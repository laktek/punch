var ProjectCreator = require("../lib/project_creator");

var Fs = require("fs");
var ChildProcess = require("child_process");
var Os = require("os");

describe("creating a bare structure", function() {

	function getCopyCommand(templatePath, path)
	{
		if (Os.platform() === "win32") {
			return "ROBOCOPY " + templatePath + " " + path  + " *.* /E";
		}

		return "cp -r " + templatePath + "/* " + path;
	}

	it("create the site directory if needed", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(Fs, "mkdir");

		ProjectCreator.createStructure("site_path");

		expect(Fs.mkdir).toHaveBeenCalledWith("site_path", jasmine.any(Function));
	});

	it("create the structure using the given template", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(ChildProcess, "exec");

		ProjectCreator.createStructure("site_path", "path/to/template");

		expect(ChildProcess.exec).toHaveBeenCalledWith(getCopyCommand("path/to/template", "site_path"), jasmine.any(Function));
	});

	it("use the default template to create the structure if no template given", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			return callback(null, { "isDirectory": function() { return true } });
		});

		spyOn(ChildProcess, "exec");

		spyOn(ProjectCreator, "getDefaultTemplate").andReturn("default_template_path");

		ProjectCreator.createStructure("site_path");

		expect(ChildProcess.exec).toHaveBeenCalledWith(getCopyCommand("default_template_path", "site_path"), jasmine.any(Function));
	});

	it("don't create the structure if site directory creation fails", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			return callback("error", null);
		});

		spyOn(Fs, "mkdir").andCallFake(function(path, callback) {
			return callback("error");
		});

		spyOn(ChildProcess, "exec");

		ProjectCreator.createStructure("site_path");

		expect(ChildProcess.exec).not.toHaveBeenCalled();

	});

	it("use the current path if no path is given", function(){
		spyOn(process, "cwd").andReturn("current_path");

		spyOn(ChildProcess, "exec");

		ProjectCreator.createStructure(null, "path/to/template");

		expect(ChildProcess.exec).toHaveBeenCalledWith(getCopyCommand("path/to/template", "current_path"), jasmine.any(Function));
	});

	it("use the current path if dot is given as the path", function(){
		spyOn(process, "cwd").andReturn("current_path");
		spyOn(ChildProcess, "exec");

		ProjectCreator.createStructure(".", "path/to/template");

		expect(ChildProcess.exec).toHaveBeenCalledWith(getCopyCommand("path/to/template", "current_path"), jasmine.any(Function));
	});

});
