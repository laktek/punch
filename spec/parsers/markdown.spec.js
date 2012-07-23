var markdown_parser = require("../../lib/parsers/markdown.js");
var marked = require("marked");

describe("parsing given content", function() {

  it("calls the callback with the result", function() {
		spyOn(marked, "setOptions");

		spyOn(marked, "call").andCallFake(function(input){
			return "parsed file";	
		});

		var spyCallback = jasmine.createSpy();
		markdown_parser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "parsed file");

  });

  it("calls the callback with the result", function() {
		spyOn(marked, "setOptions");

		spyOn(marked, "call").andCallFake(function(input){
			throw "error"
		});

		var spyCallback = jasmine.createSpy();
		markdown_parser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);

  });

});

