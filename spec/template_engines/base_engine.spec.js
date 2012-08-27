var BaseEngine = require("../../lib/template_engines/base_engine.js");

describe("creating a new instance", function(){

	it("accept last rendered date as an option", function(){
		var base_instance = new BaseEngine({"lastRender": new Date(2012, 6, 18)});
		expect(base_instance.lastRender).toEqual(new Date(2012, 6, 18));
	});

});

describe("setting template", function() {

	it("set the template", function(){

		var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(base_instance.template).toEqual("template");
	});

	it("update the last modified date", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(base_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

 it("call render", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setTemplate("template", new Date(2012, 6, 18));

		expect(base_instance.render).toHaveBeenCalled();
  });

});

describe("setting content", function() {

	it("set the content", function(){

		var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(base_instance.content).toEqual({"key": "value"});
	});

	it("update the last modified date", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(base_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

	it("call render", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setContent({"key": "value"}, new Date(2012, 6, 18));

		expect(base_instance.render).toHaveBeenCalled();
  });

});

describe("setting partials", function() {

	it("set partials", function(){

		var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(base_instance.partials).toEqual({"partial": "template"});
	});

	it("update the last modified date", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(base_instance.lastModified).toEqual(new Date(2012, 6, 18));
	});

	it("call render", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setPartials({"partial": "template"}, new Date(2012, 6, 18));

		expect(base_instance.render).toHaveBeenCalled();
  });

});

describe("setting helpers", function() {

	it("set helpers", function(){
		var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setHelpers({ "tag_helpers": { "sample_tag_helper": "helper" }, "block_helpers": { "sample_tag_helper": "helper" } }, { "option": "value" });

		expect(base_instance.helpers).toEqual({ "tag_helpers": { "sample_tag_helper": "helper" }, "block_helpers": { "sample_tag_helper": "helper" } });
	});

	it("call render", function(){

    var base_instance = new BaseEngine();
    spyOn(base_instance, "render");

		base_instance.setHelpers({ "sample_helper": "helper" }, { "option": "value" });

		expect(base_instance.render).toHaveBeenCalled();
  });

});

describe("cancel render", function() {

	it("do nothing if rendering already canceled", function() {
		var base_instance = new BaseEngine();
		base_instance.rendering_canceled = true;
		spyOn(base_instance, "emit");

		base_instance.cancelRender("error");
		expect(base_instance.emit).not.toHaveBeenCalled();
	});

	it("set rendering cancled flag", function() {
		var base_instance = new BaseEngine();
		spyOn(base_instance, "emit");

		base_instance.cancelRender("error");
		expect(base_instance.rendering_canceled).toEqual(true);
	});

	it("emit renderCanceled event", function() {
		var base_instance = new BaseEngine();
		spyOn(base_instance, "emit");

		base_instance.cancelRender("error");
		expect(base_instance.emit).toHaveBeenCalledWith("renderCanceled", "error", 404);
	});

});

describe("calling render", function(){

	it("call the render function if template, content, partials and helpers are ready", function(){
    var base_instance = new BaseEngine();
		base_instance.template = "template";
		base_instance.content = {};
		base_instance.partials = {};
		base_instance.helpers = {};
		base_instance.lastModified = new Date(2012, 6, 18);

		spyOn(base_instance, "renderFunction");
		spyOn(base_instance, "emit");

		base_instance.render();
		expect(base_instance.renderFunction).toHaveBeenCalled();
	});

	it("don't call render if rendereding canceled", function(){
    var base_instance = new BaseEngine();
		base_instance.template = "template";
		base_instance.content = {};
		base_instance.partials = {};
		base_instance.helpers = {};
		base_instance.rendering_canceled = true;

		spyOn(base_instance, "renderFunction");
		spyOn(base_instance, "emit");

		base_instance.render();
		expect(base_instance.renderFunction).not.toHaveBeenCalled();
	});

	it("don't call render if not modified", function(){
    var base_instance = new BaseEngine({"lastRender": new Date(2012, 6, 18)});
		base_instance.template = "template";
		base_instance.content = {};
		base_instance.partials = {};
		base_instance.helpers = {};
		base_instance.lastModified = new Date(2012, 6, 15);

		spyOn(base_instance, "renderFunction");
		spyOn(base_instance, "emit");

		base_instance.render();
		expect(base_instance.renderFunction).not.toHaveBeenCalled();
	});

	it("emit render complete event", function(){
		var base_instance = new BaseEngine({"lastRender": new Date(2012, 6, 18)});
		base_instance.template = "template";
		base_instance.content = {};
		base_instance.partials = {};
		base_instance.helpers = {};
		base_instance.lastModified = new Date(2012, 6, 20);

		spyOn(base_instance, "renderFunction").andCallFake(function(template, content, partials, helpers){
			return "rendered output";
		});

		spyOn(base_instance, "emit");

		base_instance.render();
		expect(base_instance.emit).toHaveBeenCalledWith("renderComplete", "rendered output", true);
	});

	it("emit render canceled event if rendering error occurres", function(){
    var base_instance = new BaseEngine({"lastRender": new Date(2012, 6, 18)});
		base_instance.template = "template";
		base_instance.content = {};
		base_instance.partials = {};
		base_instance.helpers = {};
		base_instance.lastModified = new Date(2012, 6, 20);

		spyOn(base_instance, "renderFunction").andCallFake(function(template, content, partials, helpers){
			throw "error";
		});

		spyOn(base_instance, "emit");

		base_instance.render();
		expect(base_instance.emit).toHaveBeenCalledWith("renderCanceled", "error", 500);
	});

});
