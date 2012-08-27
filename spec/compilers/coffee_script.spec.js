var coffee_script = require("coffee-script");
var coffee_script_compiler = require("../../lib/compilers/coffee_script");

describe("calling compile", function() {

	it("calls the callback with the result", function(){
		spyOn(coffee_script, "compile").andCallFake(function(input, options){
			return "rendered file";
		});

		var spyCallback = jasmine.createSpy();
		coffee_script_compiler.compile("test", "test.coffee", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "rendered file");
	});

	it("calls the callback with the error", function(){
		spyOn(coffee_script, "compile").andCallFake(function(input, callback){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		coffee_script_compiler.compile("test", "test.coffee", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
