var page_server = require("../lib/page_server.js");

var page_renderer = require("../lib/page_renderer.js");
var asset_bundler = require("../lib/asset_bundler.js");
var module_utils = require("../lib/utils/module_utils.js");
var path_utils = require("../lib/utils/path_utils.js");
var connect_utils = require("connect").utils;

describe("setup the page server", function(){

	it("setup the renderer", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(page_renderer, "setup");

		page_server.setup(sample_config);
		expect(page_renderer.setup).toHaveBeenCalledWith(sample_config);
	});

	it("setup the asset bundler", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(page_renderer, "setup");
		spyOn(asset_bundler, "setup");

		page_server.setup(sample_config);
		expect(asset_bundler.setup).toHaveBeenCalledWith(sample_config);
	});

	it("setup the cache store", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(page_renderer, "setup");

		page_server.setup(sample_config);
		expect(page_server.cacheStore).toEqual({});
	});

	it("return a handler function", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(page_renderer, "setup");
		expect(page_server.setup(sample_config)).toEqual(jasmine.any(Function));
	});

});

describe("set cache expiry headers", function() {

	it("set only the given directives", function() {
		var header = {};
		var cache_settings = { "directives": [ "public", "no-cache" ] };

		page_server.setCacheExpiryHeaders(header, cache_settings);

		expect(header["Cache-Control"]).toEqual("public, no-cache, max-age=0");
	});

	it("set the given max age", function() {
		var header = {};
		var cache_settings = { "max_age": 3600, "directives": [] };

		page_server.setCacheExpiryHeaders(header, cache_settings);

		expect(header["Cache-Control"]).toEqual("max-age=3600");
	});

	it("set the expires header", function() {
		var header = {};
		var cache_settings = { "max_age": 86400, "directives": [] };
		var tomorrow = new Date().getTime() + (86400 * 1000);

		page_server.setCacheExpiryHeaders(header, cache_settings);

		expect( Date.parse(header["Expires"]) - tomorrow ).toBeLessThan(1000);
	});

});

describe("set content type header", function() {

	it("use the given preset", function() {
		var header = {};

		page_server.setContentType(header, ".json", "application/json");

		expect(header["Content-Type"]).toEqual("application/json");
	});

	it("set only the mime type for non-text types", function() {
		var header = {};

		page_server.setContentType(header, ".jpg");

		expect(header["Content-Type"]).toEqual("image/jpeg");
	});

	it("set mime type and charset for text types", function() {
		var header = {};

		page_server.setContentType(header, ".html");

		expect(header["Content-Type"]).toEqual("text/html; charset=utf-8");
	});

});

