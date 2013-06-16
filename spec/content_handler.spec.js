var DefaultHandler = require("../lib/content_handler.js");
var ModuleUtils = require("../lib/utils/module_utils.js");

var Fs = require("fs");
var Path = require("path");

describe("setup", function(){

	var sample_config = {
		content_dir: "content_dir",

		plugins: {
			parsers: {
				".markdown": "sample_markdown_parser",
				".yml": "sample_yml_parser"
			},
			helpers: [
				"sample_number_helper",
				"sample_image_helper"
			]
		}
	};

	it("set the content directory", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		DefaultHandler.setup(sample_config);
		expect(DefaultHandler.contentDir).toEqual("content_dir");
	});

	it("setup each parser", function(){
		DefaultHandler.parsers = {};

		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
      if (id === "sample_markdown_parser") {
        return { "id": id, "supportedExtensions": [".markdown", ".md"] };
      } else {
        return {"id": id};
      }
		});

		DefaultHandler.setup(sample_config);
		expect(DefaultHandler.parsers).toEqual({".markdown": {"id": "sample_markdown_parser", "supportedExtensions": [".markdown", ".md"] }, ".md": {"id": "sample_markdown_parser", "supportedExtensions": [".markdown", ".md"] }, ".yml": {"id": "sample_yml_parser"}});
	});

});

describe("check for sections", function(){

	it("return false if the given path is null", function(){
		expect(DefaultHandler.isSection(null)).not.toBeTruthy();
	});

	it("return true if the given path is a directory", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(DefaultHandler.isSection(Path.join("path","sub_dir"))).toBeTruthy();
	});

	it("return false if the directory is a hidden directory", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(DefaultHandler.isSection(Path.join("path",".hidden","sub_dir"))).not.toBeTruthy();

	});

	it("return false if the directory is a special directory", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(DefaultHandler.isSection(Path.join("path","_page","sub_dir"))).not.toBeTruthy();

	});

	it("return false if the path doesn't exist", function(){
		spyOn(Fs, "statSync").andCallFake(function(path){
			throw "error";
		});

		expect(DefaultHandler.isSection(Path.join("path","_page","sub_dir"))).not.toBeTruthy();
	});

});

describe("get content", function(){

	it("read the JSON file in the given path", function(){

		var sample_json = {"key": "value"};

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		spyOn(DefaultHandler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback(null, {}, new Date(2012, 6, 15));
		});

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, sample_json, new Date(2012, 6, 17));

	});

	it("extend the output with extended content", function(){

		var sample_json = {"key": "value"};
		var extended_sample_json = {"key2": "value2"};
		var expected_json = {"key": "value", "key2": "value2"};

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		spyOn(DefaultHandler, "parseExtendedContent").andCallFake(function(path, callback){
			if(path === "path/test"){
				return callback(null, extended_sample_json, new Date(2012, 6, 18));
			} else {
				return callback("error");
			}
		});

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, expected_json, new Date(2012, 6, 18));

	});

	it("send an error if there's no JSON file or extended content", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);
		});

		spyOn(DefaultHandler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback("error", null, null);
		});

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error] No content found", null, null);
	});

	it("send an empty object if the JSON file empty and extended content doesn't exist", function() {
		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer( "" ));
		});

		spyOn(DefaultHandler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback("error", null);
		});

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {}, new Date(2012, 6, 17));
	});

});

describe("parse extended content", function(){

	it("calls the relavant directory for the path", function(){

		spyOn(Fs, "readdir");

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.parseExtendedContent(Path.join("path/sub_dir/test"), spyCallback);

		expect(Fs.readdir.mostRecentCall.args[0]).toEqual(Path.join("content_dir/path/sub_dir/_test"));

	});

	it("parse all files in the directory", function(){

		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.markdown", "test2.coffee.markdown"]);
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "parsed output");
		});

		var spyParse = jasmine.createSpy();
		spyParse.andCallFake(function(content, callback){
			return callback(null, content);
		});
		DefaultHandler.parsers = { ".markdown": {"parse": spyParse} };

		var spyCallback = jasmine.createSpy();
		DefaultHandler.parseExtendedContent("path/test", spyCallback);

		var parsed_contents = { "test1": "parsed output", "test2": "parsed output" };
		expect(spyCallback).toHaveBeenCalledWith(null, parsed_contents, new Date(2012, 6, 17));
	});

	it("will not parse files without supported parser", function(){

		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.markdown", "test2.markdown"]);
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		var sample_json = {"key": "value"};
		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		DefaultHandler.parsers = {".textile": {"parse": {}} };

		var spyCallback = jasmine.createSpy();
		DefaultHandler.parseExtendedContent(Path.join("path/test"), spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {}, null);

	});

	it("parses JSON files by default", function(){

		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.json", "test2.markdown"]);
		});

		spyOn(Fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		var sample_json = {"key": "value"};
		spyOn(Fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		DefaultHandler.parsers = {};

		var spyCallback = jasmine.createSpy();
		DefaultHandler.parseExtendedContent("path/test", spyCallback);

		var parsed_contents = { "test1": sample_json };
		expect(spyCallback).toHaveBeenCalledWith(null, parsed_contents, new Date(2012, 6, 17));

	});

	it("calls the callback with an error if directory doesn't exist", function(){

		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.parseExtendedContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null, null);

	});

});

