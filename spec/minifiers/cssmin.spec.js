var cssminPkg = require("cssmin");
var cssmin_minifier = require("../../lib/minifiers/cssmin");

describe("calling minify", function() {

	it("calls the callback with the result", function(){
		spyOn(cssminPkg, "cssmin").andCallFake(function(input){
			return "compiled output";
		});

		var spyCallback = jasmine.createSpy();
		cssmin_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "compiled output");
	});

	it("calls the callback with the error", function(){
		spyOn(cssminPkg, "cssmin").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		cssmin_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
