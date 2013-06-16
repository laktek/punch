var PathUtils = require("../../lib/utils/path_utils");
var Path = require("path");
var Os = require("os");

describe("get the extension", function() {

	it("get directly from the path", function() {
		expect( PathUtils.getExtension("path/test.html", {}) ).toEqual(".html");
	});

	it("get from the accept type", function() {
		expect(PathUtils.getExtension("path/test", [ { "mediarange": "text/html" }, { "mediarange": "application/xhtml+xml" }, { "mediarange": "*/*" } ])).toEqual(".html");
	});

	it("set html if it accept any type", function() {
		expect(PathUtils.getExtension("path/test", [ { "mediarange": "*/*" } ])).toEqual(".html");
	});

	it("set html if no accept type given", function() {
		expect(PathUtils.getExtension("path/test", [])).toEqual(".html");
	});

});

describe("get the basename", function() {

	it("return the path after removing the extension", function() {
		expect(PathUtils.getBasename("path/sub/test.html", ".html")).toEqual("path/sub/test");
	});

	it("don't change the paths without the extension", function() {
		expect(PathUtils.getBasename("path/sub_html/api", ".html")).toEqual("path/sub_html/api");
	});

	it("set the root path to index", function() {
		expect(PathUtils.getBasename("/", ".html")).toEqual(Path.sep + "index");
	});

});

describe("match a path", function() {

	it("matches a single path", function() {
		var matches = PathUtils.matchPath("/css/less/main.less", "/css/less/*");
		expect(matches[0]).toEqual("/css/less/");
	});

	it("matches a single path on windows", function() {
    spyOn(Os, "platform").andCallFake(function(){
      return "win32"
    });
		var matches = PathUtils.matchPath("\\css\\less\\main.less", "/css/less/*");
		expect(matches[0]).toEqual("/css/less/");
	});

	it("matches multiple paths", function() {
		var matches = PathUtils.matchPath("/css/less/main.less", ["/css/less/*", "/css/sass/*"]);
		expect(matches).toBeTruthy();
	});

	it("matches multiple paths on windows", function() {
    spyOn(Os, "platform").andCallFake(function(){
      return "win32"
    });
		var matches = PathUtils.matchPath("\\css\\less\\main.less", ["/css/less/*", "/css/sass/*"]);
		expect(matches).toBeTruthy();
	});

	it("fails a match on single path", function() {
		var matches = PathUtils.matchPath("/css/less/main.less", "/css/sass/*");
		expect(matches).toBeFalsy();
	});

	it("fails a match on single path on windows", function() {
    spyOn(Os, "platform").andCallFake(function(){
      return "win32"
    });
		var matches = PathUtils.matchPath("\\css\\less\\main.less", "/css/sass/*");
		expect(matches).toBeFalsy();
	});

	it("fails a match on multiple paths", function() {
		var matches = PathUtils.matchPath("/css/less/main.less", ["/css/les/*", "/css/sass/*"]);
		expect(matches).toBeTruthy();
	});

	it("fails a match on multiple paths on windows", function() {
    spyOn(Os, "platform").andCallFake(function(){
      return "win32"
    });
		var matches = PathUtils.matchPath("\\css\\less\\main.less", ["/css/les/*", "/css/sass/*"]);
		expect(matches).toBeTruthy();
	});

});
