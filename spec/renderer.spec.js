/*
* Should load registered renderers (mustache) and pre-processors (coffeeScript, SASS)

* Should receive name, content-type, last modified date, options object
* Proceed according to the content-type of the request.
	- if it a static file serve it from templates
	- if it is a pre-processor type, file process using the its pre-processor.
	- else:
		-- look for available content.
		-- look for a template file with the same name as content file.
		-- if not, look for a layout in the same path.
		-- if not, go one level up until it finds a layout 
		-- if no layout found throw an exception.
		-- finally, render the content with the correct template
	Note: on each case renderer should check the last modified date, if the contents hasn't change it should just say "not modified"

*/

var renderer = require("../lib/renderer.js");

describe("handle rendering request", function(){

	it("serve the static file if it exists", function(){

		var spyCallback = jasmine.createSpy();
		
		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback){
			return callback(null, "static output");	
		});

		renderer.render("path/test.html", "html", null, spyCallback, {});	

		expect(spyCallback).toHaveBeenCalledWith("static output");
	});

	it("compiles the template in given path for the given content type", function(){

		var spyCallback = jasmine.createSpy();
		
		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback){
			return callback("error", null);	
		});

		spyOn(renderer, "compileTo").andCallFake(function(path, content_type, last_modified, callback){
			return callback(null, "compiled output"); 	
		});

		renderer.render("path/test.css", "css", null, spyCallback, {});	
		
		expect(spyCallback).toHaveBeenCalledWith("compiled output");
	});

	it("renders the content matching the given path", function(){
	
		var spyCallback = jasmine.createSpy();
		
		spyOn(renderer, "serveStatic").andCallFake(function(path, last_modified, callback){
			return callback("error", null);	
		});

		spyOn(renderer, "compileTo").andCallFake(function(path, content_type, last_modified, callback){
			return callback("error", null); 	
		});

		spyOn(renderer, "renderContent").andCallFake(function(path, content_type, last_modified, callback){
			return callback(null, "rendered output" ); 	
		});

		renderer.render("path/test.css", "css", null, spyCallback, {});	
		
		expect(spyCallback).toHaveBeenCalledWith("rendered output");

	});

});

describe("serving static file", function(){

	it("get the template details for the given full path", function(){
		var spyGetTemplate = jasmine.createSpy();
		renderer.templates = {
			"getTemplate": spyGetTemplate	
		};

		renderer.serveStatic("path/test.jpg", null, function(){});	

		expect(spyGetTemplate.mostRecentCall.args[0]).toEqual("path/test.jpg");
	});	

	it("call the callback with the template output if template is modified", function(){
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback){
			callback(null, {"last_modified": new Date(2012, 6, 13)});
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback){
			callback(null, "static output");	
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate,
			"readTemplate": spyReadTemplate	
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 10);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"body": "static output", "modified": true});

	});

	it("call the callback without the template output if template is not modified", function(){
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback){
			callback(null, {"last_modified": new Date(2012, 6, 13)});
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback){
			callback(null, "static output");	
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate,
			"readTemplate": spyReadTemplate	
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 15);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"body": null, "modified": false});

	});

	it("call the callback with the error if an error occurrs in getting the template", function(){
		var spyGetTemplate = jasmine.createSpy();
		spyGetTemplate.andCallFake(function(path, callback){
			callback("error", null);
		});

		renderer.templates = {
			"getTemplate": spyGetTemplate
		};

		var spyCallback = jasmine.createSpy();

		var old_date = new Date(2012, 6, 15);
		renderer.serveStatic("path/test.jpg", old_date, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);
	
	});

});

