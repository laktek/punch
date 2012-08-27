var server = require("../lib/server.js");

var connect = require("connect");

var default_config = require("../lib/default_config.js");
var pageServer = require("../lib/page_server.js");

describe("start server", function(){

  it("extend the default config with supplied config", function() {
    var supplied_config = { server: { port: 4000 } };
		spyOn(connect, "call").andCallFake(function() {
			return {"use": function(){}, "listen": function(){} };
		});

		spyOn(pageServer, "setup");

    server.startServer(supplied_config);
    expect(server.config.server.port).toEqual(4000);
  });

	it("setup page server with extended config", function() {
		spyOn(connect, "call").andCallFake(function() {
			return {"use": function(middleware){}, "listen": function(){} };
		});

		spyOn(pageServer, "setup");

    server.startServer(default_config);
    expect(pageServer.setup).toHaveBeenCalledWith(default_config);
	});

});
