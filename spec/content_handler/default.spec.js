var default_handler = require("../../lib/content_handler/default.js");

var fs = require("fs");

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
		default_handler.getContent("path/test", ".html", {}, spyCallback);	

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
		default_handler.getContent("path/test", ".html", {}, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, expected_json, new Date(2012, 6, 18));

	});

});

describe("parse extended content", function(){
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
		default_handler.parsers = [{ "supportedExtensions": [".markdown", ".md"], "parse": spyParse }];

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

		default_handler.parsers = [];

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

		default_handler.parsers = [];

		var spyCallback = jasmine.createSpy();
		default_handler.parseExtendedContent("path/test", spyCallback);	

		var parsed_contents = { "test1": sample_json };
		expect(spyCallback).toHaveBeenCalledWith(null, parsed_contents, new Date(2012, 6, 17));

	});
});

