var fs = require("fs");
var sftp_publisher = require("../lib/publishers/sftp.js");
var fileutils = require("../lib/utils/fileutils");

describe("calling publish", function(){

	it("should get the details of the sftp config", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(sftp_publisher, "retrieveOptions").andReturn({"upload_path": "public_html/site"});	
		spyOn(sftp_publisher, "connectToRemote"); 
		spyOn(fileutils, "forEachFileIn");

		sftp_publisher.publish(supplied_config);
		
		expect(sftp_publisher.retrieveOptions).toHaveBeenCalledWith(supplied_config);

	});

	it("should initiate the connection to remote host", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(sftp_publisher, "retrieveOptions").andReturn({"upload_path": "public_html/site"});	
		spyOn(sftp_publisher, "connectToRemote"); 
		spyOn(fileutils, "forEachFileIn");

		sftp_publisher.publish(supplied_config);
		
		expect(sftp_publisher.connectToRemote).toHaveBeenCalled();

	});

	it("should fetch and upload all files in output directory", function(){

		var supplied_config = {"output_dir": "path/output_dir"};

		spyOn(sftp_publisher, "retrieveOptions").andReturn({"upload_path": "public_html/site"});	
		spyOn(sftp_publisher, "connectToRemote"); 
		spyOn(fileutils, "forEachFileIn");

		sftp_publisher.publish(supplied_config);
		
		expect(fileutils.forEachFileIn.mostRecentCall.args[0]).toEqual("path/output_dir");

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

describe("set upload file path", function(){

	it("reads the given file", function(){
		spyOn(fs, "readFile");	
		sftp_publisher.setFilePath("output/some_file", "public_html/site");
		expect(fs.readFile.mostRecentCall.args[0]).toEqual("output/some_file");
	});

	it("throws an exception if there's an error in reading the file", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback("error", null);	
		});

		expect(function(){ sftp_publisher.setFilePath("output/some_file", "public_html/site") }).toThrow("error");
	});

	it("clears any existing timeouts", function(){

		sftp_publisher.client = {cd: jasmine.createSpy() };

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		clearTimeout = jasmine.createSpy();	
		sftp_publisher.timeoutId = "timeout_id";

		sftp_publisher.setFilePath("output/some_file");

		expect(clearTimeout).toHaveBeenCalledWith("timeout_id");
	});

	it("changes the remote path to expected path", function(){

		var spy_cd = jasmine.createSpy();
		sftp_publisher.client = {cd: spy_cd };

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		sftp_publisher.setFilePath("output/sub/some_file", "public_html/site");

		expect(spy_cd.mostRecentCall.args[0]).toEqual("public_html/site/sub");

	});

	it("calls to upload file if remote path exists", function(){
		var spy_cd = jasmine.createSpy();
		spy_cd.andCallFake(function(path, callback){
			callback(null);	
		});

		sftp_publisher.client = {cd: spy_cd };

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		spyOn(sftp_publisher, "uploadFile")

		sftp_publisher.setFilePath("output/sub/some_file", "public_html/site");

		expect(sftp_publisher.uploadFile).toHaveBeenCalledWith("some_file", "content");

	});

	it("throws an error if the upload path doesn't exist", function(){

		var spy_cd = jasmine.createSpy();
		spy_cd.andCallFake(function(path, callback){
			callback("error");	
		});

		sftp_publisher.client = {cd: spy_cd };

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		expect(function(){ sftp_publisher.setFilePath("output/sub/some_file", "public_html/site") }).toThrow();

	});

	it("recursively changes path till it finds a missing directory", function(){
	
		var spy_cd = jasmine.createSpy();
		spy_cd.andCallFake(function(path, callback){
			if(path === "public_html/site" || path === "sub")
				callback();	
			else 
				callback("error");
		});

		var spy_mkdir = jasmine.createSpy();
		spy_mkdir.andCallFake(function(path, mode, callback){
			callback();	
		});

		sftp_publisher.client = {cd: spy_cd, mkdir: spy_mkdir };

		spyOn(sftp_publisher, "uploadFile")

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		sftp_publisher.setFilePath("output/sub/sub2/some_file", "public_html/site")
		
		expect(spy_mkdir.mostRecentCall.args[0]).toEqual("sub2");

	});

	it("recursively creates missing directories in remote path", function(){
	
		var spy_cd = jasmine.createSpy();
		spy_cd.andCallFake(function(path, callback){
			if(path === "public_html/site")
				callback();	
			else 
				callback("error");
		});

		var spy_mkdir = jasmine.createSpy();
		spy_mkdir.andCallFake(function(path, mode, callback){
			callback();	
		});

		sftp_publisher.client = {cd: spy_cd, mkdir: spy_mkdir };

		spyOn(sftp_publisher, "uploadFile")

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");	
		});

		sftp_publisher.setFilePath("output/sub/sub2/some_file", "public_html/site")
		
		expect(spy_mkdir.callCount).toEqual(2);

	});

});

describe("upload a file to remote location", function(){

	it("calls to write file with filename and content", function(){

		spy_writeFile = jasmine.createSpy();

		sftp_publisher.client = {writeFile: spy_writeFile};
		sftp_publisher.uploadFile("test.html", "content");

		expect(spy_writeFile.mostRecentCall.args[0]).toEqual("test.html");
		expect(spy_writeFile.mostRecentCall.args[1]).toEqual("content");
	});

	it("throws an error if writing file fails", function(){
		spy_writeFile = jasmine.createSpy();
		spy_writeFile.andCallFake(function(file_name, content, callback){
			callback("error");	
		});

		sftp_publisher.client = {writeFile: spy_writeFile};
	
		expect(function(){ sftp_publisher.uploadFile("test.html", "content") }).toThrow();

	});

	it("sets a timeout to disconnect the connection", function(){
		spy_writeFile = jasmine.createSpy();
		spy_writeFile.andCallFake(function(file_name, content, callback){
			callback()	
		});

		sftp_publisher.client = {writeFile: spy_writeFile};
	
		setTimeout = jasmine.createSpy();	

		sftp_publisher.uploadFile("test.html", "content");

		expect(setTimeout).toHaveBeenCalled();
	});

});
