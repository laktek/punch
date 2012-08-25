var MustacheEngine = require("../../lib/template_engines/mustache_engine.js");
var Mustache = require("mustache");

describe("creating a new instance", function(){

	it("set the extension as mustache", function(){
    var mustache_instance = new MustacheEngine();
		expect(mustache_instance.extension).toEqual(".mustache");
	});

});

describe("calling render", function(){

	it("call Mustache's render function", function(){
    spyOn(Mustache, "render");

    var mustache_instance = new MustacheEngine();
		mustache_instance.template = "template";
		mustache_instance.content = {};
		mustache_instance.partials = {};
		mustache_instance.helpers = {};
		mustache_instance.lastModified = new Date(2012, 6, 18);
		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(Mustache.render).toHaveBeenCalled();
	});

	it("extend contents with helpers", function() {
		spyOn(Mustache, "render");

    var mustache_instance = new MustacheEngine();
		mustache_instance.template = "template";
		mustache_instance.content = { "content_key": "content_value" };
		mustache_instance.partials = {};
		mustache_instance.helpers = { "tag": { "tag_helper": "tag_helper_value" }, "block": { "block_helper": "block_helper_value" }};
		mustache_instance.lastModified = new Date(2012, 6, 18);
		spyOn(mustache_instance, "emit");

		mustache_instance.render();
		expect(Mustache.render).toHaveBeenCalledWith("template", { "content_key": "content_value", "tag_helper": "tag_helper_value", "block_helper": jasmine.any(Function) }, {});
	});

	it("re-attempt a helper function after rendering for the context, if it throws an error", function() {
		spyOn(Mustache, "render").andCallFake( function(template, content, partials) {
			return content.dummy_helper()("helper text", function(text){ return text });
		});

		var dummy_helper = function() {
			if (arguments.length > 1) {
				throw "Error";
			}	else {
				return arguments[0];
			}
		};

		var render_output = MustacheEngine.renderFunction("", {}, {}, {"tag": {}, "block": { "dummy_helper": dummy_helper }});

		expect(render_output).toEqual("helper text");
	});

});
