var page_server = require("../lib/page_server.js");
var page_renderer = require("../lib/page_renderer.js");

describe("setup", function(){
	it("setup the renderer", function(){
		spyOn(page_renderer, "setup");	

		page_server.setup({});
		expect(page_renderer.setup).toHaveBeenCalledWith({});
	});

	it("returns the handler", function(){
		var spyHandle = jasmine.createSpy();
		page_server.handle = spyHandle;
		
		expect(page_server.setup({})).toEqual(spyHandle);
	});
});
