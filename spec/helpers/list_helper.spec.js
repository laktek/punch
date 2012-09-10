var list_helper_obj = require("../../lib/helpers/list_helper");
var list_helper = list_helper_obj.directAccess()["block_helpers"];

describe("format list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.format_list(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.format_list("hello")).toEqual("hello");
	});

	it("return a formatted string for an array literal", function(){
		expect(list_helper.format_list([ "Peter", "John", "Andrew" ])).toEqual("Peter, John, &amp; Andrew");
	});

	it("return a formatted string for an array literal as a string", function(){
		expect(list_helper.format_list("Peter,John,Andrew")).toEqual("Peter, John, &amp; Andrew");
	});

});

describe("first item of the list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.first(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.first("hello")).toEqual("hello");
	});

	it("return the first item for an array literal", function(){
		expect(list_helper.first(["Peter", "John", "Andrew"])).toEqual("Peter");
	});

	it("return the first item for an array literal as a string", function(){
		expect(list_helper.first("Peter,John,Andrew")).toEqual("Peter");
	});

});

describe("last item of the list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.last(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.last("hello")).toEqual("hello");
	});

	it("return the last item for an array literal", function(){
		expect(list_helper.last(["Peter", "John", "Andrew"])).toEqual("Andrew");
	});

	it("return the last item for an array literal as a string", function(){
		expect(list_helper.last("Peter,John,Andrew")).toEqual("Andrew");
	});

});
