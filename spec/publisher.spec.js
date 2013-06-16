var Publisher = require("../lib/publisher");

var Fs = require("fs");

var SiteGenerator = require("../lib/site_generator");
var ModuleUtils = require("../lib/utils/module_utils");

describe("calling publish", function() {

	var config = { "publish": { "strategy": "s3" } };

	it("require the selected strategy", function() {
		spyOn(Publisher, "requireStrategy");
		spyOn(Publisher, "getLastPublishedDate");
		spyOn(Publisher, "delegatedPublish");

		Publisher.publish(config);

		expect(Publisher.requireStrategy).toHaveBeenCalledWith("s3");
	});

	it("throw an error if no publishing strategy available in config", function(){
		var supplied_config = { "foo": {"sftp": {} } };
		var error = "No publishing settings found. Specify the publish settings in the config file.";

		expect(function(){Publisher.publish(supplied_config, null)}).toThrow(error);
	});

	it("read the timestamp file and set the last published date", function(){
		var strategy_obj = { "publish": {} };
		spyOn(Publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(Publisher, "getLastPublishedDate");
		spyOn(Publisher, "delegatedPublish");

		Publisher.publish(config);

		expect(Publisher.getLastPublishedDate).toHaveBeenCalled();
	});

	it("generate the site before publishing if generate flag is set", function(){
		var supplied_config = { "publish": { "strategy": "s3", "generate": true } };
		var strategy_obj = { "publish": {} };

		spyOn(Publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(Publisher, "getLastPublishedDate");

		spyOn(SiteGenerator, "setup");
		spyOn(SiteGenerator, "generate");

		Publisher.publish(supplied_config);

		expect(SiteGenerator.generate).toHaveBeenCalled();
	});

	it("pass the strategy object to deleagated publish method", function(){
		var strategy_obj = { "publish": {} };

		spyOn(Publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(Publisher, "getLastPublishedDate");
		spyOn(Publisher, "delegatedPublish");

		Publisher.publish(config);

		expect(Publisher.delegatedPublish).toHaveBeenCalledWith(strategy_obj);
	});

});

describe("require strategy", function() {

	it("throw an error if the strategy is not available", function() {
		var error = "s3 isn't available as a publishing strategy.";
		Publisher.config = { "plugins": {"publishers": {}} };

		expect(function(){ Publisher.requireStrategy("s3") }).toThrow(error);

	});

	it("require the given strategy", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		Publisher.config =  {"plugins": {"publishers": {"sample": "sample_Publisher"}} };

		expect(Publisher.requireStrategy("sample").id).toEqual("sample_Publisher");
	});

});

describe("set last published date", function() {

	it("read the timestamp file provided in the config", function() {
		spyOn(Fs, "readFileSync");

		Publisher.config = { "publish": { "timestamp_file": "custom_timestamp_file" } };

		Publisher.getLastPublishedDate();

		expect(Fs.readFileSync).toHaveBeenCalledWith("custom_timestamp_file", "utf8");
	});

	it("read the default file if no timestamp file provided in the config", function() {
		spyOn(Fs, "readFileSync");

		Publisher.config = { "publish": {} };

		Publisher.getLastPublishedDate();

		expect(Fs.readFileSync).toHaveBeenCalledWith(".last_published", "utf8");
	});

	it("parse and set the output of timestamp file as the last published date", function() {
		spyOn(Fs, "readFileSync").andCallFake(function() {
			return "1343691639943";
		});

		Publisher.config = { "publish": {} };
		Publisher.lastPublishedDate = null;

		Publisher.getLastPublishedDate();

		expect(Publisher.lastPublishedDate).toEqual(new Date(1343691639943));
	});

	it("set last published date to null if an error occurrs when reading the timestamp file", function() {
		spyOn(Fs, "readFileSync").andCallFake(function() {
			throw "error";
		});

		Publisher.config = { "publish": {} };

		Publisher.getLastPublishedDate();

		expect(Publisher.lastPublishedDate).toEqual(null);
	});
});

describe("delegate publish", function(){

		it("throws an error if the strategy object doesn't define a publish property", function() {

			var strategy_obj = { };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { Publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("throws an error if the strategy object's publish propetry is not a function", function() {

			var strategy_obj = { "publish": null };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { Publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("calls the publish function of the passed strategy object", function() {
			var publishCallback = jasmine.createSpy();
			var strategy_obj = { "publish": publishCallback };
			var sample_config = { "foo": "bar" };

			Publisher.config = sample_config;
			Publisher.lastPublishedDate = new Date(2012, 7, 1);

			Publisher.delegatedPublish(strategy_obj);

			expect(publishCallback).toHaveBeenCalledWith(sample_config, new Date(2012, 7, 1), jasmine.any(Function));
		});

});

describe("after publish", function(){
	it("call to set the last published date", function(){
		spyOn(Publisher, "setLastPublishedDate");

		Publisher.afterPublish();

		expect(Publisher.setLastPublishedDate).toHaveBeenCalled();
	});
});
