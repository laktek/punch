var renderer = require("../lib/page_renderer.js");

var module_utils = require("../lib/utils/module_utils.js");

describe("setup", function() {

	var sample_config = {
		plugins: {
			template_handler: "sample_template_handler",
			content_handler: "sample_content_handler",
			template_engine: "sample_template_engine",
			compilers: {
				".js": "sample_js_compiler",
				".css": "sample_css_compiler"
			},
			helpers: {
				"numbers_helper": "sample_number_helper",
				"image_helper": "sample_image_helper"
			}
		}
	};

	it("setup the templates handler", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		renderer.setup(sample_config);

		expect(renderer.templates.id).toEqual("sample_template_handler");
	});

	it("setup the contents handler", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		renderer.setup(sample_config);

		expect(renderer.contents.id).toEqual("sample_content_handler");
	});

	it("setup the template engine", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		renderer.setup(sample_config);

		expect(renderer.templateEngine.id).toEqual("sample_template_engine");
	});

	it("setup each compiler", function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config) {
			return { "id": id };
		});

		renderer.setup(sample_config);

		expect(renderer.compilers).toEqual({ ".js": { "id": "sample_js_compiler" }, ".css": { "id": "sample_css_compiler" } });
	});

	it("setup each helper", function(){
		renderer.helpers = [];

		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});

		renderer.setup(sample_config);
		expect(renderer.helpers).toEqual([{"id": "sample_number_helper"}, {"id": "sample_image_helper"}]);
	});

});

describe("handle rendering request", function() {

	it("point the top level request path to index files", function() {
		spyOn(renderer, "serveStatic");

		renderer.templates = { "isSection": function() { return true } };
		renderer.contents = { "isSection": function() { return true } };

		var spyCallback = jasmine.createSpy();
		renderer.render("path/test", ".html", null, {}, spyCallback);

		expect(renderer.serveStatic.mostRecentCall.args[0]).toEqual("path/test/index.html");
	});

	it("serve the static file if it exists", function() {

		var spyCallback = jasmine.createSpy();

		renderer.templates = { "isSection": function() { return false } };
		renderer.contents = { "isSection": function() { return false } };

		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback) {
			return callback(null, { "body": "static output", "modified": true });
		});

		renderer.render("path/test.html", ".html", null, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "body": "static output", "modified": true });
	});

	it("compile the template in given path for the given content type", function() {

		var spyCallback = jasmine.createSpy();

		renderer.templates = { "isSection": function() { return false } };
		renderer.contents = { "isSection": function() { return false } };

		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback) {
			return callback({ "ignore": true, "message": "error" }, null);
		});

		spyOn(renderer, "compileTo").andCallFake(function(path, content_type, last_modified, callback) {
			return callback(null, { "body": "compiled output", "modified": true });
		});

		renderer.render("path/test.css", ".css", null, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "body": "compiled output", "modified": true });
	});

	it("pass the error if compiling a template fails", function() {

		var spyCallback = jasmine.createSpy();

		renderer.templates = { "isSection": function() { return false } };
		renderer.contents = { "isSection": function() { return false } };

		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback) {
			return callback({ "ignore": true, "message": "error" }, null);
		});

		spyOn(renderer, "compileTo").andCallFake(function(path, content_type, last_modified, callback) {
			return callback({ "ignore": false, "message": "Compile error" }, null);
		});

		renderer.render("path/test.css", ".css", null, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "body": null, "modified": true, "options": { "status": 500, "log": { "message": "[Error] Compile error" } } });
	});

	it("render the content matching the given path", function() {

		var spyCallback = jasmine.createSpy();

		renderer.templates = { "isSection": function() { return false } };
		renderer.contents = { "isSection": function() { return false } };

		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback) {
			return callback({ "ignore": true, "message": "error" }, null);
		});

		spyOn(renderer, "compileTo").andCallFake(function(path, content_type, last_modified, callback) {
			return callback({ "ignore": true, "message": "error" }, null);
		});

		spyOn(renderer, "renderContent").andCallFake(function(path, content_type, last_modified, options, callback) {
			return callback(null, { "body": "rendered output", "modified": true });
		});

		renderer.render("path/test.css", ".css", null, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "body": "rendered output", "modified": true });
	});

	it("pass an error if output object is invalid", function() {

		var spyCallback = jasmine.createSpy();

		renderer.templates = { "isSection": function() { return false } };
		renderer.contents = { "isSection": function() { return false } };

		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback) {
			return callback(null, {});
		});

		renderer.render("path/test.css", ".css", null, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "body": null, "modified": true, "options": { "status": 500, "log": { "message": "[Error] Response should contain body and modified properties" } } });
	});

});

