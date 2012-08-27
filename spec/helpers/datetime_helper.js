var date_helper_obj = require("../../lib/helpers/datetime_helper");
var date_helper = date_helper_obj.directAccess()["block_helpers"];

describe("datetime", function() {

	it("return datetime string for JSON date strings", function() {
		expect(date_helper.datetime("2012-08-02T01:27:13.300Z")).toEqual("Thu Aug 02 2012 06:57:13 GMT+0530 (IST)");	
	});

	it("return datetime string for unix epoch values", function() {
		expect(date_helper.datetime("1343870833300")).toEqual("Thu Aug 02 2012 06:57:13 GMT+0530 (IST)");	
	});

	it("return an empty string for null values", function() {
		expect(date_helper.datetime(null)).toEqual("");	
	});

});

describe("date", function() {

	it("return date string for JSON date strings", function() {
		expect(date_helper.date("2012-08-02T01:27:13.300Z")).toEqual("Thu Aug 02 2012");	
	});

	it("return date string for unix epoch values", function() {
		expect(date_helper.date("1343870833300")).toEqual("Thu Aug 02 2012");	
	});

	it("return an empty string for null values", function() {
		expect(date_helper.date(null)).toEqual("");	
	});

});

describe("time", function() {

	it("return time string for JSON date strings", function() {
		expect(date_helper.time("2012-08-02T01:27:13.300Z")).toEqual("06:57:13 GMT+0530 (IST)");	
	});

	it("return date string for unix epoch values", function() {
		expect(date_helper.time("1343870833300")).toEqual("06:57:13 GMT+0530 (IST)");	
	});

	it("return an empty string for null values", function() {
		expect(date_helper.time(null)).toEqual("");	
	});

});

describe("iso date", function() {

	it("return ISO date string for JSON date strings", function() {
		expect(date_helper.iso_date("2012-08-02T01:27:13.300Z")).toEqual("2012-08-02T01:27:13.300Z");	
	});

	it("return ISO date string for unix epoch values", function() {
		expect(date_helper.iso_date("1343870833300")).toEqual("2012-08-02T01:27:13.300Z");	
	});

	it("return an empty string for null values", function() {
		expect(date_helper.iso_date(null)).toEqual("");	
	});

});
