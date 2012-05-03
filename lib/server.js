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
        safe_path = parsed_url.pathname.replace(/\.\./g, ''),
        original_filename = path.join(process.cwd(), this.config.output_dir, safe_path); 

    var serveFile = function(filename){
      fs.stat(filename, function(error, stat) {
        if(!error){
          // If a directory exists by the requested filename,
          // try loading its index.html
          if(stat.isDirectory()) {
            return serveFile(filename + '/index.html');
          } else {
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
          }
        } else {
          // check if the filename contains an extension
          if(filename.indexOf(".") > 0){
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
          } else {
            // try loading by appending a ".html" to the path
            return serveFile(filename + ".html");
          }
        }
      });
    }

    return serveFile(original_filename);
  }

};