describe("serving static file", function(){

	it("get the template details for the given full path", function() {
		var spyGetTemplate = jasmine.createSpy();

		renderer.templates = {
			"getTemplate": spyGetTemplate
		};

		renderer.serveStatic("path/test.jpg", null, function() { });

		expect(spyGetTemplate.mostRecentCall.args[0]).toEqual("path/test.jpg");
	});

	it("call the callback with the template output if template is modified", function() {
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback) {
			callback(null, { "last_modified": new Date(2012, 6, 13) });
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback(null, "static output");
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate,
			"readTemplate": spyReadTemplate
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 10);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "static output", "modified": true });
	});

	it("call the callback without the template output if template is not modified", function() {
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback) {
			callback(null, { "last_modified": new Date(2012, 6, 13) });
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback(null, "static output");
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate,
			"readTemplate": spyReadTemplate
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 15);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": null, "modified": false });
	});

	it("call the callback with the error if an error occurrs in getting the template", function() {
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback) {
			callback("error", null);
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 15);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "ignore": true, "message": "error" }, null);
	});

});

describe("compile template", function() {

	it("get the matching templates by base path", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".min.js": { "compile": spyCompile }
		};

		var spyGetTemplates = jasmine.createSpy();

		renderer.templates = {
			"getTemplates": spyGetTemplates
		};

		renderer.compileTo("path/test.min.js", ".js", null, function() { });

		expect(spyGetTemplates.mostRecentCall.args[0]).toEqual("path/test");
	});

	it("read the template if its modified", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"] }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback(null, [ { "full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
											 { "full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 13) }
										 ]);
		});

		var spyReadTemplate = jasmine.createSpy();

		renderer.templates = {
			"getTemplates": spyGetTemplates,
			"readTemplate": spyReadTemplate
		};

		renderer.compileTo("path/test.js", ".js", null, function() { });

		expect(spyReadTemplate.mostRecentCall.args[0]).toEqual("path/test.coffee");
	});

	it("call compile with the template output and full template path", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"] }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback(null, [{ "full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
											{ "full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 13) }
										 ]);
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback(null, "template output");
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates,
			"readTemplate": spyReadTemplate,
			"templateDir": "templates"
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", null, spyCallback);

		expect(spyCompile).toHaveBeenCalledWith("template output", "templates/path/test.coffee", jasmine.any(Function));
	});

	it("call the callback without an output if force compile option is disabled and template is not modified", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"], "force_compile": false }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback(null, [{ "full_path": "path/test.html", "last_modified": new Date(2012, 6, 10) },
											{ "full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 10) }
										 ]);
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback(null, "template output");
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates,
			"readTemplate": spyReadTemplate
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", new Date(2012, 6, 13), spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": null, "modified": false });

	});

	it("call compile if force compile option is enabled and template is not modified", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".css": { "compile": spyCompile, "input_extensions": [".less"], "force_compile": true }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback(null, [{ "full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
											{ "full_path": "path/test.less", "last_modified": new Date(2012, 6, 13) }
										 ]);
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback(null, "template output");
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates,
			"readTemplate": spyReadTemplate,
			"templateDir": "templates"
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.css", ".css", new Date(2012, 11, 25), spyCallback);

		expect(spyCompile).toHaveBeenCalledWith("template output", "templates/path/test.less", jasmine.any(Function));
	});

	it("call the callback with an error if no compiler found for the given content type", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".css": { "compile": spyCompile, "input_extensions": [".less"] }
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", new Date(2012, 6, 13), spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "ignore": true, "message": "no compiler found" }, null);
	});

	it("call the callback with an error if no matching template is found", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"] }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback("template not found", null);
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", new Date(2012, 6, 13), spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "ignore": true, "message": "template not found" }, null);
	});

	it("call the callback with an error if non of the matched templates can be compiled", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"] }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			return callback(null, [{ "full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
														 { "full_path": "path/test.css", "last_modified": new Date(2012, 6, 13) }
														]);
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", new Date(2012, 6, 13), spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "ignore": true, "message": "no compilable template found" }, null);
	});

	it("call the callback with an error if it fails to read the template", function() {
		var spyCompile = jasmine.createSpy();

		renderer.compilers = {
			".js": { "compile": spyCompile, "input_extensions": [".coffee"] }
		};

		var spyGetTemplates = jasmine.createSpy();
		spyGetTemplates.andCallFake(function(basepath, callback) {
			callback(null, [{ "full_path": "path/test.html", "last_modified": new Date(2012, 6, 10) },
											{ "full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 10) }
										 ]);
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback) {
			callback("template read error", null);
		});

		renderer.templates = {
			"getTemplates": spyGetTemplates,
			"readTemplate": spyReadTemplate
		};

		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", ".js", null, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith({ "ignore": false, "message": "template read error" }, null);
	});

});

