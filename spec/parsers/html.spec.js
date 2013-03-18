var html_parser = require("../../lib/parsers/html.js");

describe("setup", function() {

	it("setup succeeds", function(){
		html_parser.setup({});
		html_parser.setup(undefined);
		// anything to work
	});

});

describe("parsing given content", function() {

	it("invoke the callback with a string", function() {
		var spyCallback = jasmine.createSpy();
		html_parser.parse("testing 1 2 3", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "testing 1 2 3");

	});

	it("invoke the callback with empty content", function() {
		var spyCallback = jasmine.createSpy();
		html_parser.parse("", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "");

	});

	it("invoke the callback with missing content causing an error", function() {
		var spyCallback = jasmine.createSpy();
		html_parser.parse(undefined, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({}, undefined);

	});

});

