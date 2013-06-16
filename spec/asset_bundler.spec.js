var AssetBundler = require("../lib/asset_bundler.js");

var Fs = require("fs");
var Path = require("path");

var ModuleUtils = require("../lib/utils/module_utils.js");

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
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return {"id": id};
		});

		AssetBundler.setup(sample_config);

		expect(AssetBundler.templates.id).toEqual("sample_template_handler");
	});

	it("setup the cache store", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return {"id": id};
		});

		AssetBundler.setup(sample_config);

		expect(AssetBundler.cacheStore.id).toEqual("sample_cache_store");
	});

	it("setup each minifiers", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		AssetBundler.setup(sample_config);

		expect(AssetBundler.minifiers).toEqual({".js": {"id": "sample_js_minifier"}, ".css": {"id": "sample_css_minifier"}});
	});

	it("setup each compiler", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		AssetBundler.setup(sample_config);
		expect(AssetBundler.compilers).toEqual({".js": {"id": "sample_js_compiler"}, ".css": {"id": "sample_css_compiler"}});
	});

	it("load the bundles", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		AssetBundler.setup(sample_config);

		expect(AssetBundler.bundles).toEqual(sample_config.bundles);
	});

	it("set the bundle options", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		AssetBundler.setup(sample_config);

		expect(AssetBundler.bundleOptions).toEqual(sample_config.asset_bundling);
	});

});

describe("get the stat of a bundle", function() {

	it("call the callback with an error if there's no bundle for the given path", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb("[Error: There's no Bundle for the given path]", null);
		});

		var spyCallback = jasmine.createSpy();
		AssetBundler.statBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("call the callback with the latest mtime of the bundled files", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
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
		AssetBundler.templates = { "getTemplate": spyGetTemplate };

		var spyCallback = jasmine.createSpy();
		AssetBundler.statBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "mtime": new Date(2012, 7, 25) });
	});

});

describe("get a bundle", function() {

	it("call the callback with an error if there's no bundle for the given path", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb("[Error: There's no Bundle for the given path]", null);
		});

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		AssetBundler.getBundle("path/all", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("prepare bundle if there's no cached bundle file", function() {
		var bundle = [ "file1.js", "file2.js" ];
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, bundle);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback("error", null);
		});
		AssetBundler.cacheStore = { "stat": spyCacheStoreStat };

		spyOn(AssetBundler, "prepareBundle");

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		AssetBundler.getBundle("path/all", ".js", spyOptions, spyCallback);

		expect(AssetBundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("prepare bundle if any included file in the cached bundle is modified", function() {
		var bundle = [ "file1.js", "file2.js" ];
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, bundle);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });
		});
		AssetBundler.cacheStore = { "stat": spyCacheStoreStat };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13).getTime() });
		});
		AssetBundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(AssetBundler, "prepareBundle");

		var spyCallback = jasmine.createSpy();
		AssetBundler.getBundle("path/all", ".js", {}, spyCallback);

		expect(AssetBundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("update the cache with prepared bundle", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
			return cb(null, [ "file1.js", "file2.js" ]);
		});

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, options, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });
		});
		var spyCacheStoreUpdate = jasmine.createSpy();

		AssetBundler.cacheStore = { "stat": spyCacheStoreStat, "update": spyCacheStoreUpdate };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13).getTime() });
		});
		AssetBundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(AssetBundler, "prepareBundle").andCallFake(function(bundle, bundle_type, callback) {
			return callback("prepared bundle");
		});

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		AssetBundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCacheStoreUpdate).toHaveBeenCalledWith("path/all", ".js", { "body": "prepared bundle", "options": { "header": {} } }, spyOptions, jasmine.any(Function));
	});

	it("serve the prepared bundle", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
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
		AssetBundler.cacheStore = { "stat": spyCacheStoreStat, "update": spyCacheStoreUpdate };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 13) });
		});
		AssetBundler.templates = { "getTemplate": spyGetTemplate };

		spyOn(AssetBundler, "prepareBundle").andCallFake(function(bundle, bundle_type, callback) {
			return callback("prepared bundle");
		});

		AssetBundler.bundleOptions = { "cache": {}, "header": { "key": "value" }};

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		AssetBundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "prepared bundle", "modified": true, "options": { "cache": {}, "header": { "key": "value" } } });
	});

	it("serve from cache if non of included files in the cached bundle is modified", function() {
		spyOn(AssetBundler, "getContainedFilesInBundle").andCallFake(function(bundle_name, extension, cb) {
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
		AssetBundler.cacheStore = { "stat": spyCacheStoreStat, "get": spyCacheStoreGet };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 8) });
		});
		AssetBundler.templates = { "getTemplate": spyGetTemplate };

		AssetBundler.bundleOptions = { "cache": {}, "header": { "key": "value" }};

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		AssetBundler.getBundle("path/all-1221", ".js", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "cached bundle", "modified": false, "options": { "cache": {}, "header": { "last-modified": "utc-string" } } });
	});

});

