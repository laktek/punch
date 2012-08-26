var publisher = require("../lib/publisher.js");

var fs = require("fs");

var site_generator = require("../lib/site_generator.js");
var module_utils = require("../lib/utils/module_utils.js");

describe("calling publish", function() {

	var config = { "publish": { "strategy": "s3" } };

	it("require the selected strategy", function() {
		spyOn(publisher, "requireStrategy");
		spyOn(publisher, "getLastPublishedDate");
		spyOn(publisher, "delegatedPublish");

		publisher.publish(config);

		expect(publisher.requireStrategy).toHaveBeenCalledWith("s3");
	});

	it("throw an error if no publishing strategy available in config", function(){
		var supplied_config = { "foo": {"sftp": {} } };
		var error = "No publishing settings found. Specify the publish settings in the config file.";

		expect(function(){publisher.publish(supplied_config, null)}).toThrow(error);
	});

	it("read the timestamp file and set the last published date", function(){
		var strategy_obj = { "publish": {} };
		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "getLastPublishedDate");
		spyOn(publisher, "delegatedPublish");

		publisher.publish(config);

		expect(publisher.getLastPublishedDate).toHaveBeenCalled();
	});

	it("generate the site before publishing if generate flag is set", function(){
		var supplied_config = { "publish": { "strategy": "s3", "generate": true } };
		var strategy_obj = { "publish": {} };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "getLastPublishedDate");

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config);

		expect(site_generator.generate).toHaveBeenCalled();
	});

	it("pass the strategy object to deleagated publish method", function(){
		var strategy_obj = { "publish": {} };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "getLastPublishedDate");
		spyOn(publisher, "delegatedPublish");

		publisher.publish(config);

		expect(publisher.delegatedPublish).toHaveBeenCalledWith(strategy_obj);
	});

});

describe("require strategy", function() {

	it("throw an error if the strategy is not available", function() {
		var error = "s3 isn't available as a publishing strategy.";
		publisher.config = { "plugins": {"publishers": {}} };

		expect(function(){ publisher.requireStrategy("s3") }).toThrow(error);

	});

	it("require the given strategy", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		publisher.config =  {"plugins": {"publishers": {"sample": "sample_publisher"}} };

		expect(publisher.requireStrategy("sample").id).toEqual("sample_publisher");
	});

});

describe("set last published date", function() {

	it("read the timestamp file provided in the config", function() {
		spyOn(fs, "readFileSync");

		publisher.config = { "publish": { "timestamp_file": "custom_timestamp_file" } };

		publisher.getLastPublishedDate();

		expect(fs.readFileSync).toHaveBeenCalledWith("custom_timestamp_file", "utf8");
	});

	it("read the default file if no timestamp file provided in the config", function() {
		spyOn(fs, "readFileSync");

		publisher.config = { "publish": {} };

		publisher.getLastPublishedDate();

		expect(fs.readFileSync).toHaveBeenCalledWith(".last_published", "utf8");
	});

	it("parse and set the output of timestamp file as the last published date", function() {
		spyOn(fs, "readFileSync").andCallFake(function() {
			return "1343691639943";
		});

		publisher.config = { "publish": {} };
		publisher.lastPublishedDate = null;

		publisher.getLastPublishedDate();

		expect(publisher.lastPublishedDate).toEqual(new Date(1343691639943));
	});

	it("set last published date to null if an error occurrs when reading the timestamp file", function() {
		spyOn(fs, "readFileSync").andCallFake(function() {
			throw "error";
		});

		publisher.config = { "publish": {} };

		publisher.getLastPublishedDate();

		expect(publisher.lastPublishedDate).toEqual(null);
	});
});

describe("delegate publish", function(){

		it("throws an error if the strategy object doesn't define a publish property", function() {

			var strategy_obj = { };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("throws an error if the strategy object's publish propetry is not a function", function() {

			var strategy_obj = { "publish": null };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("calls the publish function of the passed strategy object", function() {
			var publishCallback = jasmine.createSpy();
			var strategy_obj = { "publish": publishCallback };
			var sample_config = { "foo": "bar" };

			publisher.config = sample_config;
			publisher.lastPublishedDate = new Date(2012, 7, 1);

			publisher.delegatedPublish(strategy_obj);

			expect(publishCallback).toHaveBeenCalledWith(sample_config, new Date(2012, 7, 1), jasmine.any(Function));
		});

});

describe("after publish", function(){
	it("call to set the last published date", function(){
		spyOn(publisher, "setLastPublishedDate");

		publisher.afterPublish();

		expect(publisher.setLastPublishedDate).toHaveBeenCalled();
	});
});
