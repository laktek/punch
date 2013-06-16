var SiteGenerator = require("../lib/site_generator");

var PageRenderer = require("../lib/page_renderer");
var AssetBundler = require("../lib/asset_bundler");
var ModuleUtils = require("../lib/utils/module_utils");
var PathUtils = require("../lib/utils/path_utils");

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
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.blankState).toEqual(true);
	});

	it("set the paths to skip", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.pathsToSkip).toEqual([ "path/ignore/page1", "path/ignore/page1" ]);
	});

	it("setup the templates handler", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.templates.id).toEqual("sample_template_handler");
	});

	it("setup the contents handler", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.contents.id).toEqual("sample_content_handler");
	});

	it("setup the template engine", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);

		expect(SiteGenerator.templateEngine.id).toEqual("sample_template_engine");
	});

	it("setup the cache store", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);

		expect(SiteGenerator.cacheStore.id).toEqual("sample_cache_store");
	});

	it("setup the renderer", function(){
		var sample_config = {"plugins": {"cache_store": "./sample_cache_store" }};

		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {};
		});

		spyOn(SiteGenerator, "setup");

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.setup).toHaveBeenCalledWith(sample_config);
	});

	it("setup each compiler", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.compilers).toEqual({".js": {"id": "sample_js_compiler"}, ".css": {"id": "sample_css_compiler"}});

	});

	it("setup each generator hook", function(){
		SiteGenerator.generatorHooks = [];

		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		SiteGenerator.setup(sample_config);
		expect(SiteGenerator.generatorHooks).toEqual([{ "id": "sample_hook" }]);
	});

});

