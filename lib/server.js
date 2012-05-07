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

  generating: false,

  generateInterval: 10000,

  lastGenerate: null,

  requestQueue: [],

  serveFile: function(filename, response){

    var self = this;
    //remove the trailing slash
    filename = filename.replace(/\/$/, '');

    fs.stat(filename, function(error, stat) {
      if(!error){
        // If a directory exists by the requested filename,
        // try loading its index.html
        if(stat.isDirectory()) {
          return self.serveFile(filename + '/index.html', response);
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
          return self.serveFile(filename + ".html", response);
        }
      }
    });
  },

  handleRequest: function(request, response){
    var self = this;

    var parsed_url = url.parse(request.url);  
    var file_path = parsed_url.pathname;
    var original_filename = path.join(process.cwd(), self.config.output_dir, file_path); 

    var on_complete = function(){
      console.log("Serving requests...");
      self.generating = false;
      self.lastGenerate = (new Date()).getTime();

      var clearQueue = function(queue){
        if(queue.length > 0){
          file_and_response = queue.shift();
          self.serveFile(file_and_response[0], file_and_response[1]);

          clearQueue(queue);
        }
      }

      clearQueue(self.requestQueue);
    };

    if(self.generating){
      // queue 
      self.requestQueue.push([original_filename, response]);
    } else if(((new Date()).getTime() - self.lastGenerate) > self.generateInterval) {
      // generate
      self.generating = true;
      self.requestQueue.push([original_filename, response]);

      generator.generate(_.extend(_.clone(self.config), { "on_complete": on_complete }));
    } else {
      // serve directly
      self.serveFile(original_filename, response); 
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
