var cli = require("../lib/cli.js");

var child_process = require('child_process');

var project_creator = require("../lib/project_creator.js");
var server = require("../lib/server.js");
var generator = require("../lib/site_generator.js");
var publisher = require("../lib/publisher.js");
var config_handler = require("../lib/config_handler.js");

describe("init", function() {

	it("pass arguments to the called command", function() {
		spyOn(cli, "server");

		cli.init(["server", "3009"]);

		expect(cli.server).toHaveBeenCalledWith(["3009"]);
	});

	it("call commands by short code", function() {
		spyOn(cli, "server");

		cli.init(["s", "3009"]);

		expect(cli.server).toHaveBeenCalledWith(["3009"]);
	});

	it("return help for invalid commands", function() {
		spyOn(cli, "help");

		cli.init(["nothing"]);

		expect(cli.help).toHaveBeenCalled();
	});

});

describe("setup a new site", function() {

	it("create a site in target path with default template", function() {
		spyOn(cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(project_creator, "createStructure");

		cli.setup(["path/target"]);

		expect(project_creator.createStructure).toHaveBeenCalledWith("path/target");
	});

	it("create a site in target path with given template", function() {
		spyOn(cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(project_creator, "createStructure");

		cli.setup(["--template", "path/to/template", "path/target"]);

		expect(project_creator.createStructure).toHaveBeenCalledWith("path/target", "path/to/template");
	});

	it("create a site in current path with given template", function() {
		spyOn(cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(project_creator, "createStructure");

		cli.setup(["-t", "path/to/template"]);

		expect(project_creator.createStructure).toHaveBeenCalledWith(undefined, "path/to/template");
	});

	it("create a site in current path with default template", function() {
		spyOn(cli, "notifyIfOutdated").andCallFake(function(cb) { return cb(); });
		spyOn(project_creator, "createStructure");

		cli.setup([]);

		expect(project_creator.createStructure).toHaveBeenCalledWith(undefined);
	});

});

describe("start the server", function() {

	it("get the config given in the path", function() {
		spyOn(config_handler, "getConfig");

		cli.server(["custom_config.json"]);

		expect(config_handler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("start the server with the port given in arguments", function() {
		spyOn(config_handler, "getConfig").andCallFake(function(config_path, callback) {
			return callback({ "server": { "port": 9009 } });
		});

		spyOn(server, "startServer");

		cli.server(["3001"]);

		expect(server.startServer).toHaveBeenCalledWith({ "server": { "port": 3001 } });
	});

});

describe("generate a site", function() {

	it("get the config given in the path", function() {
		spyOn(config_handler, "getConfig");

		cli.generate(["custom_config.json"]);

		expect(config_handler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("set the blank state", function() {
		spyOn(config_handler, "getConfig").andCallFake(function(path, callback) {
			callback({ "generator": { "blank": false }, "plugins": { "generator_hooks": {} } });
		});
		spyOn(generator, "setup");
		spyOn(generator, "generate");

		cli.generate(["--blank"]);

		expect(generator.setup).toHaveBeenCalledWith({ "generator": { "blank": true }, "plugins": { "generator_hooks": {} } });
	});

	it("setup the generator with the supplied config", function() {
		var dummy_config = { "generator": { "blank": false }, "plugins": { "generator_hooks": {} } };
		spyOn(config_handler, "getConfig").andCallFake(function(path, callback) {
			callback(dummy_config);
		});

		spyOn(generator, "setup");
		spyOn(generator, "generate");

		cli.generate(["custom_config.json"]);

		expect(generator.setup).toHaveBeenCalledWith(dummy_config);
	});

	it("call generate with a callback", function() {
		var dummy_config = { "generator": { "blank": false }, "plugins": { "generator_hooks": {} } };
		spyOn(config_handler, "getConfig").andCallFake(function(config_path, callback) {
			return callback(dummy_config);
		});

		spyOn(generator, "setup");
		spyOn(generator, "generate");

		cli.generate(["custom_config.json"]);

		expect(generator.generate).toHaveBeenCalledWith(jasmine.any(Function));
	});

});

describe("publish a site", function() {

	it("get the config given in the path", function() {
		spyOn(config_handler, "getConfig");

		spyOn(publisher, "publish");

		cli.publish(["custom_config.json"]);

		expect(config_handler.getConfig).toHaveBeenCalledWith("custom_config.json", jasmine.any(Function));
	});

	it("call publish with the supplied config", function() {
		var spyConfigObj = jasmine.createSpy();

		spyOn(config_handler, "getConfig").andCallFake(function(config_path, callback) {
			return callback(spyConfigObj);
		});

		spyOn(publisher, "publish");

		cli.publish(["custom_config.json"]);

		expect(publisher.publish).toHaveBeenCalledWith(spyConfigObj);
	});

});

describe("notify if outdated", function() {

	it("call the callback", function() {
		spyOn(child_process, "exec").andCallFake(function(cmd, cb) {
			return cb(null, "outdated message");
		});

		var spyCallback = jasmine.createSpy();
		cli.notifyIfOutdated(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});
