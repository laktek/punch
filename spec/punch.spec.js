var util = require("util");
var fs = require("fs");
var child_process = require("child_process");
var punch = require("../lib/punch.js");

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

describe("returning an instance of renderer", function(){
  var fake_renderer = jasmine.createSpy();
  punch.registeredRenderers["sample"] = fake_renderer;

  expect(punch.rendererFor("sample") instanceof fake_renderer).toBeTruthy();
});

describe("returning an instance of parser", function(){
  var fake_parser = jasmine.createSpy();
  punch.registeredParsers["sample"] = fake_parser;

  expect(punch.parserFor("sample") instanceof fake_parser).toBeTruthy();
});

describe("prepare output directory", function(){

  it("creates the output directory if it doesn't exist", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'stat').andCallFake(function(path, callback){
      callback(null, {isDirectory: function(){ return false }} );
    });

    spyOn(punch, "traverseTemplates");
    spyOn(fs, "mkdirSync");

    punch.prepareOutputDirectory(config);

    expect(fs.mkdirSync).toHaveBeenCalled();

  });

  it("will not create the output directory if it exists", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'stat').andCallFake(function(path, callback){
      callback(null, {isDirectory: function(){ return true }} );
    });

    spyOn(punch, "traverseTemplates");
    spyOn(fs, "mkdirSync");

    punch.prepareOutputDirectory(config);

    expect(fs.mkdirSync).not.toHaveBeenCalled();

  });

  it("it calls to traverse templates", function(){
    var config = {"template_dir": "templates"}; 

    spyOn(fs, 'stat').andCallFake(function(path, callback){
      callback(null, {isDirectory: function(){ return true }} );
    });

    spyOn(punch, "traverseTemplates");

    punch.prepareOutputDirectory(config);

    expect(punch.traverseTemplates).toHaveBeenCalledWith(config);

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

    spyOn(fs, 'mkdirSync');
    spyOn(punch, "fetchAndRender");

    punch.traverseTemplates(config);

    expect(punch.fetchAndRender).toHaveBeenCalledWith("templates/sub_dir/sub.mustache", config);

  });

  it("creates sub-directories in the output path", function(){
    var config = {"template_dir": "templates", "output_dir": "public"}; 

    spyOn(fs, 'mkdirSync');
    spyOn(punch, "fetchAndRender");

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["index.mustache", "sub_dir"]); 
      } else {
        callback(null, ["sub.mustache"]); 
      }
    });

    punch.traverseTemplates(config);

    expect(fs.mkdirSync).toHaveBeenCalledWith("public/sub_dir");

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

    spyOn(fs, 'mkdirSync');
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

    spyOn(fs, 'mkdirSync');
    spyOn(punch, "fetchAndRender");

    punch.traverseTemplates(config);

    expect(punch.fetchAndRender).not.toHaveBeenCalled();


  });

  it("handle other file types as static files", function() {
    var config = {"template_dir": "templates", "output_dir": "public"}; 

    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      if(fs.readdir.mostRecentCall.args[0] === "templates"){
        callback(null, ["index.html"]); 
      } else {
        callback({errno: 27, code: 'ENOTDIR'}, null); 
      }
    });

    spyOn(fs, 'mkdirSync');
    spyOn(punch, "staticFileHandler");

    punch.traverseTemplates(config);

    expect(punch.staticFileHandler).toHaveBeenCalledWith("templates/index.html", config);

  });


});

describe("handling static files", function(){

  it("throws an exception if an error occurrs", function(){

    spyOn(child_process, "exec").andCallFake(function(cmd, callback){
      callback("error"); 
    });

    spyOn(console, "log");

    punch.staticFileHandler("templates/not_exist.html", {"output_dir": "public"});

    expect(console.log).toHaveBeenCalledWith("error");
  });

  it("issues the copy command with correct source and destination", function(){
 
    spyOn(child_process, "exec").andCallFake(function(cmd, callback){
      callback(); 
    });

    punch.staticFileHandler("templates/sub/foo/static.html", {"output_dir": "public"});

    expect(child_process.exec.mostRecentCall.args[0]).toEqual("cp templates/sub/foo/static.html public/sub/foo/static.html");
  });

});

