var site_generator = require("../lib/site_generator.js");

var page_renderer = require("../lib/page_renderer.js");
var asset_bundler = require("../lib/asset_bundler.js");
var module_utils = require("../lib/utils/module_utils.js");
var path_utils = require("../lib/utils/path_utils.js");

describe("setup", function(){

	var sample_config = {
		plugins: {
			template_handler: "sample_template_handler",
			content_handler: "sample_content_handler",
			template_engine: "sample_template_engine",
			cache_store: "sample_cache_store",
			compilers: {
				".js": "sample_js_compiler",
				".css": "sample_css_compiler"
			},
			generator_hooks: {
				"sample": "sample_hook"
			}
		},
		generator: {
			blank: true,
			skip_paths: [ "path/ignore/page1", "path/ignore/page1" ]
		}
	};

	it("set the blank state flag", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.blankState).toEqual(true);
	});

	it("set the paths to skip", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.pathsToSkip).toEqual([ "path/ignore/page1", "path/ignore/page1" ]);
	});

	it("setup the templates handler", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.templates.id).toEqual("sample_template_handler");
	});

	it("setup the contents handler", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.contents.id).toEqual("sample_content_handler");
	});

	it("setup the template engine", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);

		expect(site_generator.templateEngine.id).toEqual("sample_template_engine");
	});

	it("setup the cache store", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);

		expect(site_generator.cacheStore.id).toEqual("sample_cache_store");
	});

	it("setup the renderer", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(site_generator, "setup");

		site_generator.setup(sample_config);
		expect(site_generator.setup).toHaveBeenCalledWith(sample_config);
	});

	it("setup each compiler", function(){
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.compilers).toEqual({".js": {"id": "sample_js_compiler"}, ".css": {"id": "sample_css_compiler"}});

	});

	it("setup each generator hook", function(){
		site_generator.generatorHooks = [];

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		site_generator.setup(sample_config);
		expect(site_generator.generatorHooks).toEqual([{ "id": "sample_hook" }]);
	});

});

