var cli = require("../lib/cli.js");

var fs = require("fs");

var publisher = require("../lib/publisher.js");

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

});

describe("start the server", function() {

});

describe("generate a site", function() {

});

describe("publish a site", function() {

	it("overrides the default config file with the config file given explicitly", function() {
		spyOn(fs, "readFile");		

		cli.publish(["custom_config.json"]);

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("custom_config.json");
	});

});


