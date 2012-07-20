var url = require("url");
var mime = require("mime");
var path = require("path");

var renderer = require("./page_renderer.js");

module.exports = {

	cacheStore: null,

	getExtension: function(request_path, accept_types){
		var extension_from_path = path.extname(request_path);

		if(extension_from_path.length){
			return extension_from_path;
		} else {
			var best_access_type = accept_types.length && accept_types.shift()["mediarange"];		

			return "." + (mime.extension(best_access_type) || "html");
		}
	},

	prepareResponse: function(response, request_path, rendered_obj, file_extension){
		if(rendered_obj.modified){
			self.cacheStore.update(request_path, rendered_obj.body, function(){
				// set the header status and content type
				// extend the header with given headers
				// set body
			});	
		} else {
			self.cacheStore.get(request_path, function(err, cached_body){
				// set the header status and content type
				// set body
			});
		}
	},

	handle: function(req, res, next){
		var self = this;

		var parsed_url = url.parse(req.url, true);  
    var request_path = parsed_url.pathname;
		var file_extension = self.getExtension(request_path, (req.accept && req.accept.types));

		var options = {
			"query": parsed_url.query
		};

		self.cacheStore.lastUpdated(request_path, function(err, cache_last_updated){
			renderer.render(request_path, file_extension, cache_last_updated, options, function(rendered_obj){
				return self.prepareResponse(res, request_path, rendered_obj, file_extension);
			});	
		});
	},

	setup: function(config){
		var self = this;

		//setup renderer
		renderer.setup(config);

		//setup cache store

		return self.handle; 
	}

} 
