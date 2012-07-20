var less = require("less");
var less_compiler = require("../../lib/compilers/less");

describe("calling compile", function() {

	it("calls the callback with the result", function(){
		spyOn(less, "render").andCallFake(function(input, callback){
			return callback(null, "rendered file");	
		});

		var spyCallback = jasmine.createSpy();
		less_compiler.compile("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "rendered file");
	});

});
