var Connect = require("connect");
var Accept  = require("http-accept");

var PageServer = require("./page_server");

module.exports = {

  config: {},

	startServer: function(config){
    var self = this;

    // extend the default configuration
    self.config = config;

		var app = Connect.call();

		// log requests
		app.use( Connect.logger("short") );

		// set access types in request object
		app.use(Accept);

		// parse cookies
		app.use( Connect.cookieParser() );

		// compress responses to GZip/Deflate
		app.use( Connect.compress() );

		// there will be 3 main middlewares
		// page server - servers rendered or cached pages
		// api server - gives access to puch template & content API (/api)
		// editor - loads the pages with editing capablities (/editor)
		app.use( PageServer.setup(self.config) );

		app.listen(self.config.server.port);

		console.log("Started Punch server on port %s", self.config.server.port);
	}
};