describe("generate site", function() {

	it("clear cache before generation", function() {
		spyOn(SiteGenerator, "clearCache");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(SiteGenerator.clearCache).toHaveBeenCalled();
	});

	it("collect all paths", function() {
		spyOn(SiteGenerator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "collectPaths");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(SiteGenerator.collectPaths).toHaveBeenCalled();
	});

	it("render each path", function() {
		var sample_paths = ["path/test", "path/test1"];

		spyOn(SiteGenerator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(SiteGenerator, "renderEachPath");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(SiteGenerator.renderEachPath).toHaveBeenCalledWith(sample_paths, jasmine.any(Function));
	});

	it("build bundles", function() {
		var sample_paths = ["path/test", "path/test1"];

		spyOn(SiteGenerator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(SiteGenerator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(SiteGenerator, "buildBundles");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(SiteGenerator.buildBundles).toHaveBeenCalled();
	});

	it("call generator hooks with completed flag set", function() {
		var sample_paths = ["path/test", "path/test1"];
		spyOn(SiteGenerator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(SiteGenerator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(SiteGenerator, "buildBundles").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "runGeneratorHooks");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(SiteGenerator.runGeneratorHooks).toHaveBeenCalledWith(null, { finished: true }, spyCallback);
	});

	it("call the user provided callback", function() {
		var sample_paths = ["path/test", "path/test1"];
		spyOn(SiteGenerator, "clearCache").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "collectPaths").andCallFake(function(callback) {
			return callback(sample_paths);
		});

		spyOn(SiteGenerator, "renderEachPath").andCallFake(function(paths, callback) {
			return callback();
		});

		spyOn(SiteGenerator, "buildBundles").andCallFake(function(callback) {
			return callback();
		});

		spyOn(SiteGenerator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.generate(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("clear cache", function() {

	it("call to clear cache if blank state is set", function() {
		var spyClearCache = jasmine.createSpy();
		SiteGenerator.cacheStore = { "clear": spyClearCache };

		SiteGenerator.blankState = true;

		var spyCallback = jasmine.createSpy();
		SiteGenerator.clearCache(spyCallback);

		expect(spyClearCache).toHaveBeenCalled();
	});

	it("proceed with callback if blank state is not set", function() {
		SiteGenerator.blankState = false;

		var spyCallback = jasmine.createSpy();
		SiteGenerator.clearCache(spyCallback);

		expect(spyCallback).toHaveBeenCalled();

	});

	it("call the callback after clearing cache", function() {
		var spyClearCache = jasmine.createSpy();
		spyClearCache.andCallFake(function(callback) {
			return callback();
		});
		SiteGenerator.cacheStore = { "clear": spyClearCache };

		SiteGenerator.blankState = true;

		var spyCallback = jasmine.createSpy();
		SiteGenerator.clearCache(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});
});

describe("collect sections", function() {

	it("collect the sections from the templates", function(){
		var spyTemplates = jasmine.createSpy();
		SiteGenerator.templates = {"getSections": spyTemplates};

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectSections(spyCallback);

		expect(spyTemplates).toHaveBeenCalled();
	});

	it("collect the sections from the contents", function(){
		var spyTemplates = jasmine.createSpy();
		spyTemplates.andCallFake(function(callback){
			return callback([]);
		});
		SiteGenerator.templates = {"getSections": spyTemplates};

		var spyContents = jasmine.createSpy();
		SiteGenerator.contents = {"getSections": spyContents};

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectSections(spyCallback);

		expect(spyContents).toHaveBeenCalled();
	});

	it("call the callback with the union of both template and content sections", function(){
		var spyTemplates = jasmine.createSpy();
		spyTemplates.andCallFake(function(callback){
			return callback(["about", "assets", "contact"]);
		});
		SiteGenerator.templates = {"getSections": spyTemplates};

		var spyContents = jasmine.createSpy();
		spyContents.andCallFake(function(callback){
			return callback(["about", "contact", "blog", "other"]);
		});
		SiteGenerator.contents = {"getSections": spyContents};

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectSections(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["about", "assets", "contact", "blog", "other"]);
	});

});

describe("get static and compilable templates", function(){

	it("get the templates for the given section", function(){
		var spyGetTemplates = jasmine.createSpy();
		SiteGenerator.templates = {"getTemplates": spyGetTemplates};

		var spyCallback = jasmine.createSpy();
		SiteGenerator.getStaticAndCompilableTemplates("path/test", spyCallback);

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
		SiteGenerator.templates = {"getTemplates": spyGetTemplates};
		SiteGenerator.templateEngine = {"extension": ".mustache"};

		var spyCallback = jasmine.createSpy();
		SiteGenerator.getStaticAndCompilableTemplates("path/sub_dir", spyCallback);

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
		SiteGenerator.templates = {"getTemplates": spyGetTemplates};
		SiteGenerator.templateEngine = {"extension": ".mustache"};

		SiteGenerator.compilers = {
																".js": {"input_extensions": [".coffee"]},
																".css": {"input_extensions": [".less"]}
															 };

		var spyCallback = jasmine.createSpy();
		SiteGenerator.getStaticAndCompilableTemplates("path/sub_dir", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/sub_dir/test.html", "path/sub_dir/script.js", "path/sub_dir/styles.css"]);

	});

});

describe("collect paths for section", function() {

	it("collect content paths for the section", function() {
		var spyGetContents = jasmine.createSpy();
		SiteGenerator.contents = { "getContentPaths": spyGetContents };

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPathsForSection("path/test", spyCallback);

		expect(spyGetContents).toHaveBeenCalled();
	});

	it("collect template paths for section", function(){
		var spyGetContents = jasmine.createSpy();
		spyGetContents.andCallFake(function(section, callback){
			return callback(null, []);
		});
		SiteGenerator.contents = { "getContentPaths": spyGetContents };

		spyOn(SiteGenerator, "getStaticAndCompilableTemplates");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPathsForSection("path/test", spyCallback);

		expect(SiteGenerator.getStaticAndCompilableTemplates).toHaveBeenCalled();
	});

	it("call the callback with both contents and templates paths", function(){
		var spyGetContents = jasmine.createSpy();
		spyGetContents.andCallFake(function(section, callback){
			return callback(null, ["path/test/page1", "path/test/page2"]);
		});
		SiteGenerator.contents = { "getContentPaths": spyGetContents };

		spyOn(SiteGenerator, "getStaticAndCompilableTemplates").andCallFake(function(section, callback){
			return callback(null, ["path/test/image.jpg", "path/test/styles.css"]);
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPathsForSection("path/test", spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, ["path/test/page1", "path/test/page2", "path/test/image.jpg", "path/test/styles.css"]);
	});

});

describe("collect paths", function() {

	it("collect sections", function() {
		spyOn(SiteGenerator, "collectSections");

		SiteGenerator.clearCache = false;

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPaths(spyCallback);

		expect(SiteGenerator.collectSections).toHaveBeenCalled();
	});

	it("collect paths for each section", function() {
		spyOn(SiteGenerator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(SiteGenerator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ ]);
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPaths(spyCallback);

		expect(SiteGenerator.collectPathsForSection.callCount).toEqual(2);
	});

	it("don't traverse sections to be skipped", function() {
		SiteGenerator.pathsToSkip = [ "/path/sub*" ];

		spyOn(SiteGenerator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "/path/sub", "/path/sub/subsub", "/path/other" ]);
		});

		spyOn(SiteGenerator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ ]);
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPaths(spyCallback);

		expect(SiteGenerator.collectPathsForSection.callCount).toEqual(1);
	});

	it("call the callback with collected paths", function() {
		spyOn(SiteGenerator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(SiteGenerator, "collectPathsForSection").andCallFake(function(section, callback) {
			return callback(null, [ "path/test1", "path/test2" ]);
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPaths(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([ "path/test1", "path/test2", "path/test1", "path/test2" ]);
	});

	it("remove paths to be skipped from the collected paths", function() {
		SiteGenerator.pathsToSkip = [ "path/test1", "path/test3" ];

		spyOn(SiteGenerator, "collectSections").andCallFake(function(callback) {
			return callback(null, [ "path1", "path2" ]);
		});

		spyOn(SiteGenerator, "collectPathsForSection").andCallFake(function(section, callback) {
			if (section === "path1") {
				return callback(null, [ "path/test1", "path/test2" ]);
			} else {
				return callback(null, [ "path/test3", "path/test4" ]);
			}
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.collectPaths(spyCallback);

		expect(spyCallback).toHaveBeenCalledWith([ "path/test2", "path/test4" ]);
	});

});

describe("render path", function() {

	it("get the last updated date from the cache", function() {
		var spyCacheStat = jasmine.createSpy();
		SiteGenerator.cacheStore = { "stat": spyCacheStat };

		spyOn(PathUtils, "getExtension").andReturn(".html");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderPath("path/test.html", spyCallback);

		expect(spyCacheStat).toHaveBeenCalledWith("path/test", ".html", {}, jasmine.any(Function));
	});

	it("call to render method of renderer", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});
		SiteGenerator.cacheStore = { "stat": spyCacheStat };

		spyOn(PathUtils, "getExtension").andReturn(".html");

		spyOn(PageRenderer, "render");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderPath("path/test.html", spyCallback);

		expect(PageRenderer.render).toHaveBeenCalledWith("path/test", ".html", new Date(2012, 6, 27), {}, jasmine.any(Function));
	});

	it("update the cache with the modified output", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});

		var spyCacheUpdate = jasmine.createSpy();

		SiteGenerator.cacheStore = { "stat": spyCacheStat, "update": spyCacheUpdate };

		spyOn(PathUtils, "getExtension").andReturn(".html");

		spyOn(PageRenderer, "render").andCallFake(function(request_path, file_extension, cache_last_updated, options, callback){
			return callback({"modified": true, "body": "rendered output", "options": {} });
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderPath("path/test.html", spyCallback);

		expect(spyCacheUpdate).toHaveBeenCalledWith("path/test", ".html", { "body": "rendered output", "modified": true, "options": {} }, {}, jasmine.any(Function));
	});

	it("call the callback directly if output is not modified", function() {
		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(request_path, file_extension, options, callback) {
			return callback(null, { "mtime": new Date(2012, 6, 27) });
		});
		SiteGenerator.cacheStore = { "stat": spyCacheStat };

		spyOn(PathUtils, "getExtension").andReturn(".html");

		spyOn(PageRenderer, "render").andCallFake(function(request_path, file_extension, cache_last_updated, options, callback) {
			return callback({ "modified": false, "body": null });
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderPath("path/test.html", spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("render each path", function() {

	it("call render path for each given path", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(SiteGenerator, "renderPath").andCallFake(function(section, callback) {
			return callback();
		});

		spyOn(SiteGenerator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderEachPath(sample_paths, spyCallback);

		expect(SiteGenerator.renderPath.callCount).toEqual(2);
	});

	it("call the generator hooks after rendering each path", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(SiteGenerator, "renderPath").andCallFake(function(path, callback) {
			return callback(path);
		});

		spyOn(SiteGenerator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderEachPath(sample_paths, spyCallback);

		expect(SiteGenerator.runGeneratorHooks.callCount).toEqual(2);
	});

	it("call the callback after rendering all paths", function() {
		var sample_paths = [ "path/test1", "path/test2" ];

		spyOn(SiteGenerator, "renderPath").andCallFake(function(path, callback) {
			return callback(path);
		});

		spyOn(SiteGenerator, "runGeneratorHooks").andCallFake(function(path, completed, callback) {
			return callback();
		});

		var spyCallback = jasmine.createSpy();
		SiteGenerator.renderEachPath(sample_paths, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});

describe("build bundles", function() {

	it("pass the user provided complete callback when touching bundles", function() {
		spyOn(AssetBundler, "touchBundles");

		var spyCallback = jasmine.createSpy();
		SiteGenerator.buildBundles(spyCallback);

		expect(AssetBundler.touchBundles).toHaveBeenCalledWith(jasmine.any(Function), spyCallback);
	});

});

describe("run generator hooks", function() {

	it("call each generator hook with given path", function() {
		var spyGeneratorHook = jasmine.createSpy();
		var spyGeneratorHook2 = jasmine.createSpy();
		SiteGenerator.generatorHooks = [ { "run": spyGeneratorHook }, { "run": spyGeneratorHook2 } ];

		var spyCallback = jasmine.createSpy();
		SiteGenerator.runGeneratorHooks("path/test", false, spyCallback);

		expect(spyGeneratorHook2).toHaveBeenCalledWith("path/test", false, jasmine.any(Function));
	});

	it("call the callback after running each generator hook", function() {
		var spyGeneratorHook = jasmine.createSpy();
		spyGeneratorHook.andCallFake(function(path, completed, callback) {
			return callback();
		});
		SiteGenerator.generatorHooks = [ { "run": spyGeneratorHook }, { "run": spyGeneratorHook } ];

		var spyCallback = jasmine.createSpy();
		SiteGenerator.runGeneratorHooks("path/test", false, spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});
});
