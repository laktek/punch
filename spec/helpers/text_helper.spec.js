var TextHelperObj = require("../../lib/helpers/text_helper");
var TextHelper = TextHelperObj.directAccess()["block_helpers"];

describe("upcase", function(){

	it("change whole text to uppercase", function(){
		expect(TextHelper.upcase("hello")).toEqual("HELLO");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.upcase(null)).toEqual("");
	});

});

describe("downcase", function(){

	it("change whole text to lowercase", function(){
		expect(TextHelper.downcase("HELlo")).toEqual("hello");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.downcase(null)).toEqual("");
	});

});

describe("capitalize", function(){

	it("make the first letter upper case", function(){
		expect(TextHelper.capitalize("hello")).toEqual("Hello");
	});

	it("make other letters lower case", function(){
		expect(TextHelper.capitalize("HeLLo")).toEqual("Hello");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.capitalize(null)).toEqual("");
	});

});

describe("titleize", function(){

	it("capitalize each word", function(){
		expect(TextHelper.titleize("hello my DEAR People")).toEqual("Hello My Dear People");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.titleize(null)).toEqual("");
	});

});

describe("trim", function(){

	it("removes whitespace in the beginning and end of the text", function(){
		expect(TextHelper.trim(" hello my dear people  ")).toEqual("hello my dear people");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.trim(null)).toEqual("");
	});


});

describe("humanize", function(){

	it("removes dashes and underscores", function(){
		expect(TextHelper.humanize("hello-my_dear_people")).toEqual("Hello my dear people");
	});

	it("capitalize the sentence", function(){
		expect(TextHelper.humanize("hello-my-dear-people")).toEqual("Hello my dear people");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.humanize(null)).toEqual("");
	});

});

describe("dasherize", function() {

	it("return the dasherized output", function() {
		expect(TextHelper.dasherize("hello my dear people  ")).toEqual("hello-my-dear-people");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.dasherize(null)).toEqual("");
	});

});

describe("underscored", function(){

	it("return the underscored output", function() {
		expect(TextHelper.underscored("hello my dear people  ")).toEqual("hello_my_dear_people");
	});

	it("return an empty string for null values", function() {
		expect(TextHelper.underscored(null)).toEqual("");
	});

});

describe("invalid parameters", function(){

	it("throw an error if invalid parameters were passed", function() {
		expect(function() { TextHelper.underscored("hello my dear people  ", function(){ } ) }).toThrow();
	});

});
