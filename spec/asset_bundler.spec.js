var asset_bundler = require("../lib/asset_bundler.js");

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
		}
	}

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

});

describe("get a bundle", function() {

	it("call the callback with an error if there's no bundle for the given path", function() {
		asset_bundler.bundles = { };

		var spyCallback = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("There's no Bundle for the given path", null);
	});

	it("prepare bundle if there's no cached bundle file", function() {
		var bundle = [ "file1.js", "file2.js" ];
		asset_bundler.bundles = { "path/all.js": bundle };

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, callback){
			return callback("error", null);	
		});
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat };

		spyOn(asset_bundler, "prepareBundle");
	
		var spyCallback = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", spyCallback);	

		expect(asset_bundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("prepare bundle if any included file in the cached bundle is modified", function() {
		var bundle = [ "file1.js", "file2.js" ];
		asset_bundler.bundles = { "path/all.js": bundle };

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, callback){
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
		asset_bundler.getBundle("path/all", ".js", spyCallback);	

		expect(asset_bundler.prepareBundle).toHaveBeenCalledWith(bundle, ".js", jasmine.any(Function));
	});

	it("update the cache with prepared bundle", function() {
		var bundle = [ "file1.js", "file2.js" ];
		asset_bundler.bundles = { "path/all.js": bundle };

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });	
		});
		var spyCacheStoreUpdate = jasmine.createSpy();
		spyCacheStoreUpdate.andCallFake(function(basename, ext, output, header, callback){
			return callback(null);	
		});
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
		asset_bundler.getBundle("path/all", ".js", spyCallback);	

		expect(spyCacheStoreUpdate).toHaveBeenCalledWith("path/all", ".js", "prepared bundle", {}, jasmine.any(Function));
	});

	it("serve from cache if non of included files in the cached bundle is modified", function() {
		var bundle = [ "file1.js", "file2.js" ];
		asset_bundler.bundles = { "path/all.js": bundle };

		var spyCacheStoreStat = jasmine.createSpy();
		spyCacheStoreStat.andCallFake(function(path, ext, callback){
			return callback(null, { "mtime": new Date(2012, 7, 10).getTime() });	
		});
		spyCacheStoreGet  = jasmine.createSpy();
		spyCacheStoreGet.andCallFake(function(basename, ext, header, callback) {
			return callback(null, { "body": "cached bundle" });	
		})
		asset_bundler.cacheStore = { "stat": spyCacheStoreStat, "get": spyCacheStoreGet };

		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(template_path, callback) {
			return callback(null, { "last_modified": new Date(2012, 7, 8).getTime() });	
		});
		asset_bundler.templates = { "getTemplate": spyGetTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.getBundle("path/all", ".js", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("cached bundle");
	});

});

describe("prepare a bundle", function() {

	it("minify and compile each file in bundle", function() {
		asset_bundler.compilers = {".js": {}};
		asset_bundler.minifiers = {".js": {}};

		spyOn(asset_bundler, "compileAndMinify").andCallFake(function(template, compiler, minifier, callback) {
			return callback(null, "");	
		});

		var spyCallback = jasmine.createSpy();
		asset_bundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(asset_bundler.compileAndMinify.callCount).toEqual(2);
	});

	it("call the callback with minified output", function() {
		asset_bundler.compilers = {".js": {}};
		asset_bundler.minifiers = {".js": {}};

		spyOn(asset_bundler, "compileAndMinify").andCallFake(function(template, compiler, minifier, callback) {
			return callback(null, "(a())");	
		});

		var spyCallback = jasmine.createSpy();
		asset_bundler.prepareBundle(["file1.js", "file2.js"], ".js", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("(a());(a());");
	});

});

describe("compile and minify", function() {

	it("call the callback with an error if no minifier found", function() {
		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", {}, null, spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("No minifier found", null);
	});

	it("read the given template", function() {
		var spyReadTemplate = jasmine.createSpy();
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", {}, {}, spyCallback);	
		
		expect(spyReadTemplate).toHaveBeenCalledWith("path/test.js", jasmine.any(Function));
	});

	it("call the callback with an error if template cannot be read", function() {
		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback("error", null);	
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", {}, {}, spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("error", null);
	});

	it("compile if it's a compilable template", function() {
		var spyCompile = jasmine.createSpy();
		dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");	
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", dummy_compiler, {}, spyCallback);	
		
		expect(spyCompile).toHaveBeenCalledWith("template output", jasmine.any(Function));
	});

	it("call the callback with an error if compilation fails", function() {
		var spyCompile = jasmine.createSpy();
		spyCompile.andCallFake(function(input, callback) {
			return callback("compile error", null);	
		});
		dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");	
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", dummy_compiler, {}, spyCallback);	
		
		expect(spyCallback).toHaveBeenCalledWith("compile error", null);
	});

	it("call minify after compilation", function() {
		var spyCompile = jasmine.createSpy();
		spyCompile.andCallFake(function(input, callback) {
			return callback(null, "compiled output");	
		});
		dummy_compiler = { "compile": spyCompile, "input_extensions": [".coffee"] };

		var spyMinify = jasmine.createSpy();
		dummy_minifier = { "minify": spyMinify };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");	
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.coffee", dummy_compiler, dummy_minifier, spyCallback);	
		
		expect(spyMinify).toHaveBeenCalledWith("compiled output", spyCallback);
	});

	it("call minify directly for non-compilable templates", function() {
		dummy_compiler = { "compile": {}, "input_extensions": [".coffee"] };

		var spyMinify = jasmine.createSpy();
		dummy_minifier = { "minify": spyMinify };

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			return callback(null, "template output");	
		});
		asset_bundler.templates = { "readTemplate": spyReadTemplate };

		var spyCallback = jasmine.createSpy();
		asset_bundler.compileAndMinify("path/test.js", dummy_compiler, dummy_minifier, spyCallback);	
		
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

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, callback) {
			return callback("");	
		});

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();	
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);	

		expect(asset_bundler.getBundle).toHaveBeenCalledWith("assets/css/global", ".css", jasmine.any(Function));
	});

	it("touch all defined bundles", function() {
		asset_bundler.bundles = sample_bundles; 

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, callback) {
			return callback("");	
		});

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

		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, callback) {
			return callback("");	
		});

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();	
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);	

		expect(spyAfter).toHaveBeenCalledWith("assets/css/layouts.css", jasmine.any(Function));
	});

	it("call the complete callback after touching all bundles", function() {
		spyOn(asset_bundler, "getBundle").andCallFake(function(basename, type, callback) {
			return callback("");	
		});

		var spyAfter = jasmine.createSpy();
		spyAfter.andCallFake(function(path, callback) {
			return callback();	
		});
		var spyComplete = jasmine.createSpy();
		asset_bundler.touchBundles(spyAfter, spyComplete);	

		expect(spyComplete).toHaveBeenCalled();
	});

});
