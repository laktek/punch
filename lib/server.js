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

  lastModifiedForTemplates: null,

  lastModifiedForContents: null,
  
  handleRequest: function(request, response){
    var that = this;

    var parsed_url = url.parse(request.url);  
    var safe_path = parsed_url.pathname.replace(/\.\./g, '');
    var original_filename = path.join(process.cwd(), that.config.output_dir, safe_path); 

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
  },

  isModified: function(directory){
    return true; 
  },

  generateIfModified: function(callback){
    var that = this;

    // check if the template or contents is modified
    if(that.isModified(path.join(process.cwd(), that.config.template_dir) || 
       that.isModified(path.join(process.cwd(), that.config.content_dir)))) {
      generator.generate(that.config);

      //TODO: this should be given as a callback to generate function
      callback();
    } else {
      callback(); 
    };
  },

  startServer: function(supplied_config){
    var that = this;

    // extend the default configuration
    that.config = _.extend(_.clone(default_config), supplied_config);

    http.createServer(function(request, response) {
    
      // generate the site if template or content
      // is modified
      that.generateIfModified(function(){
        // handle the request
        that.handleRequest(request, response);
      });
            
    }).listen(parseInt(that.config.server_port));     
  }

};