describe("get shared content", function(){

	it("should call get content with shared path", function(){
		spyOn(DefaultHandler, "getContent");
		var spyCallback = jasmine.createSpy();

		DefaultHandler.getSharedContent(spyCallback);
		expect(DefaultHandler.getContent).toHaveBeenCalledWith("shared", spyCallback);
	});

});

describe("negotiate content", function(){

	it("get the content for the path", function(){
		spyOn(DefaultHandler, "getContent");
		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(DefaultHandler.getContent.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("get the content for a path with special output format", function(){
		spyOn(DefaultHandler, "getContent");
		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateContent("path/test", ".rss", {}, spyCallback);

		expect(DefaultHandler.getContent.mostRecentCall.args[0]).toEqual("path/test.rss");
	});

	it("extend it with shared contents", function(){
		spyOn(DefaultHandler, "getContent").andCallFake(function(path, callback){
			return callback(null, {});
		});

		spyOn(DefaultHandler, "getSharedContent");

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(DefaultHandler.getSharedContent).toHaveBeenCalled();

	});

	it("call the callback with all collected content", function(){
		spyOn(DefaultHandler, "getContent").andCallFake(function(path, callback){
			return callback(null, {"content_key": "content_value"}, new Date(2012, 6, 17));
		});

		spyOn(DefaultHandler, "getSharedContent").andCallFake(function(callback){
			return callback(null, {"shared_key": "shared_value"}, new Date(2012, 6, 18));
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "content_key": "content_value", "shared_key": "shared_value" }, {}, new Date(2012, 6, 18));
	});

	it("call the callback with an error object, if content for path doesn't exist", function(){
		spyOn(DefaultHandler, "getContent").andCallFake(function(path, callback){
			return callback("error", null, null);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: Content for path/test not found]", null, null, {});
	});

});

describe("get sections", function(){

	it("traverse and collect all valid directory paths", function(){
		spyOn(Fs, "readdir").andCallFake(function(dirPath, callback){
			if(dirPath === "content_dir"){
				return callback(null, ["sub1", "sub2", "shared", ".git", "index.json", "_page", "page.json"]);
			} else if(dirPath.indexOf("subsub") < 0){
				return callback(null, ["subsub", "page1.json", "_page1"]);
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

		DefaultHandler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getSections(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([Path.join("/"), Path.join("/sub1"), Path.join("/sub2"), Path.join("/sub1/subsub"), Path.join("/sub2/subsub")]);

	});

});

describe("get content paths", function(){

	it("calls the callback with an error if base path is null", function(){
		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContentPaths(null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("base path can't be null", []);
	});

	it("collect all content files (except shared file)", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["index.json", "page1.json", "page2.json", "_shared"]);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [Path.join("path/test/index"), Path.join("path/test/page1"), Path.join("path/test/page2")]);
	});

	it("collect files with special output extensions", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback) {
			return callback(null, ["index.json", "page1.json", "page1.rss.json", "page2.json", "_shared"]);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [Path.join("path/test/index"), Path.join("path/test/page1"), Path.join("path/test/page1.rss"), Path.join("path/test/page2")]);
	});

	it("collect the extended directories", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["index.json", "subdir", "_index", "_another_page", "another_subdir"]);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [Path.join("path/test/index"), Path.join("path/test/another_page")]);

	});

	it("calls the callback with an error if directory not found", function(){
		spyOn(Fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		DefaultHandler.getContentPaths("path/not_exist", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", []);
	});

});
