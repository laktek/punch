var path_utils = require("../../lib/utils/path_utils.js");

describe("get the extension", function() {

	it("get directly from the path", function() {
		expect( path_utils.getExtension("path/test.html", {}) ).toEqual(".html");
	});

	it("get from the accept type", function() {
		expect(path_utils.getExtension("path/test", [ { "mediarange": "text/html" }, { "mediarange": "application/xhtml+xml" }, { "mediarange": "*/*" } ])).toEqual(".html");
	});

	it("set html if it accept any type", function() {
		expect(path_utils.getExtension("path/test", [ { "mediarange": "*/*" } ])).toEqual(".html");
	});

	it("set html if no accept type given", function() {
		expect(path_utils.getExtension("path/test", [])).toEqual(".html");
	});

});

describe("get the basename", function() {

	it("return the path after removing the extension", function() {
		expect(path_utils.getBasename("path/sub/test.html", ".html")).toEqual("path/sub/test");	
	});

	it("don't change the paths without the extension", function() {
		expect(path_utils.getBasename("path/sub_html/api", ".html")).toEqual("path/sub_html/api");	
	});

	it("set the root path to index", function() {
		expect(path_utils.getBasename("/", ".html")).toEqual("/index");	
	});

});
