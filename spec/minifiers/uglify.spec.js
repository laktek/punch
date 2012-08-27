var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var uglify_minifier = require("../../lib/minifiers/uglify");

describe("calling minify", function() {

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
			return "{ function(){} };";
		});

		var spyCallback = jasmine.createSpy();
		uglify_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(undefined, "{ function(){} };");
	});

	it("calls the callback with the error", function(){
		spyOn(jsp, "parse").andCallFake(function(input){
			throw "error";
		});

		var spyCallback = jasmine.createSpy();
		uglify_minifier.minify("test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", undefined);
	});

});
