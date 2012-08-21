var list_helper_obj = require("../../lib/helpers/list_helper");
var list_helper = list_helper_obj.directAccess()["block_helpers"];

var dummy_render = function(text) { return text };

describe("format list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.format_list(null, dummy_render)).toEqual("");	
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.format_list("hello", dummy_render)).toEqual("hello");	
	});

	it("return a formatted string for an array literal", function(){
		expect(list_helper.format_list([ "Peter", "John", "Andrew" ], dummy_render)).toEqual("Peter, John &amp; Andrew");	
	});

	it("return a formatted string for an array literal as a string", function(){
		expect(list_helper.format_list('Peter,John,Andrew', dummy_render)).toEqual("Peter, John &amp; Andrew");	
	});

});

describe("first item of the list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.first(null, dummy_render)).toEqual("");	
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.first("hello", dummy_render)).toEqual("hello");	
	});

	it("return a formatted string for an array literal", function(){
		expect(list_helper.first(["Peter", "John", "Andrew"], dummy_render)).toEqual("Peter");	
	});

	it("return a formatted string for an array literal as a string", function(){
		expect(list_helper.first('Peter,John,Andrew', dummy_render)).toEqual("Peter");	
	});

});

describe("last item of the list", function(){

	it("return empty strings for null values", function(){
		expect(list_helper.last(null, dummy_render)).toEqual("");	
	});

	it("return the given string if it's not an array literal", function(){
		expect(list_helper.last("hello", dummy_render)).toEqual("hello");	
	});

	it("return a formatted string for an array literal", function(){
		expect(list_helper.last(["Peter", "John", "Andrew"], dummy_render)).toEqual("Andrew");	
	});

	it("return a formatted string for an array literal as a string", function(){
		expect(list_helper.last('Peter,John,Andrew', dummy_render)).toEqual("Andrew");	
	});

});
