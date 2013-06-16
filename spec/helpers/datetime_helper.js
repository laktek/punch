var DateHelperObj = require("../../lib/helpers/datetime_helper");
var DateHelper = DateHelperObj.directAccess()["block_helpers"];

describe("datetime", function() {

	it("return datetime string for JSON date strings", function() {
		expect(DateHelper.datetime("2012-08-02T01:27:13.300Z")).toEqual(new Date("2012-08-02T01:27:13.300Z").toString());
	});

	it("return datetime string for unix epoch values", function() {
		expect(DateHelper.datetime("1343870833300")).toEqual(new Date(1343870833300).toString());
	});

	it("return an empty string for null values", function() {
		expect(DateHelper.datetime(null)).toEqual("");
	});

});

describe("date", function() {

	it("return date string for JSON date strings", function() {
		expect(DateHelper.date("2012-08-02T01:27:13.300Z")).toEqual(new Date("2012-08-02T01:27:13.300Z").toDateString());
	});

	it("return date string for unix epoch values", function() {
		expect(DateHelper.date("1343870833300")).toEqual(new Date(1343870833300).toDateString());
	});

	it("return an empty string for null values", function() {
		expect(DateHelper.date(null)).toEqual("");
	});

});

describe("time", function() {

	it("return time string for JSON date strings", function() {
		expect(DateHelper.time("2012-08-02T01:27:13.300Z")).toEqual(new Date("2012-08-02T01:27:13.300Z").toTimeString());
	});

	it("return date string for unix epoch values", function() {
		expect(DateHelper.time("1343870833300")).toEqual(new Date(1343870833300).toTimeString());
	});

	it("return an empty string for null values", function() {
		expect(DateHelper.time(null)).toEqual("");
	});

});

describe("iso date", function() {

	it("return ISO date string for JSON date strings", function() {
		expect(DateHelper.iso_date("2012-08-02T01:27:13.300Z")).toEqual("2012-08-02T01:27:13.300Z");
	});

	it("return ISO date string for unix epoch values", function() {
		expect(DateHelper.iso_date("1343870833300")).toEqual("2012-08-02T01:27:13.300Z");
	});

	it("return an empty string for null values", function() {
		expect(DateHelper.iso_date(null)).toEqual("");
	});

});

describe("utc date", function() {

	it("return UTC date string for JSON date strings", function() {
		expect(DateHelper.utc_date("2012-08-02T01:27:13.300Z")).toEqual('Thu, 02 Aug 2012 01:27:13 GMT');
	});

	it("return ISO date string for unix epoch values", function() {
		expect(DateHelper.utc_date("1343870833300")).toEqual('Thu, 02 Aug 2012 01:27:13 GMT');
	});

	it("return an empty string for null values", function() {
		expect(DateHelper.utc_date(null)).toEqual("");
	});

});
