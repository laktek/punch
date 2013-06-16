var CssminMinifier = require("../../lib/minifiers/cssmin");

describe("calling minify", function() {

	it("calls the callback with the result", function(){
		spyOn(global, "Cssmin").andCallFake(function(input){
			return "compiled output";
		});

		var spyCallback = jasmine.createSpy();
		CssminMinifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "compiled output");
	});

	it("calls the callback with the error", function(){
		spyOn(global, "Cssmin").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		CssminMinifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