describe("generate site", function() {

	it("clear cache before generation", function() {
		spyOn(site_generator, "clearCache");

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(site_generator.clearCache).toHaveBeenCalled();
	});

	it("collect all paths", function() {
		spyOn(site_generator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "collectPaths");

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(site_generator.collectPaths).toHaveBeenCalled();
	});

	it("render each path", function() {
		var sample_paths = ["path/test", "path/test1"];

		spyOn(site_generator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(site_generator, "renderEachPath");

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(site_generator.renderEachPath).toHaveBeenCalledWith(sample_paths, jasmine.any(Function));
	});

	it("build bundles", function() {
		var sample_paths = ["path/test", "path/test1"];

		spyOn(site_generator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(site_generator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(site_generator, "buildBundles");

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(site_generator.buildBundles).toHaveBeenCalled();
	});

	it("call generator hooks with completed flag set", function() {
		var sample_paths = ["path/test", "path/test1"];
		spyOn(site_generator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(site_generator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(site_generator, "buildBundles").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "runGeneratorHooks");

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(site_generator.runGeneratorHooks).toHaveBeenCalledWith(null, { finished: true }, spyCallback);
	});

	it("call the user provided callback", function() {
		var sample_paths = ["path/test", "path/test1"];
		spyOn(site_generator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(site_generator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(site_generator, "buildBundles").andCallFake(function(callback) {
			return callback();
		});

		spyOn(site_generator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		site_generator.generate(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("clear cache", function() {

	it("call to clear cache if blank state is set", function() {
		var spyClearCache = jasmine.createSpy();
		site_generator.cacheStore = { "clear": spyClearCache };

		site_generator.blankState = true;

		var spyCallback = jasmine.createSpy();
		site_generator.clearCache(spyCallback);

		expect(spyClearCache).toHaveBeenCalled();
	});

	it("proceed with callback if blank state is not set", function() {
		site_generator.blankState = false;

		var spyCallback = jasmine.createSpy();
		site_generator.clearCache(spyCallback);

		expect(spyCallback).toHaveBeenCalled();

	});

	it("call the callback after clearing cache", function() {
		var spyClearCache = jasmine.createSpy();
		spyClearCache.andCallFake(function(callback) {
			return callback();
		});
		site_generator.cacheStore = { "clear": spyClearCache };

		site_generator.blankState = true;

		var spyCallback = jasmine.createSpy();
		site_generator.clearCache(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});
});

describe("collect sections", function() {

	it("collect the sections from the templates", function(){
		var spyTemplates = jasmine.createSpy();
		site_generator.templates = {"getSections": spyTemplates};

		var spyCallback = jasmine.createSpy();
		site_generator.collectSections(spyCallback);

		expect(spyTemplates).toHaveBeenCalled();
	});

	it("collect the sections from the contents", function(){
		var spyTemplates = jasmine.createSpy();
		spyTemplates.andCallFake(function(callback){
			return callback([]);
		});
		site_generator.templates = {"getSections": spyTemplates};

		var spyContents = jasmine.createSpy();
		site_generator.contents = {"getSections": spyContents};

		var spyCallback = jasmine.createSpy();
		site_generator.collectSections(spyCallback);

		expect(spyContents).toHaveBeenCalled();
	});

	it("call the callback with the union of both template and content sections", function(){
		var spyTemplates = jasmine.createSpy();
		spyTemplates.andCallFake(function(callback){
			return callback(["about", "assets", "contact"]);
		});
		site_generator.templates = {"getSections": spyTemplates};

		var spyContents = jasmine.createSpy();
		spyContents.andCallFake(function(callback){
			return callback(["about", "contact", "blog", "other"]);
		});
		site_generator.contents = {"getSections": spyContents};

		var spyCallback = jasmine.createSpy();
		site_generator.collectSections(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["about", "assets", "contact", "blog", "other"]);
	});

});

describe("get static and compilable templates", function(){

	it("get the templates for the given section", function(){
		var spyGetTemplates = jasmine.createSpy();
		site_generator.templates = {"getTemplates": spyGetTemplates};

		var spyCallback = jasmine.createSpy();
		site_generator.getStaticAndCompilableTemplates("path/test", spyCallback);

		expect(spyGetTemplates).toHaveBeenCalled();
	});

	it("filter only the static and compilable templates", function(){
		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(path, callback){
			return callback(null, [{"full_path": "path/sub_dir/test.html", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/test.mustache", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/_layout.mustache", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/_header.mustache", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/image.png", "last_modified": new Date(2012, 6, 16)}
														]);
		});
		site_generator.templates = {"getTemplates": spyGetTemplates};
		site_generator.templateEngine = {"extension": ".mustache"};

		var spyCallback = jasmine.createSpy();
		site_generator.getStaticAndCompilableTemplates("path/sub_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/sub_dir/test.html", "path/sub_dir/image.png"]);
	});

	it("change the extension name of compilable templates", function(){
		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(path, callback){
			return callback(null, [{"full_path": "path/sub_dir/test.html", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/test.mustache", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/_layout.mustache", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/script.coffee", "last_modified": new Date(2012, 6, 16)},
														 {"full_path": "path/sub_dir/styles.less", "last_modified": new Date(2012, 6, 16)}
											]);
		});
		site_generator.templates = {"getTemplates": spyGetTemplates};
		site_generator.templateEngine = {"extension": ".mustache"};

		site_generator.compilers = {
																".js": {"input_extensions": [".coffee"]},
																".css": {"input_extensions": [".less"]}
															 };

		var spyCallback = jasmine.createSpy();
		site_generator.getStaticAndCompilableTemplates("path/sub_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/sub_dir/test.html", "path/sub_dir/script.js", "path/sub_dir/styles.css"]);

	});

});

describe("collect paths for section", function() {

	it("collect content paths for the section", function() {
		var spyGetContents = jasmine.createSpy();
		site_generator.contents = { "getContentPaths": spyGetContents };

		var spyCallback = jasmine.createSpy();
		site_generator.collectPathsForSection("path/test", spyCallback);

		expect(spyGetContents).toHaveBeenCalled();
	});

	it("collect template paths for section", function(){
		var spyGetContents = jasmine.createSpy();
		spyGetContents.andCallFake(function(section, callback){
			return callback(null, []);
		});
		site_generator.contents = { "getContentPaths": spyGetContents };

		spyOn(site_generator, "getStaticAndCompilableTemplates");

		var spyCallback = jasmine.createSpy();
		site_generator.collectPathsForSection("path/test", spyCallback);

		expect(site_generator.getStaticAndCompilableTemplates).toHaveBeenCalled();
	});

	it("call the callback with both contents and templates paths", function(){
		var spyGetContents = jasmine.createSpy();
		spyGetContents.andCallFake(function(section, callback){
			return callback(null, ["path/test/page1", "path/test/page2"]);
		});
		site_generator.contents = { "getContentPaths": spyGetContents };

		spyOn(site_generator, "getStaticAndCompilableTemplates").andCallFake(function(section, callback){
			return callback(null, ["path/test/image.jpg", "path/test/styles.css"]);
		});

		var spyCallback = jasmine.createSpy();
		site_generator.collectPathsForSection("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/test/page1", "path/test/page2", "path/test/image.jpg", "path/test/styles.css"]);
	});

});

describe("collect paths", function() {

	it("collect sections", function() {
		spyOn(site_generator, "collectSections");

		site_generator.clearCache = false;

		var spyCallback = jasmine.createSpy();
		site_generator.collectPaths(spyCallback);

		expect(site_generator.collectSections).toHaveBeenCalled();
	});

	it("collect paths for each section", function() {
		spyOn(site_generator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(site_generator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ ]);
		});

		var spyCallback = jasmine.createSpy();
		site_generator.collectPaths(spyCallback);

		expect(site_generator.collectPathsForSection.callCount).toEqual(2);
	});

	it("don't traverse sections to be skipped", function() {
		site_generator.pathsToSkip = [ "/path/sub*" ];

		spyOn(site_generator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "/path/sub", "/path/sub/subsub", "/path/other" ]);
		});

		spyOn(site_generator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ ]);
		});

		var spyCallback = jasmine.createSpy();
		site_generator.collectPaths(spyCallback);

		expect(site_generator.collectPathsForSection.callCount).toEqual(1);
	});

	it("call the callback with collected paths", function() {
		spyOn(site_generator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(site_generator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ "path/test1", "path/test2" ]);
		});

		var spyCallback = jasmine.createSpy();
		site_generator.collectPaths(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([ "path/test1", "path/test2", "path/test1", "path/test2" ]);
	});

	it("remove paths to be skipped from the collected paths", function() {
		site_generator.pathsToSkip = [ "path/test1", "path/test3" ];

		spyOn(site_generator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(site_generator, "collectPathsForSection").andCallFake(function(section, callback) {
			if (section === "path1") {
				return callback(null, [ "path/test1", "path/test2" ]);
			} else {
				return callback(null, [ "path/test3", "path/test4" ]);
			}
		});

		var spyCallback = jasmine.createSpy();
		site_generator.collectPaths(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([ "path/test2", "path/test4" ]);
	});

});

describe("render path", function() {

	it("get the last updated date from the cache", function() {
		var spyCacheStat = jasmine.createSpy();
		site_generator.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".html");

		var spyCallback = jasmine.createSpy();
		site_generator.renderPath("path/test.html", spyCallback);

		expect(spyCacheStat).toHaveBeenCalledWith("path/test", ".html", {}, jasmine.any(Function));
	});

	it("call to render method of renderer", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});
		site_generator.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render");

		var spyCallback = jasmine.createSpy();
		site_generator.renderPath("path/test.html", spyCallback);

		expect(page_renderer.render).toHaveBeenCalledWith("path/test", ".html", new Date(2012, 6, 27), {}, jasmine.any(Function));
	});

	it("update the cache with the modified output", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});

		var spyCacheUpdate = jasmine.createSpy();

		site_generator.cacheStore = { "stat": spyCacheStat, "update": spyCacheUpdate };

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(request_path, file_extension, cache_last_updated, options, callback){
			return callback({"modified": true, "body": "rendered output", "options": {} });
		});

		var spyCallback = jasmine.createSpy();
		site_generator.renderPath("path/test.html", spyCallback);

		expect(spyCacheUpdate).toHaveBeenCalledWith("path/test", ".html", { "body": "rendered output", "modified": true, "options": {} }, {}, jasmine.any(Function));
	});

	it("call the callback directly if output is not modified", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});
		site_generator.cacheStore = { "stat": spyCacheStat };

		spyOn(path_utils, "getExtension").andReturn(".html");

		spyOn(page_renderer, "render").andCallFake(function(request_path, file_extension, cache_last_updated, options, callback) {
			return callback({ "modified": false, "body": null });
		});

		var spyCallback = jasmine.createSpy();
		site_generator.renderPath("path/test.html", spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("render each path", function() {

	it("call render path for each given path", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(site_generator, "renderPath").andCallFake(function(section, callback) {
			return callback();
		});

		spyOn(site_generator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		site_generator.renderEachPath(sample_paths, spyCallback);

		expect(site_generator.renderPath.callCount).toEqual(2);
	});

	it("call the generator hooks after rendering each path", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(site_generator, "renderPath").andCallFake(function(path, callback) {
			return callback(path);
		});

		spyOn(site_generator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		site_generator.renderEachPath(sample_paths, spyCallback);

		expect(site_generator.runGeneratorHooks.callCount).toEqual(2);
	});

	it("call the callback after rendering all paths", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(site_generator, "renderPath").andCallFake(function(path, callback) {
			return callback(path);
		});

		spyOn(site_generator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		site_generator.renderEachPath(sample_paths, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("build bundles", function() {

	it("pass the user provided complete callback when touching bundles", function() {
		spyOn(asset_bundler, "touchBundles");

		var spyCallback = jasmine.createSpy();
		site_generator.buildBundles(spyCallback);

		expect(asset_bundler.touchBundles).toHaveBeenCalledWith(jasmine.any(Function), spyCallback);
	});

});

describe("run generator hooks", function() {

	it("call each generator hook with given path", function() {
		var spyGeneratorHook = jasmine.createSpy();
		var spyGeneratorHook2 = jasmine.createSpy();
		site_generator.generatorHooks = [ { "run": spyGeneratorHook }, { "run": spyGeneratorHook2 } ];

		var spyCallback = jasmine.createSpy();
		site_generator.runGeneratorHooks("path/test", false, spyCallback);

		expect(spyGeneratorHook2).toHaveBeenCalledWith("path/test", false, jasmine.any(Function));
	});

	it("call the callback after running each generator hook", function() {
		var spyGeneratorHook = jasmine.createSpy();
		spyGeneratorHook.andCallFake(function(path, completed, callback) {
			return callback();
		});
		site_generator.generatorHooks = [ { "run": spyGeneratorHook }, { "run": spyGeneratorHook } ];

		var spyCallback = jasmine.createSpy();
		site_generator.runGeneratorHooks("path/test", false, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});
});
