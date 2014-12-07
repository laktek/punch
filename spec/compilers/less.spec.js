var Less = require("less");
var LessCompiler = require("../../lib/compilers/less");

describe("calling compile", function() {

	it("pass the filename and path to Less compiler", function() {
		spyOn(Less, "render");

		var spyCallback = jasmine.createSpy();
		LessCompiler.compile("test", "sample/css/main.less", spyCallback);

		expect(Less.render).toHaveBeenCalledWith("test", { "filename": "sample/css/main.less", "paths": [ "sample/css" ] }, jasmine.any(Function));
	});

	it("calls the callback with the result", function() {
		spyOn(Less, "render").andCallFake(function(input, options, callback) {
			return callback(null, "rendered file");
		});

		var spyCallback = jasmine.createSpy();
		LessCompiler.compile("test", "sample.less", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "rendered file");
	});

  it("calls the callback with the result when Less compiler returns an object (version > 2)", function() {
		spyOn(Less, "render").andCallFake(function(input, options, callback) {
			return callback(null, { css: "rendered file"});
		});

		var spyCallback = jasmine.createSpy();
		LessCompiler.compile("test", "sample.less", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "rendered file");
	});

  it("calls the callback with the error message when an error occurrs", function() {
		spyOn(Less, "render").andCallFake(function(input, options, callback){
			return callback({ message: "Some error occurred."}, null);
		});

		var spyCallback = jasmine.createSpy();
		LessCompiler.compile("test", "sample.less", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("Less parsing error: Some error occurred.", null);
	});

});