describe("rendering content", function(){

  it("instantiates a new renderer", function(){
    var config = {};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent"); 
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

  it("fetches shared content", function(){
    var config = {"content_dir": "contents", "shared_content": "shared"};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.fetchSharedContent.mostRecentCall.args[0]).toEqual("contents/shared");

  });

  it("fetches content for the template", function(){
    var config = {"content_dir": "contents", "shared_content": "shared"};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null, "setContent": function(){} }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent").andCallFake(function(path, callback){ callback({}); }); 
    spyOn(punch, "fetchContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.html.mustache", config);

    expect(punch.fetchContent.mostRecentCall.args[0]).toEqual("contents/sub/simple");
  });

  it("fetches partials for the template", function(){
    var config = {"template_dir": "templates"};

    spyOn(punch, "rendererFor").andCallFake(function(){ return {"afterRender": null }}); 
    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent"); 
    spyOn(punch, "fetchPartials"); 

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    expect(punch.fetchPartials.mostRecentCall.args[0]).toEqual("templates/sub");

  });

  it("saves the output after render", function(){

    var config = {"output_dir": "public", "output_extension": "html"};

    var fake_renderer = {
      afterRender: null    
    };

    spyOn(punch, "rendererFor").andCallFake(function(){
      return fake_renderer;
    });  

    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent"); 
    spyOn(punch, "fetchPartials"); 

    spyOn(fs, "stat").andCallFake(function(path, callback){
      var fake_stats = {isDirectory: function(){ return true; }};  
      callback(null, fake_stats);
    });
    spyOn(fs, "writeFile");

    punch.fetchAndRender("templates/sub/simple.mustache", config);

    fake_renderer.afterRender("sample output");

    expect(fs.writeFile.mostRecentCall.args.slice(0, 2)).toEqual(["public/sub/simple.html", "sample output"]);
  });

  it("will not set the extension if rendered file already got an extension", function(){

    var config = {"output_dir": "public", "output_extension": "html"};

    var fake_renderer = {
      afterRender: null    
    };

    spyOn(punch, "rendererFor").andCallFake(function(){
      return fake_renderer;
    });  

    spyOn(punch, "fetchTemplate"); 
    spyOn(punch, "fetchSharedContent"); 
    spyOn(punch, "fetchPartials"); 

    spyOn(fs, "stat").andCallFake(function(path, callback){
      var fake_stats = {isDirectory: function(){ return true; }};  
      callback(null, fake_stats);
    });
    spyOn(fs, "writeFile");

    punch.fetchAndRender("templates/sub/simple.css.mustache", config);

    fake_renderer.afterRender("sample output");

    expect(fs.writeFile.mostRecentCall.args.slice(0, 2)).toEqual(["public/sub/simple.css", "sample output"]);
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

  it("joins the queue if a partial is currently being fetched", function(){

    var callback_func = function(){};

    punch.partials = {};
    punch.callbacksForPartial = { "templates/sub/sub1": [ function(){} ] };

    punch.fetchPartialsWithCache("templates/sub/sub1", callback_func); 

    expect(punch.callbacksForPartial["templates/sub/sub1"][1]).toEqual(callback_func);

  });

  it("caches fetched partials", function(){

    var partials = {"_test": "partial"};

    punch.partials = {};
    punch.callbacksForPartial = {};

    spyOn(punch, "fetchPartialsInDir").andCallFake(function(path, callback){
      callback(partials); 
    })

    punch.fetchPartialsWithCache("templates/sub/sub1", function(){ }); 

    expect(punch.partials["templates/sub/sub1"]).toEqual(partials);
  });

  it("invokes pending callbacks after the partials are fetched", function(){
    var output = [];

    punch.partials = {};
    punch.callbacksForPartial = {};

    spyOn(punch, "fetchPartialsInDir").andCallFake(function(path, callback){
      setTimeout(function () {
        callback({}); 
      }, 200);
    });
    
    punch.fetchPartialsWithCache("templates/sub/sub1", function(){ output.push("first"); }); 
    punch.fetchPartialsWithCache("templates/sub/sub1", function(){ output.push("second"); }); 

    waits(200);

    runs(function(){
      expect(output).toEqual(["first", "second"]); 
    });

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

  it("returns an empty object if there's no partials in the path", function(){
    var output = null;

    spyOn(fs, "readdir").andCallFake(function(path, callback){
      callback(null, ["index.mustache"]); 
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
      callback(null, "sample");  
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
      callback(null, ["test.markdown"]); 
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

  it("ignores hidden files", function(){
    var output = null;
 
    spyOn(fs, 'readdir').andCallFake(function(path, callback){
      callback(null, ["test.markdown", ".hidden"]); 
    });

    spyOn(fs, 'readFile');

    punch.fetchContentFromDir("contents/simple", function(){});

    expect(fs.readFile.callCount).toEqual(1);

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

