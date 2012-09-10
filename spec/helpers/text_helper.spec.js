var text_helper_obj = require("../../lib/helpers/text_helper");
var text_helper = text_helper_obj.directAccess()["block_helpers"];

describe("upcase", function(){

	it("change whole text to uppercase", function(){
		expect(text_helper.upcase("hello")).toEqual("HELLO");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.upcase(null)).toEqual("");
	});

});

describe("downcase", function(){

	it("change whole text to lowercase", function(){
		expect(text_helper.downcase("HELlo")).toEqual("hello");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.downcase(null)).toEqual("");
	});

});

describe("capitalize", function(){

	it("make the first letter upper case", function(){
		expect(text_helper.capitalize("hello")).toEqual("Hello");
	});

	it("make other letters lower case", function(){
		expect(text_helper.capitalize("HeLLo")).toEqual("Hello");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.capitalize(null)).toEqual("");
	});

});

describe("titleize", function(){

	it("capitalize each word", function(){
		expect(text_helper.titleize("hello my DEAR People")).toEqual("Hello My Dear People");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.titleize(null)).toEqual("");
	});

});

describe("trim", function(){

	it("removes whitespace in the beginning and end of the text", function(){
		expect(text_helper.trim(" hello my dear people  ")).toEqual("hello my dear people");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.trim(null)).toEqual("");
	});


});

describe("humanize", function(){

	it("removes dashes and underscores", function(){
		expect(text_helper.humanize("hello-my_dear_people")).toEqual("Hello my dear people");
	});

	it("capitalize the sentence", function(){
		expect(text_helper.humanize("hello-my-dear-people")).toEqual("Hello my dear people");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.humanize(null)).toEqual("");
	});

});

describe("dasherize", function() {

	it("return the dasherized output", function() {
		expect(text_helper.dasherize("hello my dear people  ")).toEqual("hello-my-dear-people");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.dasherize(null)).toEqual("");
	});

});

describe("underscored", function(){

	it("return the underscored output", function() {
		expect(text_helper.underscored("hello my dear people  ")).toEqual("hello_my_dear_people");
	});

	it("return an empty string for null values", function() {
		expect(text_helper.underscored(null)).toEqual("");
	});

});

describe("invalid parameters", function(){

	it("throw an error if invalid parameters were passed", function() {
		expect(function() { text_helper.underscored("hello my dear people  ", function(){ } ) }).toThrow();
	});

});
