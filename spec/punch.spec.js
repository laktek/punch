var util = require("util");
var fs = require("fs");
var punch = require("../lib/punch.js");

describe("loading config", function() {

  it("overrides default config", function() {
    var configUpdated = false;
    var extension = "";
    var default_config = {"extension": "shtml"}; 

    spyOn(fs, 'readFile').andCallFake(function(file, callback){
      callback(null, new Buffer(JSON.stringify({"extension": "html"}))); 
    });

    punch.extendConfig(default_config, function(config){
      extension = config.extension;
      configUpdated = true; 
    });

    waitsFor(function() {
      return configUpdated;
    }, "config didn't update", 10000);

    runs(function () {
      expect(extension).toEqual("html");
    });
  });

  it("returns default config for an unspecified value", function() {
    var configUpdated = false;
    var foo = "";
    var default_config = {"foo": "bar"}

    spyOn(fs, 'readFile').andCallFake(function(file, callback){
      callback("File doesn't exist", null); 
    });

    punch.extendConfig(default_config, function(config){
      foo = config.foo;
      configUpdated = true; 
    });

    waitsFor(function() {
      return configUpdated;
    }, "config didn't update", 10000);

    runs(function () {
      expect(foo).toEqual("bar");
    });
  });

});

describe("registering a renderer", function(){
  it("adds the renderer to registered renderers", function(){
    punch.registerRenderer("sample", "../spec/sample_renderer"); 

    expect(punch.registeredRenderers["sample"].name).toEqual("sample renderer");
  }); 
});

describe("registering a parser", function(){
  it("adds the parser to registered parsers", function(){
    punch.registerParser("sample", "../spec/sample_parser"); 

    expect(punch.registeredParsers["sample"].name).toEqual("sample parser");
  });
});

describe("traversing templates", function() {

  it("traverses recursively", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["index.mustache", "sub_dir"]); 
      } else {
        callback(null, ["sub.mustache"]); 
      }
    });

    spyOn(punch, "fetchAndRender");

    punch.traverseTemplates(config, punch.contentRenderer, function(){ });

    expect(punch.fetchAndRender).toHaveBeenCalledWith("templates/sub_dir/sub.mustache", config);

  });

  it("calls to render content when a template is found", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["test.html.mustache"]); 
      } else {
        callback("Not a directory", null); 
      }
    });

    spyOn(punch, "fetchAndRender");

    punch.traverseTemplates(config);

    expect(punch.fetchAndRender).toHaveBeenCalledWith("templates/test.html.mustache", config);

  });

  it("skips partial templates from rendering", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["_test.html.mustache"]); 
      } else {
        callback("Not a directory", null); 
      }
    });

    spyOn(punch, "fetchAndRender");

    punch.traverseTemplates(config);

    expect(punch.fetchAndRender).not.toHaveBeenCalled();


  });

  it("calls to handle static files", function() {
    var config = {"template_dir": "templates", "output_dir": "public"}; 

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["index.html"]); 
      } else {
        callback("Not a directory", null); 
      }
    });

    spyOn(punch, "staticFileHandler");

    punch.traverseTemplates(config);

    expect(punch.staticFileHandler).toHaveBeenCalledWith("templates/index.html", config);

  });

});

describe("handling static files", function(){

  it("throws an exception if source file doesn't exist", function(){
    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback("File not found", null); 
    });

    expect(function(){ punch.staticFileHandler("templates/not_exist.html", {"output_path": "public"}) }).toThrow();
  });

  it("copies source file to output path", function(){

    var buf = new Buffer("sample content");

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, buf); 
    });

    spyOn(fs, 'writeFile')

    punch.staticFileHandler("templates/simple.html",  {"output_path": "public"});

    expect(fs.writeFile).toHaveBeenCalled();

  });

  it("preserves the directory structure", function(){
    var buf = new Buffer("sample content");

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, buf); 
    });

    spyOn(fs, 'writeFile')

    punch.staticFileHandler("templates/foo/bar/simple.html", {"output_path": "public"});

    expect(fs.writeFile.mostRecentCall.args[0]).toEqual("public/foo/bar/simple.html");

  });

});

