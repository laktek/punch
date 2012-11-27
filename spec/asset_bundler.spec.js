var asset_bundler = require("../lib/asset_bundler.js");

var fs = require("fs");

var module_utils = require("../lib/utils/module_utils.js");

describe("setup", function(){

	var sample_config = {
		plugins: {
			template_handler: "sample_template_handler",
			cache_store: "sample_cache_store",
			compilers: {
				".js": "sample_js_compiler",
				".css": "sample_css_compiler"
			},
			minifiers: {
				".js": "sample_js_minifier",
				".css": "sample_css_minifier"
			}
		},
		bundles: {
			"assets/js/global.js": [ "assets/js/jquery.js", "assets/js/site.js"],
			"assets/js/libs.js": [ "assets/js/lib1.js", "assets/js/lib2.js"],
			"assets/css/global.css": [ "assets/css/initial.js", "assets/css/form.css"],
			"assets/css/layouts.css": [ "assets/css/header.css", "assets/css/body.css"]
		},
		asset_bundling: {
			"header": {},
			"cache": {}
		}
	};

	it("setup the templates handler", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return {"id": id};
		});

		asset_bundler.setup(sample_config);

		expect(asset_bundler.templates.id).toEqual("sample_template_handler");
	});

	it("setup the cache store", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return {"id": id};
		});

		asset_bundler.setup(sample_config);

		expect(asset_bundler.cacheStore.id).toEqual("sample_cache_store");
	});

	it("setup each minifiers", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		asset_bundler.setup(sample_config);

		expect(asset_bundler.minifiers).toEqual({".js": {"id": "sample_js_minifier"}, ".css": {"id": "sample_css_minifier"}});
	});

	it("setup each compiler", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		asset_bundler.setup(sample_config);
		expect(asset_bundler.compilers).toEqual({".js": {"id": "sample_js_compiler"}, ".css": {"id": "sample_css_compiler"}});
	});

	it("load the bundles", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		asset_bundler.setup(sample_config);

		expect(asset_bundler.bundles).toEqual(sample_config.bundles);
	});

	it("set the bundle options", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		asset_bundler.setup(sample_config);

		expect(asset_bundler.bundleOptions).toEqual(sample_config.asset_bundling);
	});

});

describe("get the stat of a bundle", function() {

	it("call the callback with an error if there's no bundle for the given path", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb("[Error: There's no Bundle for the given path]", null);
		});

		var spyCallback = jasmine.createSpy();
		asset_bundler.statBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("call the callback with the latest mtime of the bundled files", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, [ "file1.js", "file2.js" ]);
		});

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			if (template_path === "file2.js") {
				return callback(null, { "last_modified": new Date(2012, 7, 25) });
			} else {
				return callback(null, { "last_modified": new Date(2012, 7, 13) });
			}
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.statBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "mtime": new Date(2012, 7, 25) });
	});

});

describe("get a bundle", function() {

	it("call the callback with an error if there's no bundle for the given path", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb("[Error: There's no Bundle for the given path]", null);
		});

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("prepare bundle if there's no cached bundle file", function() {
		var bundle = [ "file1.js", "file2.js" ];
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, bundle);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback("error", null);
		});
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat };

		spyOn(asset_bundler, "prepareBundle");

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", spyOptions, spyCallback);

		expect(asset_bundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("prepare bundle if any included file in the cached bundle is modified", function() {
		var bundle = [ "file1.js", "file2.js" ];
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, bundle);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });
		});
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13).getTime() });
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(asset_bundler, "prepareBundle");

		var spyCallback = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", {}, spyCallback);

		expect(asset_bundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("update the cache with prepared bundle", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, [ "file1.js", "file2.js" ]);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });
		});
		var spyCacheStoreUpdate = jasmine.createSpy();

		asset_bundler.cacheStore = { "stat": spyCacheStoreStat, "update": spyCacheStoreUpdate };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13).getTime() });
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(asset_bundler, "prepareBundle").andCallFake(function(bundle, bundle_type, callback) {
			return callback("prepared bundle");
		});

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		asset_bundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCacheStoreUpdate).toHaveBeenCalledWith("path/all", ".js", { "body": "prepared bundle", "options": { "header": {} } }, spyOptions, jasmine.any(Function));
	});

	it("serve the prepared bundle", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, [ "file1.js", "file2.js" ]);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10) });
		});
		var spyCacheStoreUpdate = jasmine.createSpy();
		spyCacheStoreUpdate.andCallFake(function(basename, ext, rendered_obj, options, callback){
			return callback(null, { "body": rendered_obj.body, "options": { "header": rendered_obj.options.header }});
		});
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat, "update": spyCacheStoreUpdate };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13) });
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(asset_bundler, "prepareBundle").andCallFake(function(bundle, bundle_type, callback) {
			return callback("prepared bundle");
		});

		asset_bundler.bundleOptions = { "cache": {}, "header": { "key": "value" }};

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		asset_bundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "prepared bundle", "modified": true, "options": { "cache": {}, "header": { "key": "value" } } });
	});

	it("serve from cache if non of included files in the cached bundle is modified", function() {
		spyOn(asset_bundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, [ "file1.js", "file2.js" ]);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10) });
		});
		var spyCacheStoreGet  = jasmine.createSpy();
		spyCacheStoreGet.andCallFake(function(basename, ext, rendered_obj, options, callback) {
			return callback(null, { "body": "cached bundle", "options": { "header": { "last-modified": "utc-string" } } });
		});
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat, "get": spyCacheStoreGet };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 8) });
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		asset_bundler.bundleOptions = { "cache": {}, "header": { "key": "value" }};

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		asset_bundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "cached bundle", "modified": false, "options": { "cache": {}, "header": { "last-modified": "utc-string" } } });
	});

});

