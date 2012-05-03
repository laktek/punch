var path = require("path");
var fs = require("fs");
var server = require("../lib/server.js");

// serves the files in output directory. 
describe("serving files in the output directory", function(){

  it("response body contains the contents of the file", function(){
    server.config = { "output_dir": "public" };

    var dummy_request = {"headers": {}, "url": "/sample.html" };

    var dummy_response = { "writeHead": function(){}, "write": function(){}, "end": function(){} };
    spyOn(dummy_response, "write");

    var dummy_contents = new Buffer("sample output", "binary");

    spyOn(path, "exists").andCallFake(function(filename, callback){
      callback(true); 
    });

    spyOn(fs, "statSync").andCallFake(function(file){
      return {"isDirectory": function(){ return false }} 
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

    spyOn(path, "exists").andCallFake(function(filename, callback){
      callback(true); 
    });

    spyOn(fs, "statSync").andCallFake(function(file){
      return {"isDirectory": function(){ return false }} 
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

    spyOn(path, "exists").andCallFake(function(filename, callback){
      callback(false); 
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

    spyOn(path, "exists").andCallFake(function(filename, callback){
      callback(true); 
    });

    spyOn(fs, "statSync").andCallFake(function(file){
      return {"isDirectory": function(){ return true }} 
    });

    spyOn(fs, "readFile").andCallFake(function(filename, encoding, callback){
      callback(null, dummy_contents); 
    });

    server.handleRequest(dummy_request, dummy_response);
    expect(fs.readFile.mostRecentCall.args[0]).toEqual(process.cwd() + "/public/sample/index.html");

  });

  it("returns file.html when /file is requested", function(){
    //expect(server.handleRequest(dummyRequest)).toEqual(dummyResponse);
  });

  it("will not allow directory path attacks", function(){
    //expect(server.handleRequest(dummyRequest)).toEqual(dummyResponse);
  });
  
});

// Monitor file modifications and generate the site.
// describe("monitor file modifications and generate site");

