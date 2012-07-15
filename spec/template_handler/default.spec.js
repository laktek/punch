var default_handler = require("../../lib/template_handler/default.js");

var fs = require("fs");

describe("get template", function(){

	it("check if the template available", function(){

		spyOn(fs, "stat");

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/test.html", spyCallback);	

		expect(fs.stat.mostRecentCall.args[0]).toEqual("template_dir/path/test.html");
	});

	it("call the callback with last modified date and full path", function(){
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 15) });
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"full_path": "path/test.html", "last_modified": new Date(2012, 6, 15) });

	});

	it("call the callback with an error if the template doesn't exist", function(){
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/not_exist.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("get templates", function(){

});

describe("read template", function(){

	it("reads the template from the filesystem", function(){
		spyOn(fs, "readFile");

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("template_dir/path/test.html");

	});

	it("calls the callback with the template content", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "template output");	
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, "template output");

	});

	it("calls the callback with the error if an error occurs", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback("error", null);	
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("negotiate template", function(){
});

describe("get partials", function(){
});

