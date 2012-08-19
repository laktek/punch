var asset_bundle_helper_obj = require("../../lib/helpers/asset_bundle_helper");
var asset_bundle_helper = asset_bundle_helper_obj.directAccess()["block_helpers"];

describe("stylesheet bundle tag", function(){

	it("output the bundled tag when bundling is enabled", function(){
		asset_bundle_helper_obj.setup( { "asset_bundling": true });
		expect(asset_bundle_helper.stylesheet_bundle("/assets/all.css")).toEqual('<link rel="stylesheet" type="text/css" media="screen" href="/assets/all.css">');	
	});

	it("output tags for individual files in bundle when bundling is disabled", function(){
		asset_bundle_helper_obj.setup( { "asset_bundling": false, "bundles": { "/assets/all.css": [ "/assets/initial.css", "/assets/site.css" ]} });
		expect(asset_bundle_helper.stylesheet_bundle("/assets/all.css")).toEqual('<link rel="stylesheet" type="text/css" media="screen" href="/assets/initial.css">\n<link rel="stylesheet" type="text/css" media="screen" href="/assets/site.css">');	
	});

});

describe("javascript bundle tag", function(){

	it("output the bundled tag when bundling is enabled", function(){
		asset_bundle_helper_obj.setup( { "asset_bundling": true });
		expect(asset_bundle_helper.javascript_bundle("/assets/all.js")).toEqual('<script src="/assets/all.js"></script>');	
	});

	it("output tags for individual files in bundle when bundling is disabled", function(){
		asset_bundle_helper_obj.setup( { "asset_bundling": false, "bundles": { "/assets/all.js": [ "/assets/jquery.js", "/assets/site.js" ]} });
		expect(asset_bundle_helper.javascript_bundle("/assets/all.js")).toEqual('<script src="/assets/jquery.js"></script>\n<script src="/assets/site.js"></script>');	
	});

});
