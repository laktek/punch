var fs = require("fs");
var cache_store = require("../lib/cache_store.js");

describe("setup", function(){
	it("set the output directory", function(){
		cache_store.setup({"output_dir": "output_dir"});
		expect(cache_store.outputDir).toEqual("output_dir");
	});
});

describe("last updated for a file", function(){

	it("calls the callback with the file's modified time", function(){

		cache_store.outputDir = "output_dir"

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			if(file_path === "output_dir/path/test.html"){
				return callback(null, {"mtime": new Date(2012, 6, 21)});	
			}
		});

		var spyCallback = jasmine.createSpy();
		cache_store.lastUpdated("path/test", ".html", spyCallback);
		
		expect(spyCallback).toHaveBeenCalledWith(null, new Date(2012, 6, 21));
	
	});

	it("calls the callback with an error if file doesn't exist", function(){

		cache_store.outputDir = "output_dir"

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback("error", null);	
		});

		var spyCallback = jasmine.createSpy();
		cache_store.lastUpdated("path/test", ".html", spyCallback);
		
		expect(spyCallback).toHaveBeenCalledWith("error", null);
	
	});

});

describe("get a file", function(){

	it("calls the callback with file content", function(){
		
		var cached_content = new Buffer("cached content");

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 21)});	
		});

		spyOn(fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback(null, cached_content);	
		});
	
		var spyCallback = jasmine.createSpy();
		cache_store.get("path/test", ".html", {}, spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith(null, {"body": cached_content, "updated_at": new Date(2012, 6, 21), "options": {"header": {"Content-Length": 14}}});

	});

	it("calls the callback with the error if there's an error reading the file", function(){
	
		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 21)});	
		});

		spyOn(fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback("error", null);	
		});
	
		var spyCallback = jasmine.createSpy();
		cache_store.get("path/test", ".html", {}, spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("error", {"body": null, "updated_at": new Date(2012, 6, 21), "options": {"header": {"Content-Length": 0 }}});

	});
});

describe("update a file", function(){
	it("create missing directories", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return false }});
		});

		spyOn(fs, "mkdir").andCallFake(function(dirpath, callback){
			return callback(null);	
		});

		spyOn(fs, "writeFile");

		cache_store.outputDir = "output_dir";
	
		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".html", "test", spyCallback);

		expect(fs.mkdir.callCount).toEqual(3);

	});

	it("write file to the correct path", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(fs, "writeFile");
	
		var spyCallback = jasmine.createSpy();
		cache_store.update("path/test", ".html", "test", spyCallback);

		expect(fs.writeFile.mostRecentCall.args.splice(0, 2)).toEqual(["output_dir/path/test.html", "test"]);

	});

	it("calls the callback with the error if there's an error in writing the file", function(){

		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(fs, "writeFile").andCallFake(function(file_path, body, encoding, callback){
			return callback("error");	
		});
	
		var spyCallback = jasmine.createSpy();
		cache_store.update("path/test", ".html", "test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error");

	});
});
