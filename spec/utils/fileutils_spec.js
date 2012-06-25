var fs = require("fs");
var fileutils = require("../lib/utils/fileutils")

describe("iterating over each file in a directory", function(){

	it("read directory and get the list of files", function(){

		spyOn(fs, "readdir");

		fileutils.forEachFileIn("output_dir_path");

		expect(fs.readdir.mostRecentCall.args[0]).toEqual("output_dir_path");
		
	});

	it("throw an error if the directory doesn't exist", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			callback("path doesn't exist", null);	
		});

		expect(function(){ fileutils.forEachFileIn(undefined) }).toThrow();
	
	});

	it("execute the callback on each file found", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			callback(null, ["file1", "file2"]);	
		});

		spyOn(fs, "stat").andCallFake(function(file, callback){
			callback(null, { "isDirectory": function(){ return false } });	
		});

		var dummy_callback = jasmine.createSpy();

		fileutils.forEachFileIn("path/dir", dummy_callback);

		expect(dummy_callback.callCount).toEqual(2);

	});

	it("recursively fetches files in sub-directories", function(){
	
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			if(fs.readdir.callCount === 1)
				callback(null, ["dir1"]);	
			else
				callback(null, []);	
		});

		spyOn(fs, "stat").andCallFake(function(file, callback){
			callback(null, { "isDirectory": function(){ return true } });	
		});

		var dummy_callback = jasmine.createSpy();

		fileutils.forEachFileIn("output_dir", dummy_callback);

		expect(fs.readdir.mostRecentCall.args[0]).toEqual("output_dir/dir1");

	});

});
