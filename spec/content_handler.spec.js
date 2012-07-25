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

	it("setup each helper", function(){
		default_handler.helpers = [];

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};	
		});

		default_handler.setup(sample_config);
		expect(default_handler.helpers).toEqual([{"id": "sample_number_helper"}, {"id": "sample_image_helper"}]);

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
			throw "error"
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

describe("get helper content", function(){

	it("call the helper with all given arguments", function(){

		var spyHelperGet = jasmine.createSpy();

		default_handler.helpers = [{ "get": spyHelperGet }];

		var spyCallback = jasmine.createSpy();
		default_handler.getHelperContent("path/test", "html", {}, spyCallback);	

		expect(spyHelperGet.mostRecentCall.args.splice(0, 3)).toEqual(["path/test", "html", {}]);
	});

	it("call the callback with all content collected by helpers", function(){
		var spyHelperGet1 = jasmine.createSpy();
		spyHelperGet1.andCallFake(function(path, content_type, options, callback){
			return callback(null, {"key1": "value1"});	
		});

		var spyHelperGet2 = jasmine.createSpy();
		spyHelperGet2.andCallFake(function(path, content_type, options, callback){
			return callback(null, {"key2": "value2"});	
		});

		default_handler.helpers = [{ "get": spyHelperGet1 }, { "get": spyHelperGet2 }];

		var spyCallback = jasmine.createSpy();
		default_handler.getHelperContent("path/test", "html", {}, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"key1": "value1", "key2": "value2"});

	});


});

describe("negotiate content", function(){

	it("get the content for the path", function(){
		spyOn(default_handler, "getContent");
		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);	

		expect(default_handler.getContent.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("extend it with shared contents", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback(null, {});	
		});

		spyOn(default_handler, "getSharedContent");
		spyOn(default_handler, "getHelperContent");

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);	

		expect(default_handler.getSharedContent).toHaveBeenCalled();

	});

	it("extend it with helper contents", function(){
	
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback(null, {});	
		});

		spyOn(default_handler, "getSharedContent");
		spyOn(default_handler, "getHelperContent");

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);	

		expect(default_handler.getHelperContent.mostRecentCall.args.splice(0,3)).toEqual(["path/test", ".html", {}]);

	});

	it("call the callback with all collected content", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback(null, {"content_key": "content_value"}, new Date(2012, 6, 17));
		});

		spyOn(default_handler, "getSharedContent").andCallFake(function(callback){
			return callback(null, {"shared_key": "shared_value"}, new Date(2012, 6, 18));
		});

		spyOn(default_handler, "getHelperContent").andCallFake(function(path, content_type, options, callback){
			return callback(null, {"helper_key": "helper_value"});
		});

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"content_key": "content_value", "shared_key": "shared_value", "helper_key": "helper_value"}, new Date(2012, 6, 18), {});

	});

	it("call the callback with an error object, if content for path doesn't exist", function(){
		spyOn(default_handler, "getContent").andCallFake(function(path, callback){
			return callback("error", null, null);
		});

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateContent("path/test", ".html", {}, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("content not found", null, null, {});

	});

});

describe("get sections", function(){

	it("traverse and collect all directories", function(){
		spyOn(fs, "readdir").andCallFake(function(dirpath, callback){
			if(dirpath === "content_dir"){
				return callback(null, ["sub1", "sub2", ".git", "index.json", "_page", "page.json"]);	
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
		default_handler.getSections("", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(["sub1", "sub2", "sub1/subsub", "sub2/subsub"]);
		
	});

	it("start traversing from the giving path", function(){
		spyOn(fs, "readdir").andCallFake(function(dirpath, callback){
			if(dirpath === "content_dir"){
				return callback(null, ["sub1", "sub2", "index.html"]);	
			} else if(dirpath.indexOf("subsub") < 0){
				return callback(null, ["subsub", "page.html"]);	
			}	else {
				return callback(null, []);	
			}
		});	

		spyOn(fs, "stat").andCallFake(function(p, callback){
			if(p.indexOf(".") > -1){
				return callback(null, {"isDirectory": function(){ return false }});	
			}	else {
				return callback(null, {"isDirectory": function(){ return true }});	
			}
		});

		default_handler.contentDir = "content_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getSections("sub1", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(["sub1/subsub"]);
		
	});

});
