var path = require("path");
var fs = require("fs");
var http = require("http");
var generator = require("../lib/generator.js");
var server = require("../lib/server.js");

describe("handling the request", function(){

  it("generates the site before serving files", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    spyOn(generator, "generate");

    server.handleRequest(dummy_request, dummy_response);
    expect(generator.generate).toHaveBeenCalled();

  });

  it("won't generate the site if the interval between two requests is under 10 seconds", function(){
    server.config = { "output_dir": "public" };
    server.lastRequest = null;

    var dummy_request = {"headers": {}, "url": "/sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    spyOn(generator, "generate");

    // dispatch two requests
    server.handleRequest(dummy_request, dummy_response);
    server.handleRequest(dummy_request, dummy_response);
    expect(generator.generate.callCount).toEqual(1);
  });

  it("response body contains the contents of the file", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.handleRequest(dummy_request, dummy_response);
    expect(dummy_response.write).toHaveBeenCalledWith(dummy_contents, "binary");
  }); 

  it("content type header is set to the mime type of the file", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample.jpg" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "writeHead");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.handleRequest(dummy_request, dummy_response);
    expect(dummy_response.writeHead).toHaveBeenCalledWith(200, {"Content-Type": "image/jpeg"});

  });

  it("returns a 404 for a file that doesn't exist", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "writeHead");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback("error", null); 
    });

    server.handleRequest(dummy_request, dummy_response);
    expect(dummy_response.writeHead).toHaveBeenCalledWith(404, {"Content-Type": "text/plain"});

  });

  it("returns index.html for a directory root access", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample" };

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

    server.handleRequest(dummy_request, dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual(process.cwd() + "/public/sample/index.html");

  });

  it("returns file.html when /file is requested", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample" };

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

    server.handleRequest(dummy_request, dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual(process.cwd() + "/public/sample.html");

  });

  it("will not allow directory path attacks", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/../../sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(fs, "stat").andCallFake(function(file, callback){
      return callback(null, {"isDirectory": function(){ return false }}); 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.handleRequest(dummy_request, dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual(process.cwd() + "/public/sample.html");
  });
  
});

describe("start server", function(){

  it("should extend the default config with supplied config", function(){
    var supplied_config = {server_port: 4000};

    spyOn(http, "createServer").andReturn({"listen": function(){}});

    server.startServer(supplied_config);

    expect(server.config.server_port).toEqual(4000);
  }); 

  it("should start the server on default port if no config provided", function(){
    var supplied_config = {};

    var listenSpy = jasmine.createSpy();
    spyOn(http, "createServer").andReturn({"listen": listenSpy});

    server.startServer(supplied_config);

    expect(listenSpy).toHaveBeenCalledWith(9009);
  });

});
