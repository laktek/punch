var text_helper_obj = require("../../lib/helpers/text_helper");
var text_helper = text_helper_obj.directAccess()["block_helpers"];

var dummy_render = function(text) { return text };

describe("upcase", function(){

	it("change whole text to uppercase", function(){
		expect(text_helper.upcase("hello", dummy_render)).toEqual("HELLO");	
	});

});

describe("downcase", function(){

	it("change whole text to lowercase", function(){
		expect(text_helper.downcase("HELlo", dummy_render)).toEqual("hello");	
	});

});

describe("capitalize", function(){

	it("make the first letter upper case", function(){
		expect(text_helper.capitalize("hello", dummy_render)).toEqual("Hello");	
	});

	it("make other letters lower case", function(){
		expect(text_helper.capitalize("HeLLo", dummy_render)).toEqual("Hello");	
	});

});

describe("titleize", function(){

	it("capitalize each word", function(){
		expect(text_helper.titleize("hello my DEAR People", dummy_render)).toEqual("Hello My Dear People");	
	});

});

describe("trim", function(){

	it("removes whitespace in the beginning and end of the text", function(){
		expect(text_helper.trim(" hello my dear people  ", dummy_render)).toEqual("hello my dear people");	
	});

});

describe("humanize", function(){

	it("removes dashes and undersocres", function(){
		expect(text_helper.humanize("hello-my_dear_people", dummy_render)).toEqual("Hello my dear people");	
	});

	it("capitalize the sentence", function(){
		expect(text_helper.humanize("hello-my-dear-people", dummy_render)).toEqual("Hello my dear people");	
	});

});

describe("dasherize", function() {

	it("return the dasherized output", function() {
		expect(text_helper.dasherize("hello my dear people  ", dummy_render)).toEqual("hello-my-dear-people");	
	});

});

describe("underscored", function(){

	it("return the underscored output", function() {
		expect(text_helper.underscored("hello my dear people  ", dummy_render)).toEqual("hello_my_dear_people");	
	});

});