describe("handle request", function() {

	it("strip the trailing slashes from the request url", function(){
		var dummy_request = { "url": "/path/test", "headers": { "host": "www.example.com" } };

		var spyCacheLastUpdated = jasmine.createSpy();
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(asset_bundler, "isBundlePath");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("/path/test");
	});

	it("strip malicious paths from the request url", function(){
		var dummy_request = { "url": "/path/test", "headers": { "host": "www.example.com" } };

		var spyCacheLastUpdated = jasmine.createSpy();
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(asset_bundler, "isBundlePath");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("/path/test");
	});

	it("get the file extension for the given request", function(){
		var dummy_request = { "url": "/path/test", "headers": { "host": "www.example.com" }, "accept": { "types": {} } };

		var spyCacheLastUpdated = jasmine.createSpy();
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(asset_bundler, "isBundlePath");

		page_server.handle(dummy_request, {}, function(){ });
		expect(path_utils.getExtension).toHaveBeenCalledWith("/path/test", {});
	});

	it("extract the basename from the request path", function(){
		var dummy_request = { "url": "/path/test.js", "headers": { "host": "www.example.com" } };

		var spyCacheStat = jasmine.createSpy();
		page_server.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".js");

		spyOn(asset_bundler, "isBundlePath");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheStat.mostRecentCall.args[0]).toEqual("/path/test");
	});

	it("extract options from the request", function() {
		var spyCookies = jasmine.createSpy();
		var spyAuthorization = jasmine.createSpy();
		var dummy_request = { "url": "/path/test?foo=bar", "cookies": spyCookies, "headers": { "authorization": spyAuthorization, "host": "sub.example.com", "http_x_requested_with": "xmlhttprequest" } };

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(asset_bundler, "isBundlePath").andReturn(false);

		spyOn(page_server, "handlePageRequest");

		page_server.handle(dummy_request, {}, function(){});

		expect(page_server.handlePageRequest).toHaveBeenCalledWith(dummy_request, {}, "/path/test", ".html", { "query": { "foo": "bar" }, "host": "sub.example.com", "cookies": spyCookies, "authorization": spyAuthorization, "xhr": true, "header": { "authorization": spyAuthorization, "host": "sub.example.com", "http_x_requested_with": "xmlhttprequest" } });
	});

	it("handle bundle requests", function() {
		var dummy_request = { "url": "/path/test.js", "headers": { "host": "www.example.com" } };

		var spyCacheStat = jasmine.createSpy();
		page_server.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".js");

		spyOn(asset_bundler, "isBundlePath").andReturn(true);

		spyOn(page_server, "handleBundleRequest");

		page_server.handle(dummy_request, {}, function(){ });

		expect(page_server.handleBundleRequest).toHaveBeenCalledWith(dummy_request, {}, "/path/test", ".js", jasmine.any(Object));
	});

	it("handle page requests", function() {
		var dummy_request = { "url": "/path/test.js", "headers": { "host": "www.example.com" } };

		var spyCacheStat = jasmine.createSpy();
		page_server.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".js");

		spyOn(asset_bundler, "isBundlePath").andReturn(false);

		spyOn(page_server, "handlePageRequest");

		page_server.handle(dummy_request, {}, function(){ });

		expect(page_server.handlePageRequest).toHaveBeenCalledWith(dummy_request, {}, "/path/test", ".js", jasmine.any(Object));
	});

});

describe("handle page request", function() {

	it("check when the cache was last updated for the given path", function(){
		var dummy_request = { "url": "/path/test.js" };

		var spyCacheStat = jasmine.createSpy();
		page_server.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handlePageRequest(dummy_request, {}, "/path/test", ".html", {});
		expect(spyCacheStat).toHaveBeenCalledWith("/path/test", ".html", {}, jasmine.any(Function));
	});

	it("pass options when calling page render", function() {
		var spyOptions = jasmine.createSpy();
		var dummy_request = { "url": "/path/test?foo=bar", "headers": { "host": "sub.example.com" } };

		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(path, extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 21) });
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");
		spyOn(page_renderer, "render");

		page_server.handlePageRequest(dummy_request, {}, "/path/test", ".html", spyOptions);

		expect(page_renderer.render).toHaveBeenCalledWith("/path/test", ".html", new Date(2012, 6, 21), spyOptions, jasmine.any(Function));
	});

	it("prepare rendered response if the rendered object is modified", function() {
		var dummy_request = { "url": "/path/test" };
		var dummy_rendered_obj = { "modified": true };

		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(path, extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 21) });
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(basename, extension, last_modified, options, callback) {
			return callback(dummy_rendered_obj);
		});

		spyOn(page_server, "prepareRenderedResponse");

		page_server.handlePageRequest(dummy_request, {}, "/path/test", ".html", {});
		expect(page_server.prepareRenderedResponse).toHaveBeenCalledWith({}, "/path/test", ".html", dummy_rendered_obj, {});
	});

	it("validate the public cache if the rendered object is not modified", function() {
		var dummy_request = { "url": "/path/test" };
		var dummy_rendered_obj = { "modified": false };
		var dummy_stat = { "mtime": new Date(2012, 6, 21), "size": 527 };

		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(path, extension, options, callback) {
			return callback(null, dummy_stat);
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(basename, extension, last_modified, options, callback) {
			return callback(dummy_rendered_obj);
		});

		spyOn(page_server, "validatePublicCache");

		page_server.handlePageRequest(dummy_request, {}, "/path/test", ".html", {});
		expect(page_server.validatePublicCache).toHaveBeenCalledWith(dummy_request, {}, dummy_stat, jasmine.any(Function));
	});

	it("prepare cached response if public cache is invalid", function() {
		var dummy_request = { "url": "/path/test" };
		var dummy_rendered_obj = { "modified": false };

		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(path, extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 21) });
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(basename, extension, last_modified, options, callback) {
			return callback(dummy_rendered_obj);
		});

		spyOn(page_server, "validatePublicCache").andCallFake(function(request, response, stat, callback) {
			return callback();
		});

		spyOn(page_server, "prepareCachedResponse");

		var spyOptions = jasmine.createSpy();
		page_server.handlePageRequest(dummy_request, {}, "/path/test", ".html", spyOptions);
		expect(page_server.prepareCachedResponse).toHaveBeenCalledWith({}, "/path/test", ".html", dummy_rendered_obj, spyOptions);
	});

});

