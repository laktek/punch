var mustache_renderer = require("../lib/renderers/mustache.js");

describe("setting template", function() {

  it("calls render if the content & partials are already set", function(){

    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.content = "sample content";
    mustache_instance.partials = {};
    mustache_instance.setTemplate("sample template"); 

    expect(mustache_instance.render).toHaveBeenCalled();
  });

  it("does not call render if the content & partials are not already set", function(){

    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.setTemplate("sample template"); 

    expect(mustache_instance.render).not.toHaveBeenCalled();
  });

});

describe("setting content", function() {

  it("calls render if the template & partials are already set", function(){
 
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.template = "sample template";
    mustache_instance.partials = {};
    mustache_instance.setContent("sample content"); 

    expect(mustache_instance.render).toHaveBeenCalled();
 
  });

  it("does not call render if the template & partials are not already set", function(){
  
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.setContent("sample content"); 

    expect(mustache_instance.render).not.toHaveBeenCalled();
 
  });

});

describe("setting partials", function() {

  it("calls render if the template & content are already set", function(){
 
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.template = "sample template";
    mustache_instance.content = "sample content";
    mustache_instance.setPartials({}); 

    expect(mustache_instance.render).toHaveBeenCalled();
 
  });

  it("does not call render if the template & content are not already set", function(){
  
    var mustache_instance = new mustache_renderer(); 
    spyOn(mustache_instance, "render");

    mustache_instance.setPartials({}); 

    expect(mustache_instance.render).not.toHaveBeenCalled();
 
  });

});

describe("calling render", function(){

  it("calls after render callback if specified", function(){

    var output = null;
    var mustache_instance = new mustache_renderer(); 
    mustache_instance.content = "sample content";
    mustache_instance.template = "sample template";

    var callback = jasmine.createSpy();
    mustache_instance.afterRender = callback; 
    mustache_instance.render();

    expect(callback).toHaveBeenCalled(); 

  });

  it("returns the result if after render callback is not specified", function(){
 
    var output = null;
    var mustache_instance = new mustache_renderer(); 
    mustache_instance.content = {};
    mustache_instance.template = "sample template";

    var output = mustache_instance.render();

    expect(output).toEqual("sample template"); 
 
  });

});