describe("compile template", function(){

	it("get the compiler that can output to given content type", function(){

		var spyGetCompilerForOutputExt = jasmine.createSpy();

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};
		
		renderer.compileTo("path/test.js", "js", null, function(){});	

		expect(spyGetCompilerForOutputExt.mostRecentCall.args[0]).toEqual("js");
	});

	it("get the matching templates by base path", function(){
		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath	
		}
		
		renderer.compileTo("path/test.js", "js", null, function(){});	

		expect(spyGetTemplatesByBasePath.mostRecentCall.args[0]).toEqual("path/test");

	});

	it("read the template if its modified", function(){
		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {"input_extensions": [".coffee"]});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();
		spyGetTemplatesByBasePath.andCallFake(function(basepath, callback){
			callback(null, [{"full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
											{"full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 13) } 
										 ]);	
		});

		var spyReadTemplate = jasmine.createSpy();

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath,	
			"readTemplate": spyReadTemplate
		};
		
		console.log("template modified");
		renderer.compileTo("path/test.js", "js", null, function(){});	

		expect(spyReadTemplate.mostRecentCall.args[0]).toEqual("path/test.coffee");
	
	});

	it("call compile with template output and callback", function(){
		var spyCompile = jasmine.createSpy();

		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {"input_extensions": [".coffee"], "compile": spyCompile});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();
		spyGetTemplatesByBasePath.andCallFake(function(basepath, callback){
			callback(null, [{"full_path": "path/test.html", "last_modified": new Date(2012, 6, 13) },
											{"full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 13) } 
										 ]);	
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback){
			callback(null, "template output");	
		});

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath,
			"readTemplate": spyReadTemplate
		};
		
		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", "js", null, spyCallback);	

		expect(spyCompile).toHaveBeenCalledWith("template output", spyCallback);

	});

	it("call the callback without an output if template is not modified", function(){
		var spyCompile = jasmine.createSpy();

		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {"input_extensions": [".coffee"], "compile": spyCompile});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();
		spyGetTemplatesByBasePath.andCallFake(function(basepath, callback){
			callback(null, [{"full_path": "path/test.html", "last_modified": new Date(2012, 6, 10) },
											{"full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 10) } 
										 ]);	
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback){
			callback(null, "template output");	
		});

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath,
			"readTemplate": spyReadTemplate
		};
		
		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", "js", new Date(2012, 6, 13), spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"body": null, "modified": false });

	});

	it("call the callback with an error if no compiler found for the given content type", function(){
		var spyCompile = jasmine.createSpy();

		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback("error", null);	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};
				
		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", "js", new Date(2012, 6, 13), spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

	it("call the callback with an error if no matching template is found", function(){
		var spyCompile = jasmine.createSpy();

		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {"input_extensions": [".coffee"], "compile": spyCompile});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();
		spyGetTemplatesByBasePath.andCallFake(function(basepath, callback){
			callback("template not found", null);	
		});

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath	
		};
		
		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", "js", new Date(2012, 6, 13), spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("template not found", null);

	});

	it("call the callback with an error if it fails to read the template", function(){
		var spyCompile = jasmine.createSpy();

		var spyGetCompilerForOutputExt = jasmine.createSpy();
		spyGetCompilerForOutputExt.andCallFake(function(content_type, callback){
			callback(null, {"input_extensions": [".coffee"], "compile": spyCompile});	
		});

		renderer.compilers = {
			"getCompilerForOutputExt": spyGetCompilerForOutputExt
		};

		var spyGetTemplatesByBasePath = jasmine.createSpy();
		spyGetTemplatesByBasePath.andCallFake(function(basepath, callback){
			callback(null, [{"full_path": "path/test.html", "last_modified": new Date(2012, 6, 10) },
											{"full_path": "path/test.coffee", "last_modified": new Date(2012, 6, 10) } 
										 ]);	
		});

		var spyReadTemplate = jasmine.createSpy();
		spyReadTemplate.andCallFake(function(path, callback){
			callback("template read error", null);	
		});

		renderer.templates = {
			"getTemplatesByBasePath": spyGetTemplatesByBasePath,	
			"readTemplate": spyReadTemplate
		};
		
		var spyCallback = jasmine.createSpy();
		renderer.compileTo("path/test.js", "js", null, spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("template read error", null);

	});

});

