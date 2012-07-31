var publisher = require("../lib/publisher.js");
var site_generator = require("../lib/site_generator.js");

var fs = require("fs");

describe("calling publish", function(){

	it("extends the default config with the supplied config", function(){
		var supplied_config = { "foo": "bar" };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return {"publish": function(){} } });

		spyOn(publisher, "setLastPublishedDate");
		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config, "dummy");	

		expect(publisher.config.foo).toEqual("bar");
	});

	it("requires the selected strategy", function(){
		var supplied_config = { "foo": "bar" };

		spyOn(publisher, "requireStrategy");
		spyOn(publisher, "setLastPublishedDate");

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config, "s3");	
	
		expect(publisher.requireStrategy).toHaveBeenCalledWith("s3");
	});

	it("requires the first strategy available in config, if theres no selected strategy", function(){
		var supplied_config = { "publish": {"sftp": {} } };

		spyOn(publisher, "requireStrategy");
		spyOn(publisher, "setLastPublishedDate");

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config, null);	
	
		expect(publisher.requireStrategy).toHaveBeenCalledWith("sftp");
	});

	it("throws an error if no publishing strategy available in config", function(){
		var supplied_config = { "foo": {"sftp": {} } };
		var error = "No publishing strategy found. Set a publishing strategy in config file."

		expect(function(){publisher.publish(supplied_config, null)}).toThrow(error);
	});

	it("read the timestamp file and set the last published date", function(){
		var supplied_config = { "foo": "bar" };
		var strategy_obj = { "publish": function(){} };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "setLastPublishedDate");

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config, "s3");	

		expect(publisher.setLastPublishedDate).toHaveBeenCalled();
	});

	it("generates the site before publishing", function(){
		var supplied_config = { "foo": "bar" };
		var strategy_obj = { "publish": function(){} };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "setLastPublishedDate");

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate");

		publisher.publish(supplied_config, "s3");	

		expect(site_generator.generate).toHaveBeenCalled();
	});

	it("passes the strategy object to deleagated publish method", function(){
		var supplied_config = { "foo": "bar" };
		var strategy_obj = { "publish": function(){} };

		spyOn(publisher, "requireStrategy").andCallFake(function(strategy){ return strategy_obj });
		spyOn(publisher, "setLastPublishedDate");

		spyOn(publisher, "delegatedPublish").andCallFake(function(strategy_obj){ });

		spyOn(site_generator, "setup");
		spyOn(site_generator, "generate").andCallFake(function(callback){
			return callback();	
		});

		publisher.publish(supplied_config, "s3");	
	
		expect(publisher.delegatedPublish).toHaveBeenCalledWith(strategy_obj);
	});

});

describe("require strategy", function(){

	it("throws an error if the strategy is not available", function(){
		var error = "s3 isn't available as a publishing strategy."
		publisher.config = { "plugins": {"publishers": {}} };

		expect(function(){ publisher.requireStrategy("s3") }).toThrow(error);

	});	

	it("requires the given strategy", function(){
		publisher.config =  {"plugins": {"publishers": {"sample": "../spec/sample_publisher"}} }		

		var sample_publisher = publisher.requireStrategy("sample");
		expect(sample_publisher.name).toEqual("sample publisher");
	});

});

describe("set last published date", function(){
	it("read the timestamp file provided in the config", function(){
		spyOn(fs, "readFileSync");

		publisher.config = {"publish": {"timestamp_file": "custom_timestamp_file"} };

		publisher.setLastPublishedDate();

		expect(fs.readFileSync).toHaveBeenCalledWith("custom_timestamp_file", "utf8");
	});

	it("read the default file if no timestamp file provided in the config", function(){
		spyOn(fs, "readFileSync");

		publisher.config = {"publish": {} };

		publisher.setLastPublishedDate();

		expect(fs.readFileSync).toHaveBeenCalledWith(".last_published", "utf8");
	});

	it("parse and set the output of timestamp file as the last published date", function(){
		spyOn(fs, "readFileSync").andCallFake(function(){
			return "1343691639943"	
		});

		publisher.config = {"publish": {} };
		publisher.lastPublishedDate = null;

		publisher.setLastPublishedDate();

		expect(publisher.lastPublishedDate).toEqual(new Date(1343691639943));
	});

	it("set last published date to null if an error occurrs when reading the timestamp file", function(){
		spyOn(fs, "readFileSync").andCallFake(function(){
			throw "error"
		});

		publisher.config = {"publish": {} };

		publisher.setLastPublishedDate();

		expect(publisher.lastPublishedDate).toEqual(null);
	});
});

describe("delegate publish", function(){

		it("throws an error if the strategy object doesn't define a publish property", function(){

			var strategy_obj = { };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("throws an error if the strategy object's publish propetry is not a function", function(){
			
			var strategy_obj = { "publish": null };
			var error = "Publish property not defined or it's not a function.";

			expect(function() { publisher.delegatedPublish(strategy_obj) }).toThrow(error);

		});

		it("calls the publish function of the passed strategy object", function(){
		
			var publishCallback = jasmine.createSpy();
			var strategy_obj = { "publish": publishCallback };
			var sample_config = { "foo": "bar" };

			publisher.config = sample_config;
			publisher.delegatedPublish(strategy_obj);		

			expect(publishCallback).toHaveBeenCalledWith(sample_config);

		});

});

