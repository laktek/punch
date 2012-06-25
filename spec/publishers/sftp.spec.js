var fs = require("fs");
var sftp_publisher = require("../../lib/publishers/sftp.js");
var fileutils = require("../../lib/utils/fileutils");

describe("calling publish", function(){

	it("should retrieve sftp options from the config", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(sftp_publisher, "retrieveOptions").andReturn({"upload_path": "public_html/site"});	
		spyOn(sftp_publisher, "connectToRemote"); 

		sftp_publisher.publish(supplied_config);
		
		expect(sftp_publisher.retrieveOptions).toHaveBeenCalledWith(supplied_config);

	});

	it("should initiate the connection to remote host", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(sftp_publisher, "retrieveOptions").andReturn({"upload_path": "public_html/site"});	
		spyOn(sftp_publisher, "connectToRemote"); 

		sftp_publisher.publish(supplied_config);
		
		expect(sftp_publisher.connectToRemote).toHaveBeenCalled();

	});

});

describe("retrieve the sftp options from the config", function(){

	it("returns the sftp options defined in publish section of config", function(){

		var sftp_config = {"username": "mike", "password": "mike1324"};
		var supplied_config = {"publish": { "sftp": sftp_config }};

		expect(sftp_publisher.retrieveOptions(supplied_config)).toEqual(sftp_config);

	});

	it("throws an error if config doesn't contain options for sftp", function(){

		var supplied_config = {"publish": { }};
		var error = "Cannot find sftp settings in config";

		expect(function(){ sftp_publisher.retrieveOptions(supplied_config) }).toThrow(error);

	});

	it("throws an error if config doesn't define a publish section", function(){
	
		var supplied_config = {};
		var error = "Cannot find sftp settings in config";

		expect(function(){ sftp_publisher.retrieveOptions(supplied_config) }).toThrow(error);
		
	});

});

describe("traversing the given directory", function(){

});
