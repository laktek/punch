var url = require("url");
var mime = require("mime");
var fresh = require("fresh");

var renderer = require("./page_renderer.js");
var asset_bundler = require("./asset_bundler.js");

var module_utils = require("./utils/module_utils.js");
var path_utils = require("./utils/path_utils.js");
var object_utils = require("./utils/object_utils.js");
var connect_utils = require("connect").utils;

module.exports = {

	cacheStore: null,

	cacheSettings: {},

	setup: function(config){
		var self = this;

		self.cacheSettings = (config.server && config.server.cache) || {};

		renderer.setup(config);

		asset_bundler.setup(config);

		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);

		return function(req, res, next){
			return self.handle(req, res, next);
		};
	},

	setCacheExpiryHeaders: function(header, cache_settings) {
		var cache_control = ( cache_settings.directives && cache_settings.directives.slice(0) ) || [];

		var max_age = cache_settings["max_age"] || 0;
		cache_control.push("max-age=" + max_age);

		var expiry_milliseconds = new Date().getTime() + (parseInt(max_age, 10) * 1000);
		header["Expires"] = new Date(expiry_milliseconds).toUTCString();
		header["Cache-Control"] = cache_control.join(", ");
	},

	setContentType: function(header, file_extension, preset) {
		if (preset) {
			header["Content-Type"] = preset;
		}	else {
			var content_type = mime.lookup(file_extension);
			var charset = mime.charsets.lookup(content_type);

			header["Content-Type"] = content_type + (charset ? "; charset=" + charset.toLowerCase() : "");
		}
	},

	sendResponse: function(response, status_code, headers, body) {
		var encoding = (headers["Content-Type"].split(";")[0] === "text/html") ? "utf8" : "binary";

		response.statusCode = parseInt(status_code, 10);

		if (headers) {
			for (var name in headers) {
				if (headers.hasOwnProperty(name)) {
					response.setHeader(name, headers[name]);
				}
			}
		}

		response.end(body, encoding);
	},

	getStatusPage: function(response, status_code, file_extension, header, request_options) {
		var self = this;
		var status_code_path = "/" + status_code;

		// reset the content type to error page's content type
		self.setContentType(header, file_extension);

		self.cacheStore.get(status_code_path, file_extension, object_utils.cacheObj(null, header), request_options, function(err, cache_obj){
			if(!err){
				return self.sendResponse(response, status_code, cache_obj.options.header, cache_obj.body);
			} else {
				renderer.render(status_code_path, file_extension, null, request_options, function(rendered_obj) {

					var body_length = (rendered_obj.body && rendered_obj.body.length || 0);
					header["Content-Length"] = body_length;

					if (body_length) {
						self.cacheStore.update(status_code_path, file_extension, object_utils.cacheObj(rendered_obj.body, header), request_options, function(err){
							if (err) {
								// we do nothing here.
								// maybe log the failure?
							}

							return self.sendResponse(response, status_code, header, rendered_obj.body);
						});
					} else {
						return self.sendResponse(response, status_code, header, "");
					}
				});
			}
		});
	},

	prepareRenderedResponse: function(response, request_basename, file_extension, rendered_obj, request_options) {
		var self = this;

		var rendered_options = rendered_obj.options || {};
		var header = rendered_options.header || {};
		var cache_settings = rendered_options.cache || self.cacheSettings;
		var status_code = parseInt(rendered_options.status, 10) || 200;

		self.setContentType(header, file_extension, header["Content-Type"]);

		self.setCacheExpiryHeaders(header, cache_settings);

		// Check for log messages and print them on the console.
		if (rendered_options.log) {
			console.log(rendered_options.log.message);
		}

		if (status_code === 200 && rendered_obj.body.length) {
			self.cacheStore.update(request_basename, file_extension, object_utils.cacheObj(rendered_obj.body, header), request_options, function(err, cache_obj) {
				if (err) {
					console.log("[Error in Cache] " + err);
					return self.getStatusPage(response, 500, ".html", header, request_options);
				}

				return self.sendResponse(response, status_code, cache_obj.options.header, cache_obj.body);
			});
		} else {
			return self.getStatusPage(response, status_code, ".html", header, request_options);
		}
	},

	prepareCachedResponse: function(response, request_basename, file_extension, rendered_obj, request_options) {
		var self = this;

		var rendered_options = rendered_obj.options || {};
		var header = rendered_options.header || {};
		var cache_settings = rendered_options.cache || self.cacheSettings;
		var status_code = parseInt(rendered_options.status, 10) || 200;

		self.setContentType(header, file_extension, header["Content-Type"]);

		self.setCacheExpiryHeaders(header, cache_settings);

		self.cacheStore.get(request_basename, file_extension, object_utils.cacheObj(null, header), request_options, function(err, cache_obj) {
			return self.sendResponse(response, status_code, cache_obj.options.header, cache_obj.body);
		});
	},

	validatePublicCache: function(request, response, stat, callback) {
		var self = this;
		var headers;

		if (connect_utils.conditionalGET(request)) {
			if (stat) {
				headers = { "etag": connect_utils.etag(stat), "last-modified": stat.mtime };
			} else {
				headers = { "etag": response.getHeader("etag"), "last-modified": response.getHeader("last-modified") };
			}

			// check if the cache is still fresh
			if (fresh(request.headers, headers)) {
				return connect_utils.notModified(response);
			}	else {
				return callback();
			}
		} else {
			return callback();
		}
	},

	handleBundleRequest: function(request, response, request_basename, file_extension, request_options) {
		var self = this;

		asset_bundler.getBundle(request_basename, file_extension, request_options, function(err, bundled_obj) {
			if (err) {
				return self.getStatusPage(response, 404, ".html", {}, request_options);
			}

			var bundled_options = bundled_obj.options || {};
			var header = bundled_options.header || {};
			var cache_settings = bundled_options.cache || self.cacheSettings;
			var status_code = parseInt(bundled_options.status, 10) || 200;

			self.setContentType(header, file_extension);
			self.setCacheExpiryHeaders(header, cache_settings);

			// Check for log messages and print them on the console.
			if (bundled_options.log) {
				console.log(bundled_options.log.message);
			}

			if (bundled_obj.modified) {
				return self.sendResponse(response, status_code, header, bundled_obj.body);
			} else {
				response.setHeader("ETag", header["ETag"]);
				response.setHeader("Last-Modified", header["Last-Modified"]);

				// If public cache is not modified serve a 304 response.
				return self.validatePublicCache(request, response, null, function() {
					// This callback runs only if the public cache is invalid.
					return self.sendResponse(response, status_code, header, bundled_obj.body);
				});
			}
		});
	},

	handlePageRequest: function(request, response, request_basename, file_extension, request_options) {
		var self = this;

		self.cacheStore.stat(request_basename, file_extension, request_options, function(err, stat) {
			var last_modified = (stat && stat.mtime) || null;

			renderer.render(request_basename, file_extension, last_modified, request_options, function(rendered_obj) {
				if (rendered_obj.modified) {
					return self.prepareRenderedResponse(response, request_basename, file_extension, rendered_obj, request_options);
				} else {
					// If public cache is not modified serve a 304 response.
					return self.validatePublicCache(request, response, stat, function() {
						// This callback runs only if the public cache is invalid.
						return self.prepareCachedResponse(response, request_basename, file_extension, rendered_obj, request_options);
					});
				}
			});
		});
	},

	handle: function(request, response, next) {
		var self = this;

		var parsed_url = url.parse(request.url, true);
    var request_path = parsed_url.pathname.replace(/\.\.\/|\/$/g, "");

		var file_extension = path_utils.getExtension(request_path, (request.accept && request.accept.types));
		var request_basename = path_utils.getBasename(request_path, file_extension);

		var request_options = {
			"query": parsed_url.query,
			"host": request.headers.host,
			"xhr": (request.headers.http_x_requested_with && request.headers.http_x_requested_with === "xmlhttprequest"),
			"authorization": request.headers.authorization,
			"header": request.headers,
			"cookies": request.cookies
		};

		// check if the given request is an asset bundler request
		if (asset_bundler.isBundlePath(request_basename, file_extension)) {
			return self.handleBundleRequest(request, response, request_basename, file_extension, request_options);
		} else {
			return self.handlePageRequest(request, response, request_basename, file_extension, request_options);
		}
	},

};
