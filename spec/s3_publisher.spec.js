var fs = require("fs");
var knox = require("knox");
var s3_publisher = require("../lib/publishers/s3.js");

describe("calling publish", function(){

	it("should get the details of the s3 bucket", function(){

		var supplied_config = {};

		spyOn(s3_publisher, "s3Config");	
		spyOn(s3_publisher, "forEachFileIn");	
		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(s3_publisher.s3Config).toHaveBeenCalledWith(supplied_config);

	});

 it("should create a s3 client", function(){
		var supplied_config = {};
		var s3_config = { "key": "somekey", "secret": "somesecret", "bucket": "somebucket" };

		spyOn(s3_publisher, "s3Config").andReturn(s3_config);	
		spyOn(s3_publisher, "forEachFileIn");	

		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(knox.createClient).toHaveBeenCalledWith(s3_config);

 });

	it("should call the file iteration function with output directory", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(s3_publisher, "s3Config");	
		spyOn(s3_publisher, "forEachFileIn");	
		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(s3_publisher.forEachFileIn.mostRecentCall.args[0]).toEqual("path/output_dir");

	});

});

describe("getting s3 settings from the config", function(){

	it("returns the s3 settings defined in publish section of config", function(){

		var s3_config = { "key": "somekey", "secret": "somesecret", "bucket": "somebucket" };
		var supplied_config = {"publish": { "s3": s3_config }};

		expect(s3_publisher.s3Config(supplied_config)).toEqual(s3_config);

	});

	it("throws an error if config doesn't contain s3 settings", function(){

		var supplied_config = {"publish": { }};
		var error = "Cannot find s3 settings in config";

		expect(function(){ s3_publisher.s3Config(supplied_config) }).toThrow(error);

	});

	it("throws an error if config doesn't define a publish section", function(){
	
		var supplied_config = {};
		var error = "Cannot find s3 settings in config";

		expect(function(){ s3_publisher.s3Config(supplied_config) }).toThrow(error);
		
	});

});

describe("iterate over the files in a directory", function(){

	it("should read directory and get the list of files", function(){

		spyOn(fs, "readdir");

		s3_publisher.forEachFileIn("output_dir_path");

		expect(fs.readdir.mostRecentCall.args[0]).toEqual("output_dir_path");
		
	});

	it("should throw an error if the directory doesn't exist", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			callback("path doesn't exist", null);	
		});

		expect(function(){ s3_publisher.forEachFileIn(undefined) }).toThrow();
	
	});

	it("should execute the callback on each file found", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			callback(null, ["file1", "file2"]);	
		});

		spyOn(fs, "stat").andCallFake(function(file, callback){
			callback({ "isDirectory": function(){ return false } });	
		});

		var dummy_callback = jasmine.createSpy();

		s3_publisher.forEachFileIn("path/dir", dummy_callback);

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
			callback({ "isDirectory": function(){ return true } });	
		});

		var dummy_callback = jasmine.createSpy();

		s3_publisher.forEachFileIn("output_dir", dummy_callback);

		expect(fs.readdir.mostRecentCall.args[0]).toEqual("output_dir/dir1");

	});

});

