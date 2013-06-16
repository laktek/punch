var CoffeeScript = require("coffee-script");
var CoffeeScriptCompiler = require("../../lib/compilers/coffee_script");

describe("calling compile", function() {

	it("calls the callback with the result", function(){
		spyOn(CoffeeScript, "compile").andCallFake(function(input, options){
			return "rendered file";
		});

		var spyCallback = jasmine.createSpy();
		CoffeeScriptCompiler.compile("test", "test.coffee", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "rendered file");
	});

	it("calls the callback with the error", function(){
		spyOn(CoffeeScript, "compile").andCallFake(function(input, callback){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		CoffeeScriptCompiler.compile("test", "test.coffee", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
