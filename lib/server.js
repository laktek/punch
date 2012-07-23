var _ = require("underscore");
var connect = require("connect");
var accept  = require('http-accept');

var default_config = require("./default_config.js");
var pageServer = require("./page_server.js");

module.exports = {

  config: {},

	startServer: function(supplied_config){
    var self = this;

    // extend the default configuration
    self.config = _.extend(_.clone(default_config), supplied_config);

		var app = connect.call();

		//log requests
		app.use(connect.logger('short'));

		//access types 
		app.use(accept);

		// there will be 3 main middlewares
		// page server - servers rendered or cached pages
		// api server - gives access to puch template & content API (/api)
		// editor - loads the pages with editing capablities (/editor)

		app.use(pageServer.setup(self.config));
		app.listen(self.config.server.port);
		console.log("Started Punch server on port %s", self.config.server.port);
	}

};
