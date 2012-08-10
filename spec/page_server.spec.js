var page_server = require("../lib/page_server.js");

var page_renderer = require("../lib/page_renderer.js");
var module_utils = require("../lib/utils/module_utils.js");
var path_utils = require("../lib/utils/path_utils.js");
var connect_utils = require("connect").utils;

describe("setup the page server", function(){

	it("setup the renderer", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return 	{}
		});

		spyOn(page_renderer, "setup");	

		page_server.setup(sample_config);
		expect(page_renderer.setup).toHaveBeenCalledWith(sample_config);
	});

	it("setup the cache store", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return 	{}
		});

		spyOn(page_renderer, "setup");	
			
		page_server.setup(sample_config);
		expect(page_server.cacheStore).toEqual({});
	});

	it("return a handler function", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return 	{}
		});

		spyOn(page_renderer, "setup");	
		expect(page_server.setup(sample_config)).toEqual(jasmine.any(Function));
	});

});

describe("set cache expiry headers", function() {

	it("set only the given directives", function() {
		var header = {};
		var cache_settings = { "public": true, "no_cache": true, "proxy_revalidate": false };

		page_server.setCacheExpiryHeaders(cache_settings, header);

		expect(header["Cache-Control"]).toEqual("public, no-cache, max-age=0");
	});

	it("set the given max age", function() {
		var header = {};
		var cache_settings = { "max_age": 3600 };

		page_server.setCacheExpiryHeaders(cache_settings, header);

		expect(header["Cache-Control"]).toEqual("max-age=3600");
	});

	it("set the expires header", function() {
		var header = {};
		var cache_settings = { "max_age": 86400 };
		var tomorrow = new Date().getTime() + (86400 * 1000);

		page_server.setCacheExpiryHeaders(cache_settings, header);

		expect( Date.parse(header["Expires"]) - tomorrow ).toBeLessThan(1000);
	});

});

describe("handle request", function(){

	it("strip the trailing slashes from the request url", function(){
		var dummy_request = { "url": "path/test/" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("strip malicious paths from the request url", function(){
		var dummy_request = { "url": "path/../../test/" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("get the file extension for the given request", function(){
		var dummy_request = { "url": "path/test", "accept": { "types": {} } };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(path_utils.getExtension).toHaveBeenCalledWith("path/test", {});
	});

	it("extract the basename from the request path", function(){
		var dummy_request = { "url": "path/test.js" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"stat": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".js");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("check when the cache was last updated for the given path", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheStat = jasmine.createSpy();	
		page_server.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheStat).toHaveBeenCalledWith("path/test", ".html", jasmine.any(Function));
	});

	it("call page render", function() {
		var dummy_request = { "url": "path/test" };

		var spyCacheStat = jasmine.createSpy();	
		spyCacheStat.andCallFake(function(path, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 21) });	
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render");
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_renderer.render.mostRecentCall.args.splice(0, 4)).toEqual(["path/test", ".html", new Date(2012, 6, 21), {"query": {} }]);
	});

	it("prepare rendered response if the rendered object is modified", function() {
		var dummy_request = { "url": "path/test" };
		var dummy_rendered_obj = { "modified": true };

		var spyCacheStat = jasmine.createSpy();	
		spyCacheStat.andCallFake(function(path, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 21) });	
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(basename, extension, last_modified, options, callback) {
			return callback(dummy_rendered_obj);	
		});

		spyOn(page_server, "prepareRenderedResponse");
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_server.prepareRenderedResponse).toHaveBeenCalledWith({}, "path/test", ".html", dummy_rendered_obj);	
	});

	it("validate the public cache if the rendered object is not modified", function() {
		var dummy_request = { "url": "path/test" };
		var dummy_rendered_obj = { "modified": false };
		var dummy_stat = { "mtime": new Date(2012, 6, 21), "size": 527 };

		var spyCacheStat = jasmine.createSpy();	
		spyCacheStat.andCallFake(function(path, extension, callback) {
			return callback(null, dummy_stat);	
		});
		page_server.cacheStore = {"stat": spyCacheStat};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(basename, extension, last_modified, options, callback) {
			return callback(dummy_rendered_obj);	
		});

		spyOn(page_server, "validatePublicCache");
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_server.validatePublicCache).toHaveBeenCalledWith(dummy_request, {}, dummy_stat, jasmine.any(Function));	
	});

	it("prepare cached response if public cache is invalid", function() {
		var dummy_request = { "url": "path/test" };
		var dummy_rendered_obj = { "modified": false };

		var spyCacheStat = jasmine.createSpy();	
		spyCacheStat.andCallFake(function(path, extension, callback) {
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
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_server.prepareCachedResponse).toHaveBeenCalledWith({}, "path/test", ".html", dummy_rendered_obj);	
	});

});

