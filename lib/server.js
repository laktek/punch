/*
 * Punch Server - A development server with automatic site generation
 */

var fs = require("fs");
var path = require("path");
var url = require("url");
var mime = require("mime");
var _ = require("underscore");

//var default_config = require("./default_config.js");

module.exports = {

  config: {},
  
  handleRequest: function(request, response){
    var parsed_url = url.parse(request.url),  
        filename = path.join(process.cwd(), this.config.output_dir, parsed_url.pathname); 

    path.exists(filename, function(exists) {
      if(!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) filename += '/index.html';

      fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        response.writeHead(200, {"Content-Type": mime.lookup(filename)});
        response.write(file, "binary");
        response.end();
      });
    });
  }

};