describe("rendering content", function(){

  it("instantiatesa new renderer", function(){
    var config = {};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.rendererFor.mostRecentCall.args[0]).toEqual("mustache");

  });

  it("fetches the template from the path", function(){
    var config = {};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.fetchTemplate.mostRecentCall.args[0]).toEqual("templates/sub/simple.mustache");

  });

  it("fetches content for the template", function(){
    var config = {"content_dir": "contents"};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.fetchContent.mostRecentCall.args[0]).toEqual("contents/sub/simple");
  });

  it("fetches partials for the template", function(){
    var config = {"template_dir": "templates"};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.fetchPartials.mostRecentCall.args[0]).toEqual("templates/sub");

  });

  it("saves the output after render", function(){

    var config = {"output_dir": "public", "output_extension": ".html"};

    var fake_renderer = {
      afterRender: null    
    };

    spyOn(punch, "rendererFor").andCallFake(function(){
      return fake_renderer;
    });  

    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    spyOn(fs, "stat").andCallFake(function(path, callback){
      var fake_stats = {isDirectory: function(){ return true; }};  
      callback(null, fake_stats);
    });
    spyOn(fs, "writeFile");

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    fake_renderer.afterRender("sample output");

    expect(fs.writeFile).toHaveBeenCalledWith("public/sub/simple.html", "sample output");
  });

  it("creates the output directory if it doesn't exist", function(){
 
    var config = {"output_dir": "public", "output_extension": "html"};

    var fake_renderer = {
      afterRender: null    
    };

    spyOn(punch, "rendererFor").andCallFake(function(){
      return fake_renderer;
    });  

    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    spyOn(fs, "stat").andCallFake(function(path, callback){
      var fake_stats = {isDirectory: function(){ return true; }};  
      callback("directory doesn't exist", null);
    });
    spyOn(fs, "writeFile");
    spyOn(fs, "mkdirSync");

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    fake_renderer.afterRender("sample output");

    expect(fs.mkdirSync).toHaveBeenCalledWith("public");
    
  });

});

describe("fetching partials", function(){

  it("fetches partials from ancestors", function(){
    spyOn(punch, "fetchPartialsWithCache"); 

    punch.fetchPartials("templates/sub/sub2", function(){ });

    expect(punch.fetchPartialsWithCache.callCount).toEqual(3);
  }); 

  it("invokes the callback with collected partials", function(){
    var output = null; 

    spyOn(punch, "fetchPartialsWithCache").andCallFake(function(path, callback){
      var key = path.split("/").pop();
      var output = {};
      output[key] = "bar"
      callback(output); 
    });

    punch.fetchPartials("templates/sub/sub2", function(partials){
      output = partials
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({"templates": "bar", "sub": "bar", "sub2": "bar"}); 
    });
  });

});

describe("fetching partials with cache", function(){

  it("if a partial is already fetched it's served from the cache", function(){
    var partials = {"_test": "partial"};
    punch.partials["templates/sub/sub1"] = partials;

    spyOn(punch, "fetchPartialsInDir");

    punch.fetchPartialsWithCache("templates/sub/sub1", function(){ }); 

    expect(punch.fetchPartialsInDir).not.toHaveBeenCalled();

  }); 

  it("caches fetched partials", function(){

    var partials = {"_test": "partial"};

    spyOn(punch, "fetchPartialsInDir").andCallFake(function(path, callback){
      callback(partials); 
    })

    punch.fetchPartialsWithCache("templates/sub/sub1", function(){ }); 

    expect(punch.partials["templates/sub/sub1"]).toEqual(partials);
  });
});

describe("fetching partials from the directory", function(){

  it("returns an empty object if there's an error in reading path", function(){
    var output = null;

    spyOn(fs, "readdir").andCallFake(function(path, callback){
      callback("error", null); 
    }); 

    punch.fetchPartialsInDir("templates/sub", function(partials){
      output = partials; 
    });

    expect(output).toEqual({});
  });

  it("fetches the template for each partial available in path", function(){

    spyOn(fs, "readdir").andCallFake(function(path, callback){
      callback(null, ["test.mustache", "_test.html", "_test.mustache", "_foo.mustache"]); 
    });
     
    spyOn(punch, "fetchTemplate"); 

    punch.fetchPartialsInDir("templates/sub", function(){ });

    expect(punch.fetchTemplate.callCount).toEqual(2);
  });

  it("invokes the callback with partials", function(){

    var output = null;

    spyOn(fs, "readdir").andCallFake(function(path, callback){
      callback(null, ["test.mustache", "_test.html", "_test.mustache", "_foo.mustache"]); 
    });
     
    spyOn(punch, "fetchTemplate").andCallFake(function(path, callback){
      callback("sample");  
    }); 

    punch.fetchPartialsInDir("templates/sub", function(partials){ 
      output = partials 
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({ "test": "sample", "foo": "sample" });
    });
  });



});

