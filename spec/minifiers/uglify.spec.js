var uglifyJS = require("uglify-js");
var uglify_minifier = require("../../lib/minifiers/uglify");

describe("calling minify", function() {

	it("call the callback with the result", function(){

		spyOn(uglifyJS, "minify").andCallFake(function(input){
			return { code: "{ function(){} };", map: null };
		});

		var spyCallback = jasmine.createSpy();
		uglify_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "{ function(){} };");
	});

	it("call the callback with the error", function(){
		spyOn(uglifyJS, "minify").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		uglify_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
