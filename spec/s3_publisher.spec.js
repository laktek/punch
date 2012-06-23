var fs = require("fs");
var knox = require("knox");
var s3_publisher = require("../lib/publishers/s3.js");
var fileutils = require("../lib/helpers/fileutils");

describe("calling publish", function(){

	it("gets the details of the s3 bucket", function(){

		var supplied_config = {};

		spyOn(s3_publisher, "retrieveOptions");	
		spyOn(fileutils, "forEachFileIn");	
		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(s3_publisher.retrieveOptions).toHaveBeenCalledWith(supplied_config);

	});

 it("creates a s3 client", function(){
		var supplied_config = {};
		var s3_config = { "key": "somekey", "secret": "somesecret", "bucket": "somebucket" };

		spyOn(s3_publisher, "retrieveOptions").andReturn(s3_config);	
		spyOn(fileutils, "forEachFileIn");	

		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(knox.createClient).toHaveBeenCalledWith(s3_config);

 });

	it("calls the file iteration function with output directory", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(s3_publisher, "retrieveOptions");	
		spyOn(fileutils, "forEachFileIn");	
		spyOn(knox, "createClient"); 

		s3_publisher.publish(supplied_config);
		
		expect(fileutils.forEachFileIn.mostRecentCall.args[0]).toEqual("path/output_dir");

	});

});

describe("retrieve the s3 options from the config", function(){

	it("returns the s3 options defined in publish section of config", function(){

		var s3_config = { "key": "somekey", "secret": "somesecret", "bucket": "somebucket" };
		var supplied_config = {"publish": { "s3": s3_config }};

		expect(s3_publisher.retrieveOptions(supplied_config)).toEqual(s3_config);

	});

	it("throws an error if config doesn't contain options for s3", function(){

		var supplied_config = {"publish": { }};
		var error = "Cannot find s3 settings in config";

		expect(function(){ s3_publisher.retrieveOptions(supplied_config) }).toThrow(error);

	});

	it("throws an error if config doesn't define a publish section", function(){
	
		var supplied_config = {};
		var error = "Cannot find s3 settings in config";

		expect(function(){ s3_publisher.retrieveOptions(supplied_config) }).toThrow(error);
		
	});

});

describe("copy a file to s3 bucket", function(){
	it("reads the given file", function(){

		spyOn(fs, "readFile");
		
		s3_publisher.copyFile("output_dir/file.html");	

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("output_dir/file.html");

	});

	it("calls put on client with the correct path", function(){

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, new Buffer("sample"));	
		});

		var dummy_req_obj = {"on": function(){}, "end": function(){} }

		s3_publisher.client = {"put": function(){}};

		spyOn(s3_publisher.client, "put").andReturn(dummy_req_obj);
		
		s3_publisher.copyFile("output_dir/sub/file.html");	

		expect(s3_publisher.client.put.mostRecentCall.args[0]).toEqual("sub/file.html");
	
	});

});
