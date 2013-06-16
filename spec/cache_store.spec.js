var Fs = require("fs");
var Path = require("path");

var CacheStore = require("../lib/cache_store.js");

var ModuleUtils = require("../lib/utils/module_utils.js");

describe("setup", function(){

	it("setup the templates handler", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		CacheStore.setup({ "plugins": { "template_handler": "sample_template_handler" } });

		expect(CacheStore.templates.id).toEqual("sample_template_handler");
	});

	it("setup the contents handler", function() {
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		CacheStore.setup({ "plugins": { "content_handler": "sample_content_handler" } });

		expect(CacheStore.contents.id).toEqual("sample_content_handler");
	});

	it("set the output directory", function(){
		spyOn(ModuleUtils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		CacheStore.setup({ "output_dir": "output_dir", "plugins": {} });
		expect(CacheStore.outputDir).toEqual("output_dir");
	});

});

describe("stat", function(){

	it("call the callback with an error if request basename is null", function(){
		var spyCallback = jasmine.createSpy();
		CacheStore.stat(null, ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("request basename can't be null");
	});

	it("call the callback with the file's modified time", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		CacheStore.outputDir = "output_dir";

		spyOn(Fs, "stat").andCallFake(function(file_path, callback){
			if(file_path === Path.join("output_dir/path/test.html")){
				return callback(null, {"mtime": new Date(2012, 6, 21), "size": 527});
			}
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.stat("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "mtime": new Date(2012, 6, 21), "size": 527 });
	});

	it("call the callback with an error if file doesn't exist", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		CacheStore.outputDir = "output_dir";

		spyOn(Fs, "stat").andCallFake(function(file_path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.stat("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error");

	});

});

describe("get", function(){

	it("call the callback with an error if request basename is null", function(){
		var spyCallback = jasmine.createSpy();
		CacheStore.get(null, ".html", { "options": {} }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("request basename can't be null");
	});

	it("correct the given path if it's a section", function() {
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(true);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		CacheStore.outputDir = "output_dir";

		spyOn(Fs, "stat");

		var spyCallback = jasmine.createSpy();
		CacheStore.get("path/test", ".html", { "options": {} }, {}, spyCallback);

		expect(Fs.stat).toHaveBeenCalledWith(Path.join("output_dir/path/test/index.html"), jasmine.any(Function));
	});

	it("read the file with the correct encoding", function() {
		var cached_content = new Buffer("cached content");

		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		CacheStore.outputDir = "output_dir";

		spyOn(Fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(2012, 6, 21), "size": 567 });
		});

		spyOn(Fs, "readFile");

		var spyCallback = jasmine.createSpy();
		CacheStore.get("path/test", ".html", { "options": { "header": { "custom-key": "custom-value" } } }, {}, spyCallback);

		expect(Fs.readFile).toHaveBeenCalledWith(Path.join("output_dir/path/test.html"), "utf8", jasmine.any(Function));
	});

	it("call the callback with file content", function(){

		var cached_content = new Buffer("cached content");

		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(1342800000000), "size": 567 });
		});

		spyOn(Fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback(null, cached_content);
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.get("path/test", ".html", { "options": { "header": { "custom-key": "custom-value" } } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": cached_content, "options": { "header": { "Content-Length": 14, "ETag": "\"567-1342800000000\"", "Last-Modified": new Date(1342800000000).toUTCString(), "custom-key": "custom-value" } } });

	});

	it("call the callback with the error if there's an error reading the file", function(){

		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(1342809000000), "size": 567 });
		});

		spyOn(Fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.get("path/test", ".html", { "options": { "header": {} } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", { "body": null, "options": { "header": { "Content-Length": 0, "ETag": "\"567-1342809000000\"", "Last-Modified": new Date(1342809000000).toUTCString() } } });

	});

});

describe("update", function(){

	it("call the callback with an error if request basename is null", function(){
		var spyCallback = jasmine.createSpy();
		CacheStore.update(null, ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("request basename can't be null");
	});

	it("create missing directories", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return false }});
		});

		spyOn(Fs, "mkdir").andCallFake(function(dirPath, callback){
			return callback(null);
		});

		spyOn(Fs, "writeFile");

		CacheStore.outputDir = "output_dir";

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(Fs.mkdir.callCount).toEqual(3);

	});

	it("write file to the correct path", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(Fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(Fs.writeFile).toHaveBeenCalledWith(Path.join("output_dir/path/subdir/test.html"), "test", "utf8", jasmine.any(Function));
	});

	it("correct the given path if it's a section", function() {
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(true);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		CacheStore.outputDir = "output_dir";

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(Fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(Fs.writeFile).toHaveBeenCalledWith(Path.join("output_dir/path/subdir/test/index.html"), "test", "utf8", jasmine.any(Function));
	});

	it("use binary encoding for image files", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(Fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".jpg", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(Fs.writeFile).toHaveBeenCalledWith(Path.join("output_dir/path/subdir/test.jpg"), "test", "binary", jasmine.any(Function));
	});

	it("use utf8 encoding for text files", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(Fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".js", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(Fs.writeFile).toHaveBeenCalledWith(Path.join("output_dir/path/subdir/test.js"), "test", "utf8", jasmine.any(Function));
	});

	it("call the callback with the error if there's an error in writing the file", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(Fs, "writeFile").andCallFake(function(file_path, body, encoding, callback){
			return callback("error");
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error");
	});

	it("call the callback a valid cache object", function(){
		var spyIsSection = jasmine.createSpy();
		spyIsSection.andReturn(false);

		CacheStore.templates = { "isSection": spyIsSection };
		CacheStore.contents = { "isSection": spyIsSection };

		spyOn(Fs, "stat").andCallFake(function(dirPath, callback) {
			return callback(null, { "isDirectory": function(){ return true } });
		});

		spyOn(Fs, "writeFile").andCallFake(function(file_path, body, encoding, callback) {
			return callback(null);
		});

		spyOn(CacheStore, "stat").andCallFake(function(file_path, file_ext, options, callback) {
			return callback(null, {"mtime": new Date(1342809000000), "size": 527});
		});

		var spyCallback = jasmine.createSpy();
		CacheStore.update("path/subdir/test", ".html", { "body": "test", "options": { "header": { "Content-Type": "text/css", "Cache-Control": "public, max-age=0" } } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "test", "options": { "header": { "Content-Type": "text/css", "Cache-Control": "public, max-age=0", "Content-Length": 4, "ETag": "\"527-1342809000000\"", "Last-Modified": new Date(1342809000000).toUTCString() } } });
	});

});

describe("clear", function() {

	it("remove all files (except hidden files)", function(done) {
		CacheStore.outputDir = Path.join(__dirname, "sample_directory");

		spyOn(Fs, "rmdir").andCallFake(function(path, callback) {
			return callback();
		});

		spyOn(Fs, "unlink").andCallFake(function(path, callback) {
			return callback();
		});

		var cb = function() {
			expect(Fs.unlink.callCount).toEqual(3);
			done();
		};

		CacheStore.clear(cb);
	});

	it("remove all directories (except hidden directories)", function(done) {
		CacheStore.outputDir = Path.join(__dirname, "sample_directory");

		spyOn(Fs, "rmdir").andCallFake(function(path, callback) {
			return callback();
		});

		spyOn(Fs, "unlink").andCallFake(function(path, callback) {
			return callback();
		});

		var cb = function() {
			expect(Fs.rmdir.callCount).toEqual(1);
			done();
		};

		CacheStore.clear(cb);
	});

});
