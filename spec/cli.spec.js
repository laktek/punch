var Cli = require("../lib/cli.js");

var ChildProcess = require('child_process');

var ProjectCreator = require("../lib/project_creator");
var Server = require("../lib/server");
var SiteGenerator = require("../lib/site_generator.js");
var Publisher = require("../lib/publisher.js");
var ConfigHandler = require("../lib/config_handler.js");

describe("init", function() {

	it("pass arguments to the called command", function() {
		spyOn(Cli, "Server");

		Cli.init(["Server", "3009"]);

		expect(Cli.Server).toHaveBeenCalledWith(["3009"]);
	});

	it("call commands by short code", function() {
		spyOn(Cli, "Server");

		Cli.init(["s", "3009"]);

		expect(Cli.Server).toHaveBeenCalledWith(["3009"]);
	});

	it("return help for invalid commands", function() {
		spyOn(Cli, "help");

		Cli.init(["nothing"]);

		expect(Cli.help).toHaveBeenCalled();
	});

});

describe("setup a new site", function() {

	it("create a site in target path with default template", function() {
		spyOn(Cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(ProjectCreator, "createStructure");

		Cli.setup(["path/target"]);

		expect(ProjectCreator.createStructure).toHaveBeenCalledWith("path/target");
	});

	it("create a site in target path with given template", function() {
		spyOn(Cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(ProjectCreator, "createStructure");

		Cli.setup(["--template", "path/to/template", "path/target"]);

		expect(ProjectCreator.createStructure).toHaveBeenCalledWith("path/target", "path/to/template");
	});

	it("create a site in current path with given template", function() {
		spyOn(Cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(ProjectCreator, "createStructure");

		Cli.setup(["-t", "path/to/template"]);

		expect(ProjectCreator.createStructure).toHaveBeenCalledWith(undefined, "path/to/template");
	});

	it("create a site in current path with default template", function() {
		spyOn(Cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(ProjectCreator, "createStructure");

		Cli.setup([]);

		expect(ProjectCreator.createStructure).toHaveBeenCalledWith(undefined);
	});

});

describe("start the Server", function() {

	it("get the config given in the path", function() {
		spyOn(ConfigHandler, "getConfig");

		Cli.Server(["custom_config.json"]);

		expect(ConfigHandler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("start the Server with the port given in arguments", function() {
		spyOn(ConfigHandler, "getConfig").andCallFake(function(config_path, callback) {
			return callback({ "Server": { "port": 9009 } });
		});

		spyOn(Server, "startServer");

		Cli.Server(["3001"]);

		expect(Server.startServer).toHaveBeenCalledWith({ "Server": { "port": 3001 } });
	});

});

describe("generate a site", function() {

	it("get the config given in the path", function() {
		spyOn(ConfigHandler, "getConfig");

		Cli.generate(["custom_config.json"]);

		expect(ConfigHandler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("set the blank state", function() {
		spyOn(ConfigHandler, "getConfig").andCallFake(function(path, callback) {
			callback({ "SiteGenerator": { "blank": false }, "plugins": { "SiteGenerator_hooks": {} } });
		});
		spyOn(SiteGenerator, "setup");
		spyOn(SiteGenerator, "generate");

		Cli.generate(["--blank"]);

		expect(SiteGenerator.setup).toHaveBeenCalledWith({ "SiteGenerator": { "blank": true }, "plugins": { "SiteGenerator_hooks": {} } });
	});

	it("setup the SiteGenerator with the supplied config", function() {
		var dummy_config = { "SiteGenerator": { "blank": false }, "plugins": { "SiteGenerator_hooks": {} } };
		spyOn(ConfigHandler, "getConfig").andCallFake(function(path, callback) {
			callback(dummy_config);
		});

		spyOn(SiteGenerator, "setup");
		spyOn(SiteGenerator, "generate");

		Cli.generate(["custom_config.json"]);

		expect(SiteGenerator.setup).toHaveBeenCalledWith(dummy_config);
	});

	it("call generate with a callback", function() {
		var dummy_config = { "SiteGenerator": { "blank": false }, "plugins": { "SiteGenerator_hooks": {} } };
		spyOn(ConfigHandler, "getConfig").andCallFake(function(config_path, callback) {
			return callback(dummy_config);
		});

		spyOn(SiteGenerator, "setup");
		spyOn(SiteGenerator, "generate");

		Cli.generate(["custom_config.json"]);

		expect(SiteGenerator.generate).toHaveBeenCalledWith(jasmine.any(Function));
	});

});

describe("publish a site", function() {

	it("get the config given in the path", function() {
		spyOn(ConfigHandler, "getConfig");

		spyOn(Publisher, "publish");

		Cli.publish(["custom_config.json"]);

		expect(ConfigHandler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("call publish with the supplied config", function() {
		var spyConfigObj = jasmine.createSpy();

		spyOn(ConfigHandler, "getConfig").andCallFake(function(config_path, callback) {
			return callback(spyConfigObj);
		});

		spyOn(Publisher, "publish");

		Cli.publish(["custom_config.json"]);

		expect(Publisher.publish).toHaveBeenCalledWith(spyConfigObj);
	});

});

describe("notify if outdated", function() {

	it("call the callback", function() {
		spyOn(ChildProcess, "exec").andCallFake(function(cmd, cb) {
			return cb(null, "outdated message");
		});

		var spyCallback = jasmine.createSpy();
		Cli.notifyIfOutdated(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});
