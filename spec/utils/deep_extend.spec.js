var deepExtend = require("../../lib/utils/deep_extend");

describe("deep extend", function () {

	it("copy missing properties from source to destination", function() {
		expect(deepExtend({ "key1": "value1" }, { "key2": "value2" })).toEqual({ "key1": "value1", "key2": "value2" });
	});

	it("override primitive property values in destination", function() {
		expect(deepExtend({ "key": "value1" }, { "key": "value2" })).toEqual({ "key": "value2" });
	});

	it("extend the object values in destination", function() {
		expect(deepExtend({ "section": { "properties": { "key1": "value1" } } }, 
											{ "section": { "properties": { "key2": "value2" } } }))
						 .toEqual({ "section": { "properties": { "key1": "value1", "key2": "value2" } } });
	});

	it("extend the array values in destination", function() {
		expect(deepExtend({ "key": [ "value1", "value2" ] }, 
											{ "key": [ "value3", "value4" ] }))
						 .toEqual({ "key": [ "value1", "value2", "value3", "value4" ] });
	});

	it("override the destination object value if the source property explicitly says Override", function() {
		expect(deepExtend({ "section": { "properties": { "key1": "value1" } } }, 
											{ "section": { "propertiesOverride": { "key2": "value2" } } }))
					   .toEqual({ "section": { "properties": { "key2": "value2" } } });
	});

});

