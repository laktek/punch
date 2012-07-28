var page_server = require("../lib/page_server.js");
var page_renderer = require("../lib/page_renderer.js");
var module_utils = require("../lib/utils/module_utils.js");
var path_utils = require("../lib/utils/path_utils.js");

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
		expect(typeof page_server.setup(sample_config)).toEqual("function");
	});

});

describe("handle request", function(){

	it("strip the trailing slashes from the request url", function(){
		var dummy_request = { "url": "path/test/" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("strip malicious paths from the request url", function(){
		var dummy_request = { "url": "path/../../test/" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("check when the cache was last updated for the given path", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");

	});

	it("call page render", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		spyCacheLastUpdated.andCallFake(function(path, extension, callback){
			return callback(null, new Date(2012, 6, 21));	
		});
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render");
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_renderer.render.mostRecentCall.args.splice(0, 4)).toEqual(["path/test", ".html", new Date(2012, 6, 21), {"query": {} }]);
	});

});

describe("prepare response", function(){

	it("serve from cache if response is not modified", function(){

		var cache_body = "cached body";

		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(request_path, file_extension, header, callback){
			header["Content-Length"] = cache_body.length;
			return callback(null, {"body": cache_body, "options": {"header": header} });	
		});
		page_server.cacheStore = { "get": spyCacheGet };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.prepareResponse(spyResponse, "path/test", {"body": "test", "modified": false}, ".html");

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Length": cache_body.length, "Content-Type": 'text/html' }, cache_body);
	
	});

	it("cache the successful response", function(){

		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(request_path, file_extension, body, callback){
			return callback(null);
		});
		page_server.cacheStore = { "update": spyCacheUpdate };

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.prepareResponse(spyResponse, "path/test", {"body": "test", "modified": true}, ".css");

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 200, { "Content-Length": 4, "Content-Type": 'text/css' }, "test");
	
	});

	it("serve a status page if it is not a successful response", function(){
	
		spyOn(page_server, "getStatusPage");

		var spyResponse = jasmine.createSpy();
		page_server.prepareResponse(spyResponse, "path/test", {"body": "test", "modified": true, "options": {"header": {"status": 404}} }, ".html");

		expect(page_server.getStatusPage).toHaveBeenCalledWith(spyResponse, 404, ".html", { "status": 404, "Content-Length": 4, "Content-Type": 'text/html' });

	});

});

describe("send response", function(){
	it("write head", function(){
		spyWriteHead = jasmine.createSpy();
		spyEnd = jasmine.createSpy();
		var spyResponse = {"writeHead": spyWriteHead, "end": spyEnd} 

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html"}, "content");	
		expect(spyWriteHead).toHaveBeenCalledWith(200, {"Content-Type": "text/html"});
	});

	it("write body and end the message", function(){
		spyWriteHead = jasmine.createSpy();
		spyEnd = jasmine.createSpy();
		var spyResponse = {"writeHead": spyWriteHead, "end": spyEnd} 

		page_server.sendResponse(spyResponse, 200, {"Content-Type": "text/html"}, "content");	
		expect(spyEnd).toHaveBeenCalledWith("content", "binary");
	});
});

describe('get status page', function(){

	it("check for the given status page in cache", function(){

		var spyCacheGet = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet};
		
		var spyResponse = jasmine.createSpy();
		page_server.getStatusPage(spyResponse, 404, ".html", {});

		expect(spyCacheGet.mostRecentCall.args.slice(0, 3)).toEqual(["404", ".html", {}]);
	
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

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, {"Content-Length": 13}, "rendered page");
	
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

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, {"Content-Length": 0}, null);
	
	});

});


