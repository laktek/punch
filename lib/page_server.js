var renderer = require("./page_renderer.js");

module.exports = {
	handle: function(req, res, next){
		// request path
		// file extension
		// cache store last modified
		// callback
		// 	- if modified update cache store and respond
		// 	- else get from cache store and respond
		renderer.render(req.path)	
	},

	setup: function(config){
		var self = this;
		renderer.setup(config);

		return self.handle; 
	}

} 
