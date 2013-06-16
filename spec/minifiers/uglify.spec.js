var UglifyJs = require("uglify-js");
var UglifyMinifier = require("../../lib/minifiers/uglify");

describe("calling minify", function() {

	it("call the callback with the result", function(){

		spyOn(UglifyJs, "minify").andCallFake(function(input){
			return { code: "{ function(){} };", map: null };
		});

		var spyCallback = jasmine.createSpy();
		UglifyMinifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "{ function(){} };");
	});

	it("call the callback with the error", function(){
		spyOn(UglifyJs, "minify").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		UglifyMinifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