describe("handle bundle request", function() {

	it("get bundle for the given request basename and file extension", function() {
		var dummy_request = {};
		var dummy_response = {};

		spyOn(asset_bundler, "getBundle");

		var spyOptions = jasmine.createSpy();
		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", spyOptions);

		expect(asset_bundler.getBundle).toHaveBeenCalledWith("/path/all", ".js", spyOptions, jasmine.any(Function));
	});

	it("show a status page if a bundle returns an error", function() {
		var dummy_request = {};
		var dummy_response = {};

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, extension, options, callback) {
			return callback("error", null);
		});

		spyOn(page_server, "getStatusPage");

		var spyOptions = jasmine.createSpy();
		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", spyOptions);

		expect(page_server.getStatusPage).toHaveBeenCalledWith(dummy_response, 404, ".html", {}, spyOptions);
	});

	it("set cache headers", function() {
		var dummy_request = {};
		var dummy_response = {};

		var spyHeader = jasmine.createSpy();
		var spyCache = jasmine.createSpy();

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, extension, options, callback) {
			return callback(null, {"body": "bundled content", "modified": true, "options": {"header": spyHeader, "cache": spyCache }});
		});

		spyOn(page_server, "setCacheExpiryHeaders");
		spyOn(page_server, "sendResponse");

		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", {});

		expect(page_server.setCacheExpiryHeaders).toHaveBeenCalledWith(spyHeader, spyCache);
	});

	it("send response if the bundled object is modified", function() {
		var dummy_request = {};
		var dummy_response = {};

		var spyHeader = jasmine.createSpy();
		var spyCache = jasmine.createSpy();

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, extension, options, callback) {
			return callback(null, {"body": "bundled content", "modified": true, "options": {"header": spyHeader, "cache": spyCache }});
		});

		spyOn(page_server, "setCacheExpiryHeaders");

		spyOn(page_server, "sendResponse");

		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", {});

		expect(page_server.sendResponse).toHaveBeenCalledWith(dummy_response, 200, spyHeader, "bundled content");
	});

	it("validate public cache if the bundled object is not modified", function() {
		var dummy_request = {};
		var dummy_response = { "setHeader": function(key, value) { dummy_response["header"][key] = value }, "header": {} };

		var dummy_header = { "etag": "etag", "last-modified": "utc-date-string" };
		var spyCache = jasmine.createSpy();

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, extension, options, callback) {
			return callback(null, {"body": "bundled cached content", "modified": false, "options": {"header": dummy_header, "cache": spyCache }});
		});

		spyOn(page_server, "setCacheExpiryHeaders");
		spyOn(page_server, "validatePublicCache");

		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", {});

		expect(page_server.validatePublicCache).toHaveBeenCalledWith(dummy_request, dummy_response, null, jasmine.any(Function));
	});

	it("send response if public cache is not valid", function() {
		var dummy_request = {};
		var dummy_response = { "setHeader": function(key, value) { dummy_response["header"][key] = value }, "header": {} };

		var dummy_header = { "etag": "etag", "last-modified": "utc-date-string" };
		var spyCache = jasmine.createSpy();

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, extension, options, callback) {
			return callback(null, {"body": "bundled cached content", "modified": false, "options": {"header": dummy_header, "cache": spyCache }});
		});

		spyOn(page_server, "setCacheExpiryHeaders");
		spyOn(page_server, "sendResponse");

		spyOn(page_server, "validatePublicCache").andCallFake(function(req, res, stat, callback) {
			return callback();
		});

		page_server.handleBundleRequest(dummy_request, dummy_response, "/path/all", ".js", {});

		expect(page_server.sendResponse).toHaveBeenCalledWith(dummy_response, 200, dummy_header, "bundled cached content");
	});

});

