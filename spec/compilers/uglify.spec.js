var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var uglify_compiler = require("../../lib/compilers/uglify");

describe("calling compile", function() {

	it("calls the callback with the result", function(){
		spyOn(jsp, "parse").andCallFake(function(input){
			return "initial ast";	
		});

		spyOn(pro, "ast_mangle").andCallFake(function(input){
			return "initial ast";	
		});

		spyOn(pro, "ast_squeeze").andCallFake(function(input){
			return "initial ast";	
		});

		spyOn(pro, "gen_code").andCallFake(function(input){
			return "compiled output";	
		});

		var spyCallback = jasmine.createSpy();
		uglify_compiler.compile("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "compiled output");
	});

	it("calls the callback with the error", function(){
		spyOn(jsp, "parse").andCallFake(function(input){
			throw "error"
		});

		var spyCallback = jasmine.createSpy();
		uglify_compiler.compile("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
