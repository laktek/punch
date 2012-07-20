var page_server = require("../lib/page_server.js");
var page_renderer = require("../lib/page_renderer.js");

describe("setup", function(){
	it("setup the renderer", function(){
		spyOn(page_renderer, "setup");	

		page_server.setup({});
		expect(page_renderer.setup).toHaveBeenCalledWith({});
	});

	it("returns the handler function", function(){
		expect(typeof page_server.setup({})).toEqual("function");
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

	it("get when the cache was last updated for the given path", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(page_server, "getExtension").andReturn(".html");

		page_server.handle(dummy_request, {}, function(){ });
		expect(spyCacheLastUpdated.mostRecentCall.args[0]).toEqual("path/test");

	});

	it("calls page render", function(){
		var dummy_request = { "url": "path/test" };

		var spyCacheLastUpdated = jasmine.createSpy();	
		spyCacheLastUpdated.andCallFake(function(path, callback){
			return callback(null, new Date(2012, 6, 21));	
		});
		page_server.cacheStore = {"lastUpdated": spyCacheLastUpdated};

		spyOn(page_server, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render");
	
		page_server.handle(dummy_request, {}, function(){});
		expect(page_renderer.render.mostRecentCall.args.splice(0, 4)).toEqual(["path/test", ".html", new Date(2012, 6, 21), {"query": {} }]);
	});

});