describe("prepare rendered response", function(){

	it("cache the successful response", function() {
		var spyCacheUpdate = jasmine.createSpy();
		page_server.cacheStore = { "update": spyCacheUpdate };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "/path/test", ".html", { "body": "test", "modified": true }, spyOptions);

		expect(spyCacheUpdate).toHaveBeenCalledWith("/path/test", ".html", { "body": "test", "options": { "header": jasmine.any(Object) } }, spyOptions, jasmine.any(Function));
	});

	it("send response after caching", function() {
		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(request_path, file_extension, rendered_obj, request_options, callback){
			return callback(null, {"body": rendered_obj.body, "options": { "header": rendered_obj.options.header } });
		});
		page_server.cacheStore = { "update": spyCacheUpdate };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "/path/test", ".html", { "body": "test", "modified": true, "options": { "header": {} } }, spyOptions);

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Type": "text/html; charset=utf-8", "Expires": jasmine.any(String), "Cache-Control": jasmine.any(String) }, "test");
	});

	it("serve a error 500 if there's an error in caching", function() {
		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(request_path, file_extension, rendered_obj, request_options, callback){
			return callback("error");
		});
		page_server.cacheStore = { "update": spyCacheUpdate };

		spyOn(page_server, "sendResponse");

		spyOn(page_server, "getStatusPage");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "/path/test", ".html", { "body": "test", "modified": true }, spyOptions);

		expect(page_server.getStatusPage).toHaveBeenCalledWith(spyResponse, 500, ".html", { "Content-Type": "text/html; charset=utf-8", "Expires": jasmine.any(String), "Cache-Control": jasmine.any(String) }, spyOptions);
	});

	it("serve a status page if it is not a successful response", function(){
		spyOn(page_server, "getStatusPage");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "/path/test", ".html", { "body": "test", "modified": true, "options": { "status": 404 } }, spyOptions);

		expect(page_server.getStatusPage).toHaveBeenCalledWith(spyResponse, 404, ".html", { "Content-Type": "text/html; charset=utf-8", "Expires": jasmine.any(String), "Cache-Control": jasmine.any(String) }, spyOptions);
	});

});

describe("prepare cached response", function() {

	it("serve the response from cache", function() {
		var cache_body = "cache body";

		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(request_path, file_extension, rendered_obj, request_options, callback){
			var header = rendered_obj.options.header;
			header["Content-Length"] = cache_body.length;
			header["ETag"] = "00-00001";
			header["Last-Modified"] = "Thu, 09 Aug 2012 09:12:41 GMT";

			return callback(null, { "body": cache_body, "options": { "header": header } });
		});
		page_server.cacheStore = { "get": spyCacheGet };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.prepareCachedResponse(spyResponse, "/path/test", ".html", { "body": null, "modified": false, "options": { "header": {} } }, spyOptions);

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Length": cache_body.length, "Content-Type": "text/html; charset=utf-8",
																																							"Expires": jasmine.any(String), "Cache-Control": jasmine.any(String),
																																							"ETag": "00-00001", "Last-Modified": "Thu, 09 Aug 2012 09:12:41 GMT"
																																						}, cache_body);
	});

});

