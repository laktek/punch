var default_handler = require("../lib/content_handler.js");
var module_utils = require("../lib/utils/module_utils.js");

var fs = require("fs");

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
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		default_handler.setup(sample_config);
		expect(default_handler.contentDir).toEqual("content_dir");
	});

	it("setup each parser", function(){
		default_handler.parsers = {};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		default_handler.setup(sample_config);
		expect(default_handler.parsers).toEqual({".markdown": {"id": "sample_markdown_parser"}, ".yml": {"id": "sample_yml_parser"}});

	});

});

describe("check for sections", function(){

	it("return true if the given path is a directory", function(){
		spyOn(fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(default_handler.isSection("path/sub_dir")).toBeTruthy();
	});

	it("return false if the directory is a hidden directory", function(){
		spyOn(fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(default_handler.isSection("path/.hidden/sub_dir")).not.toBeTruthy();

	});

	it("return false if the directory is a special directory", function(){
		spyOn(fs, "statSync").andCallFake(function(path){
			return {"isDirectory": function(){ return true } };
		});

		expect(default_handler.isSection("path/_page/sub_dir")).not.toBeTruthy();

	});

	it("return false if the path doesn't exist", function(){
		spyOn(fs, "statSync").andCallFake(function(path){
			throw "error";
		});

		expect(default_handler.isSection("path/_page/sub_dir")).not.toBeTruthy();
	});

});

describe("get content", function(){

	it("read the JSON file in the given path", function(){

		var sample_json = {"key": "value"};

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		spyOn(default_handler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback(null, {}, new Date(2012, 6, 15));
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, sample_json, new Date(2012, 6, 17));

	});

	it("extend the output with extended content", function(){

		var sample_json = {"key": "value"};
		var extended_sample_json = {"key2": "value2"};
		var expected_json = {"key": "value", "key2": "value2"};

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		spyOn(default_handler, "parseExtendedContent").andCallFake(function(path, callback){
			if(path === "path/test"){
				return callback(null, extended_sample_json, new Date(2012, 6, 18));
			} else {
				return callback("error");
			}
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, expected_json, new Date(2012, 6, 18));

	});

	it("send an error if there's no JSON file or extended content", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);
		});

		spyOn(default_handler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback("error", null, null);
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error] No content found", null, null);
	});

	it("send an empty object if the JSON file empty and extended content doesn't exist", function() {
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer( "" ));
		});

		spyOn(default_handler, "parseExtendedContent").andCallFake(function(path, callback){
			return callback("error", null);
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {}, new Date(2012, 6, 17));
	});

});

describe("parse extended content", function(){

	it("calls the relavant directory for the path", function(){

		spyOn(fs, "readdir");

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/sub_dir/test", spyCallback);

		expect(fs.readdir.mostRecentCall.args[0]).toEqual("content_dir/path/sub_dir/_test");

	});

	it("parse all files in the directory", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.markdown", "test2.markdown"]);
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "parsed output");
		});

		var spyParse = jasmine.createSpy();
		spyParse.andCallFake(function(content, callback){
			return callback(null, content);
		});
		default_handler.parsers = { ".markdown": {"parse": spyParse} };

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/test", spyCallback);

		var parsed_contents = { "test1": "parsed output", "test2": "parsed output" };
		expect(spyCallback).toHaveBeenCalledWith(null, parsed_contents, new Date(2012, 6, 17));
	});

	it("will not parse files without supported parser", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.markdown", "test2.markdown"]);
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		var sample_json = {"key": "value"};
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		default_handler.parsers = {".textile": {"parse": {}} };

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {}, null);

	});

	it("parses JSON files by default", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["test1.json", "test2.markdown"]);
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17)});
		});

		var sample_json = {"key": "value"};
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, new Buffer(JSON.stringify(sample_json)));
		});

		default_handler.parsers = {};

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/test", spyCallback);

		var parsed_contents = { "test1": sample_json };
		expect(spyCallback).toHaveBeenCalledWith(null, parsed_contents, new Date(2012, 6, 17));

	});

	it("calls the callback with an error if directory doesn't exist", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null, null);

	});

});

describe("get shared content", function(){

	it("should call get content with shared path", function(){
		spyOn(default_handler, "getContent");
		var spyCallback = jasmine.createSpy();

		default_handler.getSharedContent(spyCallback);
		expect(default_handler.getContent).toHaveBeenCalledWith("shared", spyCallback);
	});

});

describe("negotiate content", function(){

	it("get the content for the path", function(){
		spyOn(default_handler, "getContent");
		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(default_handler.getContent.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("get the content for a path with special output format", function(){
		spyOn(default_handler, "getContent");
		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".rss", {}, spyCallback);

		expect(default_handler.getContent.mostRecentCall.args[0]).toEqual("path/test.rss");
	});

	it("extend it with shared contents", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback(null, {});
		});

		spyOn(default_handler, "getSharedContent");

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(default_handler.getSharedContent).toHaveBeenCalled();

	});

	it("call the callback with all collected content", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback(null, {"content_key": "content_value"}, new Date(2012, 6, 17));
		});

		spyOn(default_handler, "getSharedContent").andCallFake(function(callback){
			return callback(null, {"shared_key": "shared_value"}, new Date(2012, 6, 18));
		});

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "content_key": "content_value", "shared_key": "shared_value" }, {}, new Date(2012, 6, 18));
	});

	it("call the callback with an error object, if content for path doesn't exist", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback("error", null, null);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: Content for path/test not found]", null, null, {});
	});

});

describe("get sections", function(){

	it("traverse and collect all valid directory paths", function(){
		spyOn(fs, "readdir").andCallFake(function(dirpath, callback){
			if(dirpath === "content_dir"){
				return callback(null, ["sub1", "sub2", "shared", ".git", "index.json", "_page", "page.json"]);
			} else if(dirpath.indexOf("subsub") < 0){
				return callback(null, ["subsub", "page1.json", "_page1"]);
			}	else {
				return callback(null, []);
			}
		});

		spyOn(fs, "stat").andCallFake(function(p, callback){
			if(p.indexOf(".") > 0){
				return callback(null, {"isDirectory": function(){ return false }});
			}	else {
				return callback(null, {"isDirectory": function(){ return true }});
			}
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getSections(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(["/", "/sub1", "/sub2", "/sub1/subsub", "/sub2/subsub"]);

	});

});

describe("get content paths", function(){

	it("collect all content files (except shared file)", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["index.json", "page1.json", "page2.json", "_shared"]);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/test/index", "path/test/page1", "path/test/page2"]);
	});

	it("collect files with special output extensions", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback) {
			return callback(null, ["index.json", "page1.json", "page1.rss.json", "page2.json", "_shared"]);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/test/index", "path/test/page1", "path/test/page1.rss", "path/test/page2"]);
	});

	it("collect the extended directories", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback(null, ["index.json", "subdir", "_index", "_another_page", "another_subdir"]);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.getContentPaths("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/test/index", "path/test/another_page"]);

	});

	it("calls the callback with an error if directory not found", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.getContentPaths("path/not_exist", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", []);
	});

});
