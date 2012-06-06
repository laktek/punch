var fs = require("fs");
var cli = require("../lib/cli.js");
var publisher = require("../lib/publisher.js");

describe("publishing a site", function(){

	it("overrides the default config file with the config file given explicitly", function(){
		spyOn(fs, "readFile");		

		cli.publish(["custom_config.json"]);

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("custom_config.json");
	
	});

	it("passes the selected publishing strategy", function(){

		spyOn(fs, "readFile").andCallFake(function(config_file, callback){
			callback(null, "{}")	
		});

		spyOn(publisher, "publish");

		cli.publish(["s3"]);

		expect(publisher.publish).toHaveBeenCalledWith({}, "s3");

	});

});


