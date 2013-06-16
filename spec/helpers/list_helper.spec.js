var ListHelperObj = require("../../lib/helpers/list_helper");
var ListHelper = ListHelperObj.directAccess()["block_helpers"];

describe("format list", function(){

	it("return empty strings for null values", function(){
		expect(ListHelper.format_list(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(ListHelper.format_list("hello")).toEqual("hello");
	});

	it("return a formatted string for an array literal", function(){
		expect(ListHelper.format_list([ "Peter", "John", "Andrew" ])).toEqual("Peter, John, &amp; Andrew");
	});

	it("return a formatted string for an array literal as a string", function(){
		expect(ListHelper.format_list("Peter,John,Andrew")).toEqual("Peter, John, &amp; Andrew");
	});

});

describe("first item of the list", function(){

	it("return empty strings for null values", function(){
		expect(ListHelper.first(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(ListHelper.first("hello")).toEqual("hello");
	});

	it("return the first item for an array literal", function(){
		expect(ListHelper.first(["Peter", "John", "Andrew"])).toEqual("Peter");
	});

	it("return the first item for an array literal as a string", function(){
		expect(ListHelper.first("Peter,John,Andrew")).toEqual("Peter");
	});

});

describe("last item of the list", function(){

	it("return empty strings for null values", function(){
		expect(ListHelper.last(null)).toEqual("");
	});

	it("return the given string if it's not an array literal", function(){
		expect(ListHelper.last("hello")).toEqual("hello");
	});

	it("return the last item for an array literal", function(){
		expect(ListHelper.last(["Peter", "John", "Andrew"])).toEqual("Andrew");
	});

	it("return the last item for an array literal as a string", function(){
		expect(ListHelper.last("Peter,John,Andrew")).toEqual("Andrew");
	});

});