describe("get contained files in a bundle", function() {

	it("call the callback with an error if there isn't a matching bundle", function() {
		AssetBundler.bundles = {};

		var spyCallback = jasmine.createSpy();
		AssetBundler.getContainedFilesInBundle("path/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("[Error: There's no Bundle for the given path]", null);
	});

	it("resolve nested bundles", function() {
		AssetBundler.bundles = {
			"/sub.js": [ "/sub/file1.js", "/sub/file2.js" ],
			"/all.js": [ "/file1.js", "/file2.js", "/sub.js" ]
		};

		var spyCallback = jasmine.createSpy();
		AssetBundler.getContainedFilesInBundle("/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [ "/file1.js", "/file2.js", "/sub/file1.js", "/sub/file2.js" ]);
	});

	it("resolve wildcard paths", function() {
		AssetBundler.bundles = {
			"/sub.js": [ "/sub/*.js" ],
			"/all.js": [ "/file1.js", "/file2.js", "/sub.js" ]
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(dirPath, cb) {
			return cb(null, [ {"full_path": "/sub/file1.js"}, {"full_path": "/sub/file2.js"}, {"full_path": "/sub/file3.coffee"}, {"full_path": "/sub/other.css"} ])
		});
		AssetBundler.templates = { "getTemplates": spyGetTemplates };

		var spyCallback = jasmine.createSpy();
		AssetBundler.getContainedFilesInBundle("/all", ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, [ "/file1.js", "/file2.js", "/sub/file1.js", "/sub/file2.js" ]);

	});

});

describe("prepare a bundle", function() {

	it("minify and compile files", function() {
		AssetBundler.compilers = {".js": {}};
		AssetBundler.minifiers = {".js": {}};

		spyOn(AssetBundler, "compileAndMinify").andCallFake(function(template_path, extension, compiler, minifier, callback) {
			return callback(null, "");
		});

		var spyCallback = jasmine.createSpy();
		AssetBundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(AssetBundler.compileAndMinify.callCount).toEqual(2);
	});

	it("call the callback with minified output", function() {
		AssetBundler.compilers = {".js": {}};
		AssetBundler.minifiers = {".js": {}};

		spyOn(AssetBundler, "compileAndMinify").andCallFake(function(template, extension, compiler, minifier, callback) {
			return callback(null, "(a());");
		});

		var spyCallback = jasmine.createSpy();
		AssetBundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("(a());(a());");
	});

});

describe("compile and minify", function() {

	it("call the callback with an error if template path is null", function() {
		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify(null, ".js", {}, null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("Template path can't be null", null);
	});

	it("call the callback with an error if no minifier found", function() {
		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.js", ".js", {}, null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("No minifier found", null);
	});

	it("read the given template", function() {
		var spyReadTemplate = jasmine.createSpy();
		AssetBundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.js", ".js", {}, {}, spyCallback);

		expect(spyReadTemplate).toHaveBeenCalledWith("path/test.js", jasmine.any(Function));
	});

	it("call the callback with an error if template cannot be read", function() {
		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback("error", null);
		});
		AssetBundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.js", ".js", {}, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("compile if it's a compilable template", function() {
		var spyCompile = jasmine.createSpy();
		var dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");
		});
		AssetBundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, {}, spyCallback);

		expect(spyCompile).toHaveBeenCalledWith("template output", Path.join("templates/path/test.coffee"), jasmine.any(Function));
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
		AssetBundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, {}, spyCallback);

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
		AssetBundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.coffee", ".coffee", dummy_compiler, dummy_minifier, spyCallback);

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
		AssetBundler.templates = { "readTemplate": spyReadTemplate, "templateDir": "templates" };

		var spyCallback = jasmine.createSpy();
		AssetBundler.compileAndMinify("path/test.js", ".js", dummy_compiler, dummy_minifier, spyCallback);

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
		AssetBundler.bundles = sample_bundles;

		spyOn(AssetBundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(AssetBundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		AssetBundler.touchBundles(spyAfter, spyComplete);

		expect(AssetBundler.getBundle).toHaveBeenCalledWith("assets/css/global", ".css", {}, jasmine.any(Function));
	});

	it("touch all defined bundles", function() {
		AssetBundler.bundles = sample_bundles;

		spyOn(AssetBundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(AssetBundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		AssetBundler.touchBundles(spyAfter, spyComplete);

		expect(AssetBundler.getBundle.callCount).toEqual(4);
	});

	it("call the after callback with the touched bundle path", function() {
		AssetBundler.bundles = sample_bundles;

		spyOn(AssetBundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(AssetBundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		AssetBundler.touchBundles(spyAfter, spyComplete);

		expect(spyAfter).toHaveBeenCalledWith("assets/css/layouts.css", jasmine.any(Function));
	});

	it("fingerprint bundle with the touched bundle path", function() {
		AssetBundler.bundleOptions.fingerprint = true;
		AssetBundler.bundles = sample_bundles;

		spyOn(AssetBundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(AssetBundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();

		var spyComplete = jasmine.createSpy();
		AssetBundler.touchBundles(spyAfter, spyComplete);

		expect(AssetBundler.fingerprintBundle).toHaveBeenCalledWith("assets/js/global.js", spyAfter);
	});

	it("call the complete callback after touching all bundles", function() {
		spyOn(AssetBundler, "getBundle").andCallFake(function(basename, type, options, callback) {
			return callback(null, { "modified": true, "body": "" });
		});

		spyOn(AssetBundler, "fingerprintBundle");

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();
		});
		var spyComplete = jasmine.createSpy();
		AssetBundler.touchBundles(spyAfter, spyComplete);

		expect(spyComplete).toHaveBeenCalled();
	});

});

describe("fingerprint a bundle", function() {

	it("halt if no bundle path given", function() {
		var spyCallback = jasmine.createSpy();
		AssetBundler.fingerprintBundle(null, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

	it("take the stat of the bundle", function() {
		spyOn(AssetBundler, "statBundle");

		var spyCallback = jasmine.createSpy();
		AssetBundler.fingerprintBundle("path/test.js", spyCallback);

		expect(AssetBundler.statBundle).toHaveBeenCalledWith("path/test", ".js", jasmine.any(Function));
	});

	it("get the bundle from the cache", function() {
		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(2012, 10, 8) });
		});

		var spyCacheStoreGet  = jasmine.createSpy();
		AssetBundler.cacheStore = { "get": spyCacheStoreGet };

		var spyCallback = jasmine.createSpy();
		AssetBundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCacheStoreGet).toHaveBeenCalledWith("path/test", ".js", {}, null, jasmine.any(Function));
	});

	it("add the fingereprinted bundle to the cache", function() {
		var spyBundleContent = jasmine.createSpy();

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
			return callback(null, { "mtime": new Date(1352313000000) });
		});

		var spyCacheStoreGet = jasmine.createSpy();
		spyCacheStoreGet.andCallFake(function(basename, extension, rendered_obj, request_options, callback) {
			return callback(null, spyBundleContent);
		});
		var spyCacheStoreUpdate = jasmine.createSpy();
		AssetBundler.cacheStore = { "get": spyCacheStoreGet, "update": spyCacheStoreUpdate };

		var spyCallback = jasmine.createSpy();
		AssetBundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCacheStoreUpdate).toHaveBeenCalledWith("path/test-1352313000000", ".js", spyBundleContent, {}, jasmine.any(Function));
	});

	it("call the callback function with the fingerprinted bundle path", function() {
		var spyBundleContent = jasmine.createSpy();

		spyOn(AssetBundler, "statBundle").andCallFake(function(basename, extension, callback) {
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
		AssetBundler.cacheStore = { "get": spyCacheStoreGet, "update": spyCacheStoreUpdate };

		var spyCallback = jasmine.createSpy();
		AssetBundler.fingerprintBundle("path/test.js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("path/test-1352313000000.js", jasmine.any(Function));
	});

});

describe("is bundle path", function() {

	it("check if there's a bundle path matching given basename and file extension", function() {
		var bundle = [ "file1.js", "file2.js" ];
		AssetBundler.bundles = { "path/all.js": bundle };

		expect(AssetBundler.isBundlePath("path/all-1234", ".js")).toEqual(true);
	});

});
