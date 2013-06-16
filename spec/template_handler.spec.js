var DefaultHandler = require("../lib/template_handler.js");

var Fs = require("fs");
var PathConv = require("path");

describe("setup", function() {
	it("set the template directory", function() {
		DefaultHandler.setup({"template_dir": "template_dir"});
		expect(DefaultHandler.templateDir).toEqual("template_dir");
	});
});

describe("check for sections", function(){

	it("return false if the path is null", function(){
		expect(DefaultHandler.isSection(null)).not.toBeTruthy();
	});

	it("return true if the given path is a directory", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(DefaultHandler.isSection(PathConv.join("path/sub_dir"))).toBeTruthy();
	});

	it("return false if the directory is a hidden directory", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(DefaultHandler.isSection(PathConv.join("path/.hidden/sub_dir"))).not.toBeTruthy();

	});

	it("return false if the path doesn't exist", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			throw "error";
		});

		expect(DefaultHandler.isSection(PathConv.join("path/_page/sub_dir"))).not.toBeTruthy();
	});

});

describe("get template", function(){

	it("call the callback with an error if the template path is null", function(){
		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplate(null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("template path can't be null", null);
	});

	it("check if the template available", function(){

		spyOn(Fs, "stat");

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplate("path/test.html", spyCallback);

		expect(Fs.stat.mostRecentCall.args[0]).toEqual(PathConv.join("template_dir/path/test.html"));
	});

	it("call the callback with last modified date and full path", function(){
		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 15), "isFile": function(){ return true } });
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplate("path/test.html", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"full_path": "path/test.html", "last_modified": new Date(2012, 6, 15) });

	});

	it("call the callback with an error if the template doesn't exist", function(){
		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplate("path/not_exist.html", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

	it("call the callback with an error if the given path is not a file", function(){
		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 15), "isFile": function(){ return false } });
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplate("path/sub_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("given path is not a file", null);


	});

});

