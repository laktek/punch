var page_server = require("../lib/page_server.js");
var page_renderer = require("../lib/page_renderer.js");
var module_utils = require("../lib/utils/module_utils.js");

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

describe("get the extension", function(){

	it("get directly from the path", function(){
		expect(page_server.getExtension("path/test.html", {})).toEqual(".html");
	});

	it("get from the accept type", function(){
		expect(page_server.getExtension("path/test", [{"mediarange": "text/html"}, {"mediarange": "application/xhtml+xml"}, {"mediarange": "*/*"}])).toEqual(".html");
	});

	it("set html if it accept any type", function(){
		expect(page_server.getExtension("path/test", [{"mediarange": "*/*"}])).toEqual(".html");
	});

	it("set html if no accept type given", function(){
		expect(page_server.getExtension("path/test", [])).toEqual(".html");
	});

});

describe("handle request", function(){

	it("check when the cache was last updated for the given path", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(page_server, "getExtension").andReturn(".html");

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

		spyOn(page_server, "getExtension").andReturn(".html");

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
	
		spyOn(page_server, "getStatusPage").andCallFake(function(status_code, file_extension, header, callback){
			if(status_code === 404 && file_extension === ".html"){
				return callback(null, {"options": {"header": { "Content-Type": "text/html" } }, "body": "page not found"});	
			}
		});

		spyOn(page_server, "sendResponse");

		var spyResponse = jasmine.createSpy();
		page_server.prepareResponse(spyResponse, "path/test", {"body": "test", "modified": true, "options": {"header": {"status": 404}} }, ".html");

		expect(page_server.sendResponse).toHaveBeenCalledWith(spyResponse, 404, { "Content-Type": "text/html" }, "page not found");

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
		
		var spyCallback = jasmine.createSpy();
		page_server.getStatusPage(404, ".html", {}, spyCallback);

		expect(spyCacheGet.mostRecentCall.args.splice(0, 3)).toEqual([404, ".html", {}]);
	
	});

	it("render a page if no page was found in cache", function(){
	
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		page_server.cacheStore = {"get": spyCacheGet};

		spyOn(page_renderer, "serveStatic");

		var spyCallback = jasmine.createSpy();
		page_server.getStatusPage(404, ".html", {}, spyCallback);

		expect(page_renderer.serveStatic.mostRecentCall.args.splice(0, 2)).toEqual(["404.html", null]);
	
	});

	it("update the cache with the rendered result", function(){
		
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		var spyCacheUpdate = jasmine.createSpy();

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "serveStatic").andCallFake(function(file_path, last_modified, callback){
			return callback(null, {"body": "rendered page", "modified": true});	
		});

		var spyCallback = jasmine.createSpy();
		page_server.getStatusPage(404, ".html", {}, spyCallback);

		expect(spyCacheUpdate.mostRecentCall.args.splice(0, 3)).toEqual([404, ".html", "rendered page"]);
	
	});

	it("calls the callback with rendered result", function(){
	
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(path, extension, body, callback){
			return callback(null);	
		});

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "serveStatic").andCallFake(function(file_path, last_modified, callback){
			return callback(null, {"body": "rendered page", "modified": true});	
		});

		var spyCallback = jasmine.createSpy();
		page_server.getStatusPage(404, ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"body": "rendered page", "options": {"header": {"Content-Length": 13 }}});
	
	});

	it("calls the callback with an empty body if there's no rendered result", function(){
		
		var spyCacheGet = jasmine.createSpy();
		spyCacheGet.andCallFake(function(path, extension, header, callback){
			return callback("error", null);	
		});

		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(path, extension, body, callback){
			return callback(null);	
		});

		page_server.cacheStore = {"get": spyCacheGet, "update": spyCacheUpdate};

		spyOn(page_renderer, "serveStatic").andCallFake(function(file_path, last_modified, callback){
			return callback("error", null);	
		});

		var spyCallback = jasmine.createSpy();
		page_server.getStatusPage(404, ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"body": null, "options": {"header": {} }});

	});

});


