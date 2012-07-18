var mustache_renderer = require("../../lib/template_engines/mustache_engine.js");
var Mustache = require("mustache");

describe("creating a new instance", function(){
	it("sets the extension as mustache", function(){
    var mustache_instance = new mustache_renderer(); 
		expect(mustache_instance.extension).toEqual(".mustache");
	});

	it("accepts last render date as an option", function(){
		var mustache_instance = new mustache_renderer({"lastRender": new Date(2012, 6, 18)}); 
		expect(mustache_instance.lastRender).toEqual(new Date(2012, 6, 18));
	});
});

describe("setting template", function() {

	it("sets the template", function(){

		var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(mustache_instance.template).toEqual("template");
	});

	it("updates the last modified date", function(){
	
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(mustache_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

 it("calls render", function(){

    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(mustache_instance.render).toHaveBeenCalled();
  });

});

describe("setting content", function() {

	it("sets the content", function(){

		var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(mustache_instance.content).toEqual({"key": "value"});
	});

	it("updates the last modified date", function(){
	
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(mustache_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

	it("calls render", function(){

    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(mustache_instance.render).toHaveBeenCalled();
  });

});

describe("setting partials", function() {

	it("sets partials", function(){

		var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(mustache_instance.partials).toEqual({"partial": "template"});
	});

	it("updates the last modified date", function(){
	
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(mustache_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

	it("calls render", function(){

    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

		mustache_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(mustache_instance.render).toHaveBeenCalled();
  });

});

describe("cancel render", function(){
	it("set rendering cancled flag", function(){
		var mustache_instance = new mustache_renderer(); 
		spyOn(mustache_instance, "emit");

		mustache_instance.cancelRender("error");
		expect(mustache_instance.rendering_canceled).toEqual(true);
	});

	it("emit renderCanceled event", function(){
		var mustache_instance = new mustache_renderer(); 
		spyOn(mustache_instance, "emit");

		mustache_instance.cancelRender("error");
		expect(mustache_instance.emit).toHaveBeenCalledWith("renderCanceled", "error");
	});
});

describe("calling render", function(){

	it("calls mustache render if template, content and partials are ready", function(){
    spyOn(Mustache, "render");

    var mustache_instance = new mustache_renderer(); 
		mustache_instance.template = "template";
		mustache_instance.content = {};
		mustache_instance.partials = {};
		mustache_instance.lastModified = new Date(2012, 6, 18);
		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(Mustache.render).toHaveBeenCalled();
	});

	it("don't call render if rendereding canceled", function(){
		spyOn(Mustache, "render");

    var mustache_instance = new mustache_renderer(); 
		mustache_instance.template = "template";
		mustache_instance.content = {};
		mustache_instance.partials = {};
		mustache_instance.rendering_canceled = true;
		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(Mustache.render).not.toHaveBeenCalled();
	});

	it("don't call render if not modified", function(){
		spyOn(Mustache, "render");

    var mustache_instance = new mustache_renderer({"lastRender": new Date(2012, 6, 18)}); 
		mustache_instance.template = "template";
		mustache_instance.content = {};
		mustache_instance.partials = {};
		mustache_instance.lastModified = new Date(2012, 6, 15);
		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(Mustache.render).not.toHaveBeenCalled();
	});

	it("emits render complete event", function(){
		spyOn(Mustache, "render").andCallFake(function(template, content, partials){
			return "rendered output";	
		});

    var mustache_instance = new mustache_renderer({"lastRender": new Date(2012, 6, 18)}); 
		mustache_instance.template = "template";
		mustache_instance.content = {};
		mustache_instance.partials = {};
		mustache_instance.lastModified = new Date(2012, 6, 20);

		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(mustache_instance.emit).toHaveBeenCalledWith("renderComplete", "rendered output", true);
	});

});