describe("get templates", function(){

	it("call the callback with the error if the base path is null", function(){
		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplates(null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("base path can't be null", null);
	});

	it("check if the given path is directory", function(){

		spyOn(Fs, "readdir");

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplates("path/sub_dir", spyCallback);

		expect(Fs.readdir.mostRecentCall.args[0]).toEqual(PathConv.join("template_dir/path/sub_dir"));
	});

	it("get all files (excluding hidden files and subdirs) in the given directory path", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			callback(null, ["test.html", "somedir", ".git"]);
		});

		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"mtime": new Date(2012, 6, 16), "isDirectory": function(){
				if(path.indexOf(".") > -1){
					return false;
				}
				return true;
			}};
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplates("path/sub_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [ {"full_path": PathConv.join("path/sub_dir/test.html"), "last_modified": new Date(2012, 6, 16)} ]);

	});

	it("move one level up and filter the files in directory with the basename", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			if(path === PathConv.join("template_dir/path/sub_dir/index")){
				return callback("error", null);
			} else {
				return callback(null, ["test.html", "index.html", "test2.html", "index.css"]);
			}
		});

		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"mtime": new Date(2012, 6, 16), "isDirectory": function(){
				if(path.indexOf(".") > -1){
					return false;
				}
				return true;
			}};
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplates("path/sub_dir/index", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [{"full_path": PathConv.join("path/sub_dir/index.html"), "last_modified": new Date(2012, 6, 16)},
																										{"full_path": PathConv.join("path/sub_dir/index.css"), "last_modified": new Date(2012, 6, 16)}
																									 ]);
	});

	it("call the callback with the error if it encounters an error when traversing directories", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getTemplates("path/not_exist/index", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("read template", function(){

	it("calls the callback with the error if template path is null", function(){
		var spyCallback = jasmine.createSpy();
		DefaultHandler.readTemplate(null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("template path can't be null", null);
	});


	it("reads the template from the filesystem", function(){
		spyOn(Fs, "readFile");

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.readTemplate("path/test.html", spyCallback);

		expect(Fs.readFile.mostRecentCall.args[0]).toEqual(PathConv.join("template_dir/path/test.html"));

	});

	it("calls the callback with the template content", function(){
		spyOn(Fs, "readFile").andCallFake(function(path, content_type, callback){
			return callback(null, new Buffer("template output"));
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.readTemplate("path/test.html", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "template output");

	});

	it("calls the callback with the error if an error occurs", function(){
		spyOn(Fs, "readFile").andCallFake(function(path, content_type, callback){
			return callback("error", null);
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.readTemplate("path/test.html", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("negotiate template", function() {

	it("call the callback with the error if base path is null", function() {
		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate(null, ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("base path can't be null", null, null);
	});

	it("check for a template file for the given output extension", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/index.html.mustache")) {
				return callback(null, "template output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/index.html.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "template output", new Date(2012, 6, 16));
	});

	it("check for a layout file in the same level for the given output extension", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/_layout.html.mustache")) {
				return callback(null, "layout output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/_layout.html.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "layout output", new Date(2012, 6, 16));
	});

	it("check for a layout file in the top levels for the given output extension", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/_layout.html.mustache")) {
				return callback(null, "layout output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/_layout.html.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "layout output", new Date(2012, 6, 16));
	});

	it("check for a generic template file", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/index.mustache")) {
				return callback(null, "template output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/index.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "template output", new Date(2012, 6, 16));
	});

	it("check for a generic layout file in the same level", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/_layout.mustache")) {
				return callback(null, "layout output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/path/sub_dir/_layout.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "layout output", new Date(2012, 6, 16));
	});

	it("check for a generic layout file in the top levels", function() {
		spyOn(Fs, "readFile").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/_layout.mustache")) {
				return callback(null, "layout output");
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback) {
			if (path === PathConv.join("template_dir/_layout.mustache")) {
				return callback(null, {"mtime": new Date(2012, 6, 16) });
			} else {
				return callback("error", null);
			}
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateTemplate("path/sub_dir/index", ".html", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "layout output", new Date(2012, 6, 16));
	});
});

describe("get partials", function(){

	it("call the calback with the error when base path is null", function() {
		var spyCallback = jasmine.createSpy();
		DefaultHandler.getPartials(null, ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("base path can't be null", null, null);
	});

	it("collects all partials in the given directory", function(){

		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			if(path === PathConv.join("template_dir/index")){
				return callback("error", null);
			} else {
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache", "_partial2.mustache"]);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17) });
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output");
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getPartials(PathConv.sep + "index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output"}, new Date(2012, 6, 17));
	});

	it("traverse all parent directories looking for partials", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			if(path === PathConv.join("template_dir","main")){
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache"]);
			} else if(path === PathConv.join("template_dir","main","sub")){
				return callback(null, ["index.html", "test.mustache", "_partial2.mustache"]);
			} else if(path === PathConv.join("template_dir","main","sub","sub-sub")){
				return callback(null, ["index.html", "test.mustache", "_partial3.mustache"]);
			} else {
				return callback("error", null);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17) });
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output");
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getPartials(PathConv.join("main","sub","sub-sub","index"), ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output", "partial3": "partial output"}, new Date(2012, 6, 17));

	});

	it("set the latest modified date of all partials as the last modified date", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			if (path === PathConv.join("template_dir/index")) {
				return callback("error", null);
			} else {
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache", "_partial2.mustache"]);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			if(path === PathConv.join("template_dir/_partial2.mustache")){
				return callback(null, {"mtime": new Date(2012, 6, 19) });
			} else {
				return callback(null, {"mtime": new Date(2012, 6, 17) });
			}
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output");
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getPartials(PathConv.sep + "index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output"}, new Date(2012, 6, 19));

	});

});

describe("get sections", function(){

	it("traverse and collect all directories", function(){
		spyOn(Fs, "readdir").andCallFake(function(dirpath, callback){
			if(dirpath === "template_dir"){
				return callback(null, ["sub1", "sub2", ".git", "index.html"]);
			} else if(dirpath.indexOf("subsub") < 0){
				return callback(null, ["subsub", "page.html"]);
			}	else {
				return callback(null, []);
			}
		});

		spyOn(Fs, "stat").andCallFake(function(p, callback){
			if(p.indexOf(".") > 0){
				return callback(null, {"isDirectory": function(){ return false }});
			}	else {
				return callback(null, {"isDirectory": function(){ return true }});
			}
		});

		DefaultHandler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getSections(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([PathConv.join("/"), PathConv.join("/sub1"), PathConv.join("/sub2"), PathConv.join("/sub1/subsub"), PathConv.join("/sub2/subsub")]);

	});

});

