/*
 * Punch Server - A development server with automatic site generation
 */

var fs = require("fs");
var path = require("path");
var http = require("http");
var url = require("url");
var mime = require("mime");
var _ = require("underscore");

var default_config = require("./default_config.js");
var generator = require("./generator.js")

module.exports = {

  config: {},

  lastRequest: null,

  handleRequest: function(request, response){
    var self = this;

    var parsed_url = url.parse(request.url);  
    var safe_path = parsed_url.pathname.replace(/\.\./g, '');
    var original_filename = path.join(process.cwd(), self.config.output_dir, safe_path); 

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

    //generate the site before serving files
    var cur_time = (new Date()).getTime();

    var config_for_request = _.extend(_.clone(self.config), {
      "on_complete": function(){
        return serveFile(original_filename);
      }
    });

    if((cur_time - self.lastRequest) > 10000){
      generator.generate(config_for_request);
      self.lastRequest = cur_time;
    }

  },

  startServer: function(supplied_config){
    var self = this;

    // extend the default configuration
    self.config = _.extend(_.clone(default_config), supplied_config);

    http.createServer(function(request, response){ 
      self.handleRequest(request, response);
    }).listen(parseInt(self.config.server_port));     

    console.log("Server is running on localhost:" + self.config.server_port);
  }

};
