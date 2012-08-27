var fs = require("fs");
var sftp_publisher = require("../../lib/publishers/sftp.js");

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
		var supplied_config = {"publish": { "strategy": "sftp", "options": sftp_config }};

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

describe("check if a file is modified", function() {

	it("return true if file modified date is newer than last published date", function() {
		sftp_publisher.lastPublishedDate = new Date(2012, 6, 25);

		expect(sftp_publisher.isModified(new Date(2012, 6, 30))).toEqual(true);
	});

});

describe("check and create a remote directory", function(){

	it("takes the stat for the remote directory", function(){
		var spy_stat = jasmine.createSpy();
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {stat: spy_stat};

		sftp_publisher.checkAndCreateRemoteDirectory("public_html/site", spy_callback);
		expect(spy_stat).toHaveBeenCalled();
	});

	it("executes the callback if remote directory already exists", function(){
		var spy_stat = jasmine.createSpy();
		spy_stat.andCallFake(function(path, cbk){
			cbk(null, {isDirectory: function(){ return true} });
		});
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {stat: spy_stat};

		sftp_publisher.checkAndCreateRemoteDirectory("public_html/site", spy_callback);
		expect(spy_callback).toHaveBeenCalled();
	});

	it("creates a remote directory if it doesn't exists", function(){
		var spy_stat = jasmine.createSpy();
		spy_stat.andCallFake(function(path, cbk){
			cbk("error", null);
		});
		var spy_mkdir = jasmine.createSpy();
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {stat: spy_stat, mkdir: spy_mkdir};

		sftp_publisher.checkAndCreateRemoteDirectory("public_html/site", spy_callback);
		expect(spy_mkdir.mostRecentCall.args[0]).toEqual("public_html/site");
	});

	it("executes the callback after creating the remote directory", function(){
		var spy_stat = jasmine.createSpy();
		spy_stat.andCallFake(function(path, cbk){
			cbk("error", null);
		});
		var spy_mkdir = jasmine.createSpy();
		spy_mkdir.andCallFake(function(path, mode, cbk){
			cbk();
		});
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {stat: spy_stat, mkdir: spy_mkdir};

		sftp_publisher.checkAndCreateRemoteDirectory("public_html/site", spy_callback);
		expect(spy_callback).toHaveBeenCalled();
	});

	it("throws an exception if there's an error in creating the remote directory", function(){
		var spy_stat = jasmine.createSpy();
		spy_stat.andCallFake(function(path, cbk){
			cbk("error", null);
		});
		var spy_mkdir = jasmine.createSpy();
		spy_mkdir.andCallFake(function(path, mode, cbk){
			cbk("error");
		});
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {stat: spy_stat, mkdir: spy_mkdir};

		expect(function(){sftp_publisher.checkAndCreateRemoteDirectory("public_html/site", spy_callback)}).toThrow();
	});

});

describe("upload file", function() {

	it("reads the file in given path", function(){
		spyOn(fs, "readFile");
		var spy_callback = jasmine.createSpy();

		sftp_publisher.uploadFile("output/file", "public_html/site", spy_callback);
		expect(fs.readFile.mostRecentCall.args[0]).toEqual("output/file");
	});

	it("writes the file to the given remote path", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");
		});
		var spy_writefile = jasmine.createSpy();
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {writeFile: spy_writefile};

		sftp_publisher.uploadFile("output/file", "public_html/site", spy_callback);
		expect(spy_writefile.mostRecentCall.args[0]).toEqual("public_html/site");
	});

	it("executes the callback after writing the file", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");
		});
		var spy_writefile = jasmine.createSpy();
		spy_writefile.andCallFake(function(path, buffer, callback){
			callback(null);
		});
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {writeFile: spy_writefile};

		sftp_publisher.uploadFile("output/file", "public_html/site", spy_callback);
		expect(spy_callback).toHaveBeenCalled();
	});

	it("throws an exception if there's an error in writing the file", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			callback(null, "content");
		});
		var spy_writefile = jasmine.createSpy();
		spy_writefile.andCallFake(function(path, buffer, callback){
			callback("error");
		});
		var spy_callback = jasmine.createSpy();
		sftp_publisher.client = {writeFile: spy_writefile};

		expect(function(){ sftp_publisher.uploadFile("output/file", "public_html/site", spy_callback)	}).toThrow();
	});

});
