var fs = require("fs");
var cli = require("../lib/cli.js");
var publisher = require("../lib/publisher.js");

describe("publishing a site", function(){

	it("use the strategy given in arguments", function(){

		spyOn(publisher, "publish");

		cli.publish(["sftp"]);

    expect(publisher.publish).toHaveBeenCalledWith("sftp");
  });

  it("if no strategy given, use the first publishing strategy available in the config", function(){

    spyOn(fs, "readFile").andCallFake(function(config_file, callback){
			callback(null, '{"publishers": [ "s3", "sftp" ]}')
    });

		spyOn(publisher, "publish");

		cli.publish([]);

    expect(publisher.publish).toHaveBeenCalledWith("s3");
  }); 

	
});


