var Server = require("../lib/server.js");

var Connect = require("connect");

var DefaultConfig = require("../lib/default_config");
var PageServer = require("../lib/page_server.js");

describe("start server", function(){

  it("extend the default config with supplied config", function() {
    var supplied_config = { server: { port: 4000 } };
		spyOn(Connect, "call").andCallFake(function() {
			return {"use": function(){}, "listen": function(){} };
		});

		spyOn(PageServer, "setup");

    Server.startServer(supplied_config);
    expect(Server.config.server.port).toEqual(4000);
  });

	it("setup page server with extended config", function() {
		spyOn(Connect, "call").andCallFake(function() {
			return {"use": function(middleware){}, "listen": function(){} };
		});

		spyOn(PageServer, "setup");

    Server.startServer(DefaultConfig);
    expect(PageServer.setup).toHaveBeenCalledWith(DefaultConfig);
	});

});
