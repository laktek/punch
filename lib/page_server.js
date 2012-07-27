var url = require("url");
var mime = require("mime");
var path = require("path");

var renderer = require("./page_renderer.js");
var module_utils = require("./utils/module_utils.js");
var path_utils = require("./utils/path_utils.js");

module.exports = {

	cacheStore: null,

	getStatusPage: function(status_code, file_extension, header, callback){
		var self = this;

		self.cacheStore.get(status_code, file_extension, header, function(err, cache_obj){
			if(!err){
				return callback(null, cache_obj);
			} else {
				renderer.serveStatic(status_code + file_extension, null, function(err, rendered_obj){
					if(err){
						return callback(null, {"body": null, "options": {"header": header }});
					}

					//cache the result
					self.cacheStore.update(status_code, file_extension, rendered_obj.body, function(err){
						header["Content-Length"] = rendered_obj.body.length;
						return callback(null, {"body": rendered_obj.body, "options": {"header": header }});
					});	
				});
			}
		});
	},

	sendResponse: function(response, status_code, header, body){
		response.writeHead(status_code, header);	
		response.end(body, "binary");
	},

	prepareResponse: function(response, request_path, rendered_obj, file_extension){
		var self = this;

		// set the header status and content type
		// extend the header with given headers
		var options = rendered_obj.options || {};
		var header = options.header || {};
		var status_code = parseInt(header.status) || 200;

		header["Content-Length"] = (rendered_obj.body && rendered_obj.body.length || 0);
		header["Content-Type"] = header["Content-Type"] || mime.lookup(file_extension);

		if(rendered_obj.modified){
			// if the response is successful and has a body 
			if(status_code === 200 && rendered_obj.body.length){
				// cache the result
				self.cacheStore.update(request_path, file_extension, rendered_obj.body, function(err){
					return self.sendResponse(response, status_code, header, rendered_obj.body);
				});
			} else {
					self.getStatusPage(status_code, file_extension, header, function(err, status_obj){
						return self.sendResponse(response, status_code, status_obj.options.header, status_obj.body);
					});
			}
		} else {
			self.cacheStore.get(request_path, file_extension, header, function(err, cache_obj){
				return self.sendResponse(response, status_code, cache_obj.options.header, cache_obj.body);
			});
		}
	},

	handle: function(request, response, next){
		var self = this;

		var parsed_url = url.parse(request.url, true);  
    var request_path = parsed_url.pathname;
		var file_extension = path_utils.getExtension(request_path, (request.accept && request.accept.types));

		var options = {
			"query": parsed_url.query
		};

		self.cacheStore.lastUpdated(request_path, file_extension, function(err, cache_last_updated){
			renderer.render(request_path, file_extension, cache_last_updated, options, function(rendered_obj){
				return self.prepareResponse(response, request_path, rendered_obj, file_extension);
			});	
		});
	},

	setup: function(config){
		var self = this;

		renderer.setup(config);

		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);

		return function(req, res, next){
			return self.handle(req, res, next);
		}
	}

} 