describe("validate public cache", function() {

	it("call the callback if the request is not a conditional get", function(){
		var dummy_request = { "url": "/path/test" };
		var dummy_response = { };

		spyOn(connect_utils, "conditionalGET").andReturn(false);

		var spyStat = jasmine.createSpy();
		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, spyStat, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("call the callback if requested file is modified", function(){
		var dummy_request = { "url": "/path/test", "headers": { "if-none-match": "\"0-11\"" } };
		var dummy_response = { };
		var dummy_stat = { "mtime": 0, "size": 0 };

		spyOn(connect_utils, "conditionalGET").andReturn(true);

		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, dummy_stat, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("send not modified response if requested file is not modified", function(){
		var dummy_request = { "url": "/path/test", "headers": { "if-none-match": "\"0-0\"" } };
		var dummy_response = { };
		var dummy_stat = { "mtime": 0, "size": 0 };

		spyOn(connect_utils, "conditionalGET").andReturn(true);
		spyOn(connect_utils, "notModified");

		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, dummy_stat, spyCallback);

		expect(connect_utils.notModified).toHaveBeenCalledWith(dummy_response);
	});

	it("use the header fields in response if no stat object given", function(){
		var dummy_request = { "url": "/path/test", "headers": { "if-none-match": "\"0-11\"" } };
		var dummy_response = { "header": { "etag": "0-10", "last-modified": "utc-string" }, "getHeader": function(key) { return this["header"][key] }};
		var dummy_stat = null;

		spyOn(connect_utils, "conditionalGET").andReturn(true);

		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, dummy_stat, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("send response", function() {

	it("set the status code", function() {
		var spySetHeader = jasmine.createSpy();
		var spyEnd = jasmine.createSpy();
		var spyResponse = { "setHeader": spySetHeader, "end": spyEnd };

		page_server.sendResponse(spyResponse, 200, { "Content-Type": "text/html", "Content-Length": 100 }, "content");
		expect(spyResponse.statusCode).toEqual(200);
	});

	it("set headers", function() {
		var spySetHeader = jasmine.createSpy();
		var spyEnd = jasmine.createSpy();
		var spyResponse = { "setHeader": spySetHeader, "end": spyEnd };

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html", "Content-Length": 100}, "content");
		expect(spySetHeader.callCount).toEqual(2);
	});

	it("write body and end the message", function() {
		var spySetHeader = jasmine.createSpy();
		var spyEnd = jasmine.createSpy();
		var spyResponse = { "setHeader": spySetHeader, "end": spyEnd };

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html", "Content-Length": 100}, "content");
		expect(spyEnd).toHaveBeenCalled();
	});

});

describe("get status page", function(){

	it("check for the given status page in cache", function(){
		var spyCacheGet = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet};

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {}, spyOptions);

		expect(spyCacheGet).toHaveBeenCalledWith("/404", ".html", { "body": null, "options": { "header": { "Content-Type": "text/html; charset=utf-8" } } }, spyOptions, jasmine.any(Function));
	});

	it("render a page if no page was found in cache", function(){

		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, rendered_obj, options, callback){
			return callback("error", null);
		});

		page_server.cacheStore = {"get": spyCacheGet};

		spyOn(page_renderer, "render");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {}, spyOptions);

		expect(page_renderer.render).toHaveBeenCalledWith("/404", ".html", null, spyOptions, jasmine.any(Function));
	});

	it("update the cache with the rendered result", function(){

		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, options, callback){
			return callback("error", null);
		});

		var spyCacheUpdate = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({ "body": "rendered page", "modified": true, "options": {} });
		});

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {}, spyOptions);

		expect(spyCacheUpdate).toHaveBeenCalledWith("/404", ".html", { "body": "rendered page", "options": { "header": jasmine.any(Object) } }, spyOptions, jasmine.any(Function));
	});

	it("send the rendered result as the response", function(){
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, rendered_obj, options, callback){
			return callback("error", null);
		});

		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(path, extension, rendered_obj, options, callback){
			return callback(null);
		});

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({"body": "rendered page", "modified": true, "options": {} });
		});

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {}, spyOptions);

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, { "Content-Length": 13, "Content-Type": "text/html; charset=utf-8" }, "rendered page");
	});

	it("send a blank response (without caching) if no result was rendered", function(){
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, rendered_obj, options, callback){
			return callback("error", null);
		});

		page_server.cacheStore = {"get": spyCacheGet};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({"body": null, "modified": true, "options": {} });
		});

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, { "Content-Length": 0, "Content-Type": "text/html; charset=utf-8" }, "");
	});

});