describe("prepare rendered response", function(){

	it("cache the successful response", function(){
		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(request_path, file_extension, body, header, callback){
			return callback(null, {"body": body, "options": { "header": header } });
		});
		page_server.cacheStore = { "update": spyCacheUpdate };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "path/test", ".css", { "body": "test", "modified": true });

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Type": 'text/css', "Expires": jasmine.any(String), "Cache-Control": jasmine.any(String) }, "test");
	});

	it("serve a status page if it is not a successful response", function(){
		spyOn(page_server, "getStatusPage");

		var spyResponse = jasmine.createSpy();
		page_server.prepareRenderedResponse(spyResponse, "path/test", ".html", { "body": "test", "modified": true, "options": { "status": 404 } });

		expect(page_server.getStatusPage).toHaveBeenCalledWith(spyResponse, 404, ".html", { "Content-Type": 'text/html', "Expires": jasmine.any(String), "Cache-Control": jasmine.any(String) });
	});

});

describe("prepare cached response", function() {

	it("serve the response from cache", function() {
		var cache_body = "cache body";

		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(request_path, file_extension, header, callback){
			header["Content-Length"] = cache_body.length;
			header["ETag"] = "00-00001";
			header["Last-Modified"] = "Thu, 09 Aug 2012 09:12:41 GMT";

			return callback(null, { "body": cache_body, "options": { "header": header } });	
		});
		page_server.cacheStore = { "get": spyCacheGet };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.prepareCachedResponse(spyResponse, "path/test", ".html", { "body": null, "modified": false });

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Length": cache_body.length, "Content-Type": 'text/html',
		 																																					"Expires": jasmine.any(String), "Cache-Control": jasmine.any(String), 
		 																																					"ETag": "00-00001", "Last-Modified": "Thu, 09 Aug 2012 09:12:41 GMT" 
																																						}, cache_body);
	});

});

describe("validate public cache", function() {

	it("call the callback if the request is not a conditional get", function(){
		var dummy_request = { "url": "path/test/" };
		var dummy_response = { };

		spyOn(connect_utils, "conditionalGET").andReturn(false);

		var spyStat = jasmine.createSpy();
		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, spyStat, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("call the callback if requested file is modified", function(){
		var dummy_request = { "url": "path/test/" };
		var dummy_response = { };

		spyOn(connect_utils, "conditionalGET").andReturn(false);
		spyOn(connect_utils, "modified").andReturn(true);

		var spyStat = jasmine.createSpy();
		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, spyStat, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("send not modified response if requested file is not modified", function(){
		var dummy_request = { "url": "path/test/" };
		var dummy_response = { };

		spyOn(connect_utils, "conditionalGET").andReturn(false);
		spyOn(connect_utils, "modified").andReturn(true);
		spyOn(connect_utils, "notModified");

		var spyStat = jasmine.createSpy();
		var spyCallback = jasmine.createSpy();
		page_server.validatePublicCache(dummy_request, dummy_response, spyStat, spyCallback);

		expect(connect_utils.notModified).toHaveBeenCalledWith(dummy_response);
	});

});

describe("send response", function() {

	it("set the status code", function() {
		spySetHeader = jasmine.createSpy();
		spyEnd = jasmine.createSpy();
		var spyResponse = {"setHeader": spySetHeader, "end": spyEnd} 

		page_server.sendResponse(spyResponse, 200, { "Content-Type": "text/html", "Content-Length": 100 }, "content");	
		expect(spyResponse.statusCode).toEqual(200);
	});

	it("set headers", function() {
		spySetHeader = jasmine.createSpy();
		spyEnd = jasmine.createSpy();
		var spyResponse = {"setHeader": spySetHeader, "end": spyEnd} 

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html", "Content-Length": 100}, "content");	
		expect(spySetHeader.callCount).toEqual(2);
	});

	it("write body and end the message", function() {
		spySetHeader = jasmine.createSpy();
		spyEnd = jasmine.createSpy();
		var spyResponse = {"setHeader": spySetHeader, "end": spyEnd} 

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html", "Content-Length": 100}, "content");	
		expect(spyEnd).toHaveBeenCalled();
	});

});

describe('get status page', function(){

	it("check for the given status page in cache", function(){
		var spyCacheGet = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet};
		
		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(spyCacheGet.mostRecentCall.args.slice(0, 3)).toEqual([ "404", ".html", { "Content-Type": 'text/html' } ]);
	});

	it("render a page if no page was found in cache", function(){
	
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		page_server.cacheStore = {"get": spyCacheGet};

		spyOn(page_renderer, "render");

		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(page_renderer.render.mostRecentCall.args.slice(0, 3)).toEqual(["404", ".html", null]);
	
	});

	it("update the cache with the rendered result", function(){
		
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		var spyCacheUpdate = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({"body": "rendered page", "modified": true, "options": {}});	
		});

		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(spyCacheUpdate.mostRecentCall.args.slice(0, 3)).toEqual(["404", ".html", "rendered page"]);
	
	});

	it("send the rendered result as the response", function(){
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(path, extension, body, callback){
			return callback(null);	
		});

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({"body": "rendered page", "modified": true, "options": {} });	
		});

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, { "Content-Length": 13, "Content-Type": "text/html" }, "rendered page");
	});

	it("send a blank response (without caching) if no result was rendered", function(){
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		page_server.cacheStore = {"get": spyCacheGet};

		spyOn(page_renderer, "render").andCallFake(function(file_path, extension, last_modified, options, callback){
			return callback({"body": null, "modified": true, "options": {} });	
		});

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, { "Content-Length": 0, "Content-Type": "text/html" }, null);
	});

});
