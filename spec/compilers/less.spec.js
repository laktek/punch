var less = require("less");
var less_compiler = require("../../lib/compilers/less");

describe("calling compile", function() {

	it("pass the filename and path to less compiler", function() {
		spyOn(less, "render");

		var spyCallback = jasmine.createSpy();
		less_compiler.compile("test", "sample/css/main.less", spyCallback);

		expect(less.render).toHaveBeenCalledWith("test", { "filename": "sample/css/main.less", "paths": [ "sample/css" ] }, jasmine.any(Function));
	});

	it("calls the callback with the result", function(){
		spyOn(less, "render").andCallFake(function(input, options, callback){
			return callback(null, "rendered file");	
		});

		var spyCallback = jasmine.createSpy();
		less_compiler.compile("test", "sample.less", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "rendered file");
	});

});
