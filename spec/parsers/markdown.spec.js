var MarkedParser = require("../../lib/parsers/markdown.js");
var Marked = require("marked");

describe("setup", function() {

	it("extend the Marked options with the options provided in the config", function(){
		var custom_options = { "gfm": true,  "pedantic": true, "sanitize": true }
		var config = { "parser": { "markdown": custom_options } };

		MarkedParser.setup(config);

		expect(MarkedParser.markedOptions).toEqual(custom_options);
	});

	it("keep the default Marked options when no options are provided in the config", function(){
		var default_options = { "gfm": true,  "pedantic": false, "sanitize": false }

		MarkedParser.setup({});

		expect(MarkedParser.markedOptions).toEqual(default_options);
	});
});

describe("parsing given content", function() {

  it("invoke the callback with the result", function() {
		spyOn(Marked, "setOptions");

		spyOn(Marked, "parse").andCallFake(function(input){
			return "parsed file";
		});

		var spyCallback = jasmine.createSpy();
		MarkedParser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "parsed file");

  });

  it("invoke the callback with the error on an error", function() {
		spyOn(Marked, "setOptions");

		spyOn(Marked, "parse").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		MarkedParser.parse("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);

  });

});

