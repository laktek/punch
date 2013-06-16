var AssetBundleHelperObj = require("../../lib/helpers/asset_bundle_helper");
var AssetBundleHelper = AssetBundleHelperObj.directAccess()["block_helpers"];

var AssetBundler = require("../../lib/asset_bundler");

describe("stylesheet bundle tag", function(){

	it("output the bundled tag when bundling no host is provided and fingerprint is disabled", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"], "fingerprint": false }, "bundles": { "/assets/all.css": [ "/assets/initial.css", "/assets/site.css" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": "" }, spyCallback);

		expect(AssetBundleHelper.stylesheet_bundle("/assets/all.css")).toEqual("<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"/assets/all.css\">");
	});

	it("output the bundled tag when bundling no host is provided and fingerprint is enabled", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"], "fingerprint": true }, "bundles": { "/assets/all.css": [ "/assets/initial.css", "/assets/site.css" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": "" }, spyCallback);

		expect(AssetBundleHelper.stylesheet_bundle("/assets/all.css")).toEqual("<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"/assets/all-" + new Date(2012, 7, 25).getTime() + ".css\">");
	});

	it("output tags for individual files in bundle when host is a local", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"] }, "bundles": { "/assets/all.css": [ "/assets/initial.css", "/assets/site.less" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": "localhost:9009" }, spyCallback);

		expect(AssetBundleHelper.stylesheet_bundle("/assets/all.css")).toEqual("<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"/assets/initial.css\">\n<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"/assets/site.css\">");
	});

});

describe("javascript bundle tag", function(){

	it("output the bundled tag when host is undefined and fingerprint is disabled", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"], "fingerprint": false }, "bundles": { "/assets/all.js": [ "/assets/jquery.js", "/assets/site.js" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": undefined }, spyCallback);

		expect(AssetBundleHelper.javascript_bundle("/assets/all.js")).toEqual("<script src=\"/assets/all.js\"></script>");
	});

	it("output the bundled tag when host is undefined and fingerprint is enabled", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"], "fingerprint": true }, "bundles": { "/assets/all.js": [ "/assets/jquery.js", "/assets/site.js" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": undefined }, spyCallback);

		expect(AssetBundleHelper.javascript_bundle("/assets/all.js")).toEqual("<script src=\"/assets/all-" + new Date(2012, 7, 25).getTime() + ".js\"></script>");
	});

	it("output tags for individual files in bundle when host is a local", function(){
		spyOn(AssetBundler, "setup");

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 7, 25) });
		});

		AssetBundleHelperObj.setup( { "asset_bundling": { "skip_hosts": ["localhost", "127.0.0.1", ".local"] }, "bundles": { "/assets/all.js": [ "/assets/jquery.js", "/assets/site.coffee" ]} });
		var spyCallback = jasmine.createSpy();
		AssetBundleHelperObj.get( "/path/test", ".html", { "host": "localhost:9009" }, spyCallback);

		expect(AssetBundleHelper.javascript_bundle("/assets/all.js")).toEqual("<script src=\"/assets/jquery.js\"></script>\n<script src=\"/assets/site.js\"></script>");
	});

});