describe("get contained files in a bundle", function() {

	it("call the callback with an error if there isn't a matching bundle", function() {
		asset_bundler.bundles = {};

		var spyCallback = jasmine.createSpy();
		asset_bundler.getContainedFilesInBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("resolve nested bundles", function() {
		asset_bundler.bundles = {
			"/sub.js": [ "/sub/file1.js", "/sub/file2.js" ],
			"/all.js": [ "/file1.js", "/file2.js", "/sub.js" ]
		};

		var spyCallback = jasmine.createSpy();
		asset_bundler.getContainedFilesInBundle("/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [ "/file1.js", "/file2.js", "/sub/file1.js", "/sub/file2.js" ]);
	});

	it("resolve wildcard paths", function() {
		asset_bundler.bundles = {
			"/sub.js": [ "/sub/*.js" ],
			"/all.js": [ "/file1.js", "/file2.js", "/sub.js" ]
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(dirpath, cb) {
			return cb(null, [ {"full_path": "/sub/file1.js"}, {"full_path": "/sub/file2.js"}, {"full_path": "/sub/file3.coffee"}, {"full_path": "/sub/other.css"} ])
		});
		asset_bundler.templates = { "getTemplates": spyGetTemplates };

		var spyCallback = jasmine.createSpy();
		asset_bundler.getContainedFilesInBundle("/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [ "/file1.js", "/file2.js", "/sub/file1.js", "/sub/file2.js" ]);

	});

});

describe("prepare a bundle", function() {

	it("minify and compile files", function() {
		asset_bundler.compilers = {".js": {}};
		asset_bundler.minifiers = {".js": {}};

		spyOn(asset_bundler, "compileAndMinify").andCallFake(function(template_path, extension, compiler, minifier, callback) {
			return callback(null, "");
		});

		var spyCallback = jasmine.createSpy();
		asset_bundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(asset_bundler.compileAndMinify.callCount).toEqual(2);
	});

	it("call the callback with minified output", function() {
		asset_bundler.compilers = {".js": {}};
		asset_bundler.minifiers = {".js": {}};

		spyOn(asset_bundler, "compileAndMinify").andCallFake(function(template, extension, compiler, minifier, callback) {
			return callback(null, "(a());");
		});

		var spyCallback = jasmine.createSpy();
		asset_bundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("(a());(a());");
	});

});

describe("compile and minify", function() {

	it("call the callback with an error if no minifier found", function() {
		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", ".js", {}, null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("No minifier found", null);
	});

	it("read the given template", function() {
		var spyReadTemplate = jasmine.createSpy();
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", ".js", {}, {}, spyCallback);

		expect(spyReadTemplate).toHaveBeenCalledWith("path/test.js", jasmine.any(Function));
	});

	it("call the callback with an error if template cannot be read", function() {
		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback("error", null);
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", ".js", {}, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("compile if it's a compilable template", function() {
		var spyCompile = jasmine.createSpy();
		var dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, {}, spyCallback);

		expect(spyCompile).toHaveBeenCalledWith("template output", "templates/path/test.coffee", jasmine.any(Function));
	});

	it("call the callback with an error if compilation fails", function() {
		var spyCompile = jasmine.createSpy();
		spyCompile.andCallFake(function(input, file_path, callback) {
			return callback("compile error", null);
		});
		var dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("compile error", null);
	});

	it("call minify after compilation", function() {
		var spyCompile = jasmine.createSpy();
		spyCompile.andCallFake(function(input, file_path, callback) {
			return callback(null, "compiled output");
		});
		var dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyMinify = jasmine.createSpy();
		var dummy_minifier = { "minify": spyMinify };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, dummy_minifier, spyCallback);

		expect(spyMinify).toHaveBeenCalledWith("compiled output", spyCallback);
	});

	it("call minify directly for non-compilable templates", function() {
		var dummy_compiler = { "compile": {}, "input_extensions": [".coffee"] };

		var spyMinify = jasmine.createSpy();
		var dummy_minifier = { "minify": spyMinify };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", ".js", dummy_compiler, dummy_minifier, spyCallback);

		expect(spyMinify).toHaveBeenCalledWith("template output", spyCallback);
	});

});

describe("touch bundles", function() {

	var sample_bundles = {
		"assets/js/global.js": [ "assets/js/jquery.js", "assets/js/site.js"],
		"assets/js/libs.js": [ "assets/js/lib1.js", "assets/js/lib2.js"],
		"assets/css/global.css": [ "assets/css/initial.css", "assets/css/form.css"],
		"assets/css/layouts.css": [ "assets/css/header.css", "assets/css/body.css"]
	};

	it("use correct basename and type when calling a bundle", function() {
		asset_bundler.bundles = sample_bundles;

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(asset_bundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);

		expect(asset_bundler.getBundle).toHaveBeenCalledWith("assets/css/global", ".css", {}, jasmine.any(Function));
	});

	it("touch all defined bundles", function() {
		asset_bundler.bundles = sample_bundles;

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(asset_bundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);

		expect(asset_bundler.getBundle.callCount).toEqual(4);
	});

	it("call the after callback with the touched bundle path", function() {
		asset_bundler.bundles = sample_bundles;

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(asset_bundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);

		expect(spyAfter).toHaveBeenCalledWith("assets/css/layouts.css", jasmine.any(Function));
	});

	it("fingerprint bundle with the touched bundle path", function() {
		asset_bundler.bundleOptions.fingerprint = true;
		asset_bundler.bundles = sample_bundles;

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(asset_bundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();

		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);

		expect(asset_bundler.fingerprintBundle).toHaveBeenCalledWith("assets/js/global.js", spyAfter);
	});

	it("call the complete callback after touching all bundles", function() {
		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(asset_bundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);

		expect(spyComplete).toHaveBeenCalled();
	});

});

describe("fingerprint a bundle", function() {

	it("halt if no bundle path given", function() {
		var spyCallback = jasmine.createSpy();
		asset_bundler.fingerprintBundle(null, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("take the stat of the bundle", function() {
		spyOn(asset_bundler, "statBundle");

		var spyCallback = jasmine.createSpy();
		asset_bundler.fingerprintBundle("path/test.js", spyCallback);

		expect(asset_bundler.statBundle).toHaveBeenCalledWith("path/test", ".js", jasmine.any(Function));
	});

	it("get the bundle from the cache", function() {
		spyOn(asset_bundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 10, 8) });
		});

		var spyCacheStoreGet  = jasmine.createSpy();
		asset_bundler.cacheStore = { "get": spyCacheStoreGet };

		var spyCallback = jasmine.createSpy();
		asset_bundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCacheStoreGet).toHaveBeenCalledWith("path/test", ".js", {}, null, jasmine.any(Function));
	});

	it("add the fingereprinted bundle to the cache", function() {
		var spyBundleContent = jasmine.createSpy();

		spyOn(asset_bundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(1352313000000) });
		});

		var spyCacheStoreGet = jasmine.createSpy();
		spyCacheStoreGet.andCallFake(function(basename, extension, rendered_obj, request_options, callback) {
			return callback(null, spyBundleContent);
		});
		var spyCacheStoreUpdate = jasmine.createSpy();
		asset_bundler.cacheStore = { "get": spyCacheStoreGet, "update": spyCacheStoreUpdate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCacheStoreUpdate).toHaveBeenCalledWith("path/test-1352313000000", ".js", spyBundleContent, {}, jasmine.any(Function));
	});

	it("call the callback function with the fingerprinted bundle path", function() {
		var spyBundleContent = jasmine.createSpy();

		spyOn(asset_bundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(1352313000000) });
		});

		var spyCacheStoreGet = jasmine.createSpy();
		spyCacheStoreGet.andCallFake(function(basename, extension, rendered_obj, request_options, callback) {
			return callback(null, spyBundleContent);
		});
		var spyCacheStoreUpdate = jasmine.createSpy();
		spyCacheStoreUpdate.andCallFake(function(file_path, extension, content, options, callback ) {
			return callback();
		});
		asset_bundler.cacheStore = { "get": spyCacheStoreGet, "update": spyCacheStoreUpdate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("path/test-1352313000000.js", jasmine.any(Function));
	});

});

describe("is bundle path", function() {

	it("check if there's a bundle path matching given basename and file extension", function() {
		var bundle = [ "file1.js", "file2.js" ];
		asset_bundler.bundles = { "path/all.js": bundle };

		expect(asset_bundler.isBundlePath("path/all-1234", ".js")).toEqual(true);
	});

});
