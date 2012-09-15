var markdown_parser = require("../../lib/parsers/markdown.js");
var marked = require("marked");

describe("setup", function() {

	it("extend the marked options with the options provided in the config", function(){
		var custom_options = { "gfm": true,  "pedantic": true, "sanitize": true }
		var config = { "parser": { "markdown": custom_options } };

		markdown_parser.setup(config);

		expect(markdown_parser.markedOptions).toEqual(custom_options);
	});

	it("keep the default marked options when no options are provided in the config", function(){
		var default_options = { "gfm": true,  "pedantic": false, "sanitize": false }

		markdown_parser.setup({});

		expect(markdown_parser.markedOptions).toEqual(default_options);
	});
});

describe("parsing given content", function() {

  it("invoke the callback with the result", function() {
		spyOn(marked, "setOptions");

		spyOn(marked, "parse").andCallFake(function(input){
			return "parsed file";
		});

		var spyCallback = jasmine.createSpy();
		markdown_parser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "parsed file");

  });

  it("invoke the callback with the error on an error", function() {
		spyOn(marked, "setOptions");

		spyOn(marked, "parse").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		markdown_parser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);

  });

});

