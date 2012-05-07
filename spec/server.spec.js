var path = require("path");
var fs = require("fs");
var http = require("http");
var generator = require("../lib/generator.js");
var server = require("../lib/server.js");

describe("serve files", function(){
  
  it("response body contains the contents of the file", function(){
    server.config = { "output_dir": "public" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.serveFile("sample.html", dummy_response);
    expect(dummy_response.write).toHaveBeenCalledWith(dummy_contents, "binary");
  }); 

  it("content type header is set to the mime type of the file", function(){
    server.config = { "output_dir": "public" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "writeHead");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.serveFile("sample.jpg", dummy_response);
    expect(dummy_response.writeHead).toHaveBeenCalledWith(200, {"Content-Type": "image/jpeg"});

  });

  it("returns a 404 for a file that doesn't exist", function(){
    server.config = { "output_dir": "public" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "writeHead");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback("error", null); 
    });

    server.serveFile("not_exist.html", dummy_response);
    expect(dummy_response.writeHead).toHaveBeenCalledWith(404, {"Content-Type": "text/plain"});

  });

  it("returns index.html for a directory root access", function(){
    server.config = { "output_dir": "public" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      if(fs.stat.mostRecentCall.args[0].indexOf(".html") > 0){
        return callback(null, {"isDirectory": function(){ return false }}); 
      } else {
        return callback(null, {"isDirectory": function(){ return true }}); 
      }
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.serveFile("sample", dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual("sample/index.html");

  });

  it("returns file.html when /file is requested", function(){
    server.config = { "output_dir": "public" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      if(fs.stat.mostRecentCall.args[0].indexOf(".html") > 0){
        return callback(null, {"isDirectory": function(){ return false }}); 
      } else {
        return callback("error", null); 
      }
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.serveFile("sample", dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual("sample.html");

  });

});

describe("handle requests", function(){

  it("will not generate the site if serving_only flag is set", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = true;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = null;

    spyOn(generator, "generate");
    spyOn(server, "serveFile");
     
    server.handleRequest(dummy_request, {});
   
    expect(generator.generate).not.toHaveBeenCalled(); 

  });

  it("queues the requests if site is already generating", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = true;
     
    server.handleRequest(dummy_request, {});
   
    expect(server.requestQueue.length).toEqual(1); 
  });
  
  it("generates the site if interval from last generation is above the specified value", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = null;

    spyOn(generator, "generate");
     
    server.handleRequest(dummy_request, {});
   
    expect(generator.generate).toHaveBeenCalled(); 
  });

  it("sets the generating flag to true when generation begins", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = null;

    spyOn(generator, "generate");
     
    server.handleRequest(dummy_request, {});
 
    expect(server.generating).toBeTruthy(); 

  });

  it("pushes the current request to the queue when generation begins", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = null;

    spyOn(generator, "generate");

    server.handleRequest(dummy_request, {});

    expect(server.requestQueue.length).toEqual(1); 

  });

  it("will serve directly if the site is already generated within the specified interval", function(){
    var dummy_request = { "url": "sample.html" };

    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = (new Date()).getTime();

    spyOn(server, "serveFile");
     
    server.handleRequest(dummy_request, {});
 
    expect(server.serveFile).toHaveBeenCalled(); 

  });

  it("gives full local path of the file needs to be served", function(){
    var dummy_request = { "url": "sample.html" };
    var dummy_response = {};

    server.config = {"output_dir": "public"}
    server.servingOnly = false;
    server.requestQueue = [];
    server.generating = false;
    server.lastGenerate = (new Date()).getTime();

    spyOn(server, "serveFile");
     
    server.handleRequest(dummy_request, dummy_response);
 
    expect(server.serveFile).toHaveBeenCalledWith(path.join(process.cwd(), "public", "sample.html"), dummy_response); 

  });

});

describe("start server", function(){

  it("should extend the default config with supplied config", function(){
    var supplied_config = { server: { port: 4000 } };

    spyOn(http, "createServer").andReturn({"listen": function(){}});

    server.startServer(supplied_config);

    expect(server.config.server.port).toEqual(4000);
  }); 

  it("should set the servingOnly flag", function(){
    var supplied_config = {server: { port: 4000, serving_only: true }};

    spyOn(http, "createServer").andReturn({"listen": function(){}});

    server.startServer(supplied_config);

    expect(server.servingOnly).toEqual(true);

  });

  it("should set the generation interval", function(){
    var supplied_config = {server: { port: 4000, serving_only: true, generate_interval: 1000 }};

    spyOn(http, "createServer").andReturn({"listen": function(){}});

    server.startServer(supplied_config);

    expect(server.generateInterval).toEqual(1000);

  });

  it("should start the server on default port if no config provided", function(){
    var supplied_config = {};

    var listenSpy = jasmine.createSpy();
    spyOn(http, "createServer").andReturn({"listen": listenSpy});

    server.startServer(supplied_config);

    expect(listenSpy).toHaveBeenCalledWith(9009);
  });

});