describe("render content", function(){

	it("creates a new template engine instance", function() {
		var spyEvenListener = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return {"on": spyEvenListener};
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		spyOn(renderer, "getHelpers");

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(renderer.createTemplateEngine).toHaveBeenCalledWith({ "lastRender": new Date(2012, 6, 18) });
	});

	it("listen to render complete event", function() {
		var spyEvenListener = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spyEvenListener.argsForCall[0][0]).toEqual("renderComplete");
	});

	it("listen to render canceled event", function() {
		var spyEvenListener = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spyEvenListener.argsForCall[1][0]).toEqual("renderCanceled");
	});

	it("fetch and set contents for the given path", function() {
		var spyEvenListener = jasmine.createSpy();
		var spySetContent = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener, "setContent": spySetContent };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		spyNegotiateContent.andCallFake(function(path, content_type, options, callback) {
			return callback(null, { "key": "value" }, new Date(2012, 6, 17), {});
		});

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spySetContent).toHaveBeenCalledWith({ "key": "value" }, new Date(2012, 6, 17));
	});

	it("cancel rendering if there's an error fetching content for the given path", function(){

		var spyEvenListener = jasmine.createSpy();
		var spyCancelRender = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function(){
			return {"on": spyEvenListener, "cancelRender": spyCancelRender};
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		spyNegotiateContent.andCallFake(function(path, content_type, options, callback){
			return callback("content error", null, {});
		});

		renderer.contents = {"negotiateContent": spyNegotiateContent};
		renderer.templates = {"negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials};

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spyCancelRender).toHaveBeenCalledWith("content error");
	});

	it("fetch and set templates for the given path", function() {

		var spyEvenListener = jasmine.createSpy();
		var spySetTemplate = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener, "setTemplate": spySetTemplate };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		spyNegotiateTemplate.andCallFake(function(path, output_extension, template_extension, options, callback) {
			return callback(null, "template output", new Date(2012, 6, 17), {});
		});

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spySetTemplate).toHaveBeenCalledWith("template output", new Date(2012, 6, 17));
	});

	it("cancel rendering if there's an error fetching templates for the given path", function() {
		var spyEvenListener = jasmine.createSpy();
		var spyCancelRender = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener, "cancelRender": spyCancelRender };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		spyNegotiateTemplate.andCallFake(function(path, output_extension, template_extension, options, callback) {
			return callback("template error", null, {});
		});

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spyCancelRender).toHaveBeenCalledWith("template error");
	});

	it("fetch and set partials for the given path", function() {
		var spyEvenListener = jasmine.createSpy();
		var spySetPartials = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener, "setPartials": spySetPartials };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		spyOn(renderer, "getHelpers");

		spyGetPartials.andCallFake(function(path, extension, options, callback) {
			return callback(null, { "partial": "partial output" }, new Date(2012, 6, 17), {});
		});

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spySetPartials).toHaveBeenCalledWith({ "partial": "partial output" }, new Date(2012, 6, 17));
	});

	it("fetch and set helpers for the given path", function() {
		var spyEvenListener = jasmine.createSpy();
		var spySetHelpers = jasmine.createSpy();

		spyOn(renderer, "createTemplateEngine").andCallFake(function() {
			return { "on": spyEvenListener, "setHelpers": spySetHelpers };
		});

		var spyNegotiateContent = jasmine.createSpy();
		var spyNegotiateTemplate = jasmine.createSpy();
		var spyGetPartials = jasmine.createSpy();

		renderer.contents = { "negotiateContent": spyNegotiateContent };
		renderer.templates = { "negotiateTemplate": spyNegotiateTemplate, "getPartials": spyGetPartials };

		var spyHelperObj = jasmine.createSpy();
		var spyHelperOptions = jasmine.createSpy();
		spyOn(renderer, "getHelpers").andCallFake(function(basepath, extension, options, callback) {
			return callback(null, spyHelperObj, spyHelperOptions, new Date(2012, 7, 25));
		});

		var spyCallback = jasmine.createSpy();
		renderer.renderContent("path/test.html", ".html", new Date(2012, 6, 18), {}, spyCallback);

		expect(spySetHelpers).toHaveBeenCalledWith(spyHelperObj, new Date(2012, 7, 25));
	});

});

describe("get helpers", function() {

	it("call the helper with all given arguments", function(){
		var spyHelperGet = jasmine.createSpy();

		renderer.helpers = [{ "get": spyHelperGet }];

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		renderer.getHelpers("path/test", "html", spyOptions, spyCallback);

		expect(spyHelperGet).toHaveBeenCalledWith("path/test", "html", spyOptions, jasmine.any(Function));
	});

	it("call the callback with all content collected by helpers", function(){
		var spyHelperGet1 = jasmine.createSpy();
		spyHelperGet1.andCallFake(function(path, content_type, options, callback){
			return callback(null, { "tag": { "tag_helper1": "value" }, "block": { "block_helper1": "value"} }, { "opt1": "value" }, new Date(2012, 7, 25));
		});

		var spyHelperGet2 = jasmine.createSpy();
		spyHelperGet2.andCallFake(function(path, content_type, options, callback){
			return callback(null, { "tag": { "tag_helper2": "value" }, "block": { "block_helper2": "value"} }, { "opt2": "value" }, new Date(2012, 7, 27));
		});

		renderer.helpers = [{ "get": spyHelperGet1 }, { "get": spyHelperGet2 }];

		var spyCallback = jasmine.createSpy();
		var spyOptions = jasmine.createSpy();
		renderer.getHelpers("path/test", "html", spyOptions, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "tag": { "tag_helper1": "value", "tag_helper2": "value" }, "block": { "block_helper1": "value", "block_helper2": "value" } }, { "opt1": "value", "opt2": "value" }, new Date(2012, 7, 27));
	});

});