describe("fetching templates", function(){

  it("fetches the template from path", function(){

    spyOn(fs, 'readFile')

    punch.fetchTemplate("templates/simple.mustache", function(){});

    expect(fs.readFile).toHaveBeenCalled();

  });

  it("passes the template content in the callback", function(){

    var sample_template = "sample template";
    var output = null;
 
    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, new Buffer(sample_template)); 
    });

    punch.fetchTemplate("templates/simple.mustache", function(error, template){
      output =  template;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual(sample_template);
    });
 
  });

  it("on an error, pass the error in the callback", function(){

    var error = "error";
    var output = null;
 
    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(error, null); 
    });

    punch.fetchTemplate("templates/simple.mustache", function(error, template){
      output = error;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual(error);
    });
 
  });

});

describe("fetching content", function(){

  it("fetches shared content", function(){
 
    var shared_json = {"shared": "content"};
    var sample_json = {"foo": "bar"};
    var output = null;

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      if(path === "contents/shared.json"){
        callback(null, new Buffer(JSON.stringify(shared_json))); 
      } else {
        callback(null, new Buffer(JSON.stringify(sample_json))); 
      }
    });

    spyOn(punch, "fetchContentFromDir").andCallFake(function(path, callback){
      callback("no directory"); 
    });

    punch.fetchContent("contents/simple", function(content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({"shared": "content", "foo": "bar"});
    });

 
  });

  it("fetches content from the JSON file of given name", function(){

    var sample_json = {"foo": "bar"};
    var output = null;

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, new Buffer(JSON.stringify(sample_json))); 
    });

    spyOn(punch, "fetchContentFromDir").andCallFake(function(path, callback){
      callback("no directory"); 
    });

    punch.fetchContent("contents/simple", function(content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual(sample_json);
    });

  });

  it("fetches content from the directory of given name", function(){

    var sample_json = {"foo": "bar"};
    var output = null;

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, new Buffer(JSON.stringify(sample_json))); 
    });

    spyOn(punch, "fetchContentFromDir").andCallFake(function(path, callback){
      callback(null, {"bar": "baz"}); 
    });

    punch.fetchContent("contents/simple", function(content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({"foo": "bar", "bar": "baz"});
    });

  });

  it("when no content to fetch empty object is returned", function(){

    var output = null;

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback("file doesn't exist", null); 
    });

    spyOn(punch, "fetchContentFromDir").andCallFake(function(path, callback){
      callback("no directory"); 
    });

    punch.fetchContent("contents/simple", function(content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({});
    });

  });

});

describe("fetch content from a directory", function(){

  it("traverses files in the given content directory", function(){

    spyOn(fs, 'readdir');

    punch.fetchContentFromDir("contents/simple", function(){ });

    expect(fs.readdir.mostRecentCall.args[0]).toEqual("contents/simple");

  });

  it("parses JSON files directly", function(){

    var sample_json = {"foo": "bar"};
    var output = null;
 
    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      callback(null, ["test.json", "test2.json"]); 
    });

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, new Buffer(JSON.stringify(sample_json))); 
    });

    punch.fetchContentFromDir("contents/simple", function(error, content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({"test": {"foo": "bar"}, "test2": {"foo": "bar"}});
    });
 
  });

  it("calls for the relavent parser for other content types", function(){
    var output = null;
 
    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      callback(null, ["test.mustache"]); 
    });

    spyOn(fs, 'readFile').andCallFake(function(path, callback){
      callback(null, new Buffer("sample content")); 
    });

    spyOn(punch, 'parserFor').andCallFake(function(content_type){
      return {parse: function(data, callback){ callback(data.toString()); }}
    });

    punch.fetchContentFromDir("contents/simple", function(error, content){
      output = content;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual({"test": "sample content"});
    });
 

  });

  it("on an error, pass the error in the callback", function(){

    var error = "error";
    var output = null;
 
    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      callback(error, null); 
    });

    punch.fetchContentFromDir("contents/simple", function(error, content){
      output = error;
    });

    waits(100);

    runs(function(){
      expect(output).toEqual(error);
    });
 
  });

});

