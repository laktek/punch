/*
 * Punch
 *
 * Templates should be available in mustache format.
 * Other formats are copied directly without going through the renderer.
 *
 * Content should be either in JSON format or markdown.
 * Markdown is converted to a JSON value with the file name as the key
 *
 * Render each template by fetching the relavant content.
 *
 * Move the rendered file into output directory (preserving the directory structure)
 * Use the given extension in the template (eg. index.rss.mustache -> index.rss)
 * Or use .html (or what's specified in the config file) as the default extension (eg. index.mustache -> index.html)
 *
*/

var fs = require("fs");
var util = require("util");
var _ = require("underscore");

module.exports = {

  registeredRenderers: {},

  registeredParsers: {},

  extendConfigFromFile: function(default_config, callback){
    fs.readFile("config.json", function(err, data){
      // if there's an error we assume the config doesn't exist.
      if(err){
        var specified_config = {}; 
      } else {
        var specified_config = JSON.parse(data);  
      } 

      callback(_.extend(_.clone(default_config), specified_config));
    });
  },

  extendConfig: function(default_config, callback){
    // extend default configuration
    this.extendConfigFromFile(default_config, callback);
  },

  registerRenderer: function(content_type, handler){
    var self = this;

    self.registeredRenderers[content_type] = require(handler); 
  },

  registerParser: function(content_type, handler){
    var self = this;

    self.registeredParsers[content_type] = require(handler); 
  },

  //TODO: add tests
  rendererFor: function(content_type){
    var self = this;
    return (new self.registeredRenderers[content_type]); 
  },

  //TODO: add tests
  parserFor: function(content_type){
    var self = this;
    return (new self.registeredParsers[content_type]); 
  },

  fetchTemplate: function(path, callback){
   fs.readFile(path, function (err, data) {
      if (err) {
        callback(err, null); 
        return;
      };

      callback(null, data.toString());

   }); 
  },

  fetchContentFromDir: function(path, callback){

    var self = this; 
    var content = {};

    // traverse each file inside the directoy
    fs.readdir(path, function(err, files){

      if(err) {
        callback(err, null);
        return;
      }

      files.forEach(function(file){
        
        fs.readFile(path + "/" + file, function (err, data) {

          if(!err) {
            var file_name_and_type = file.split(".");

            if(file_name_and_type[1] === "json"){
              // parse as JSON
              content[file_name_and_type[0]] = JSON.parse(data);
              callback(null, content);
            } else {
              // use releavant parser
              var parser = self.parserFor(file_name_and_type[1]);

              parser.parse(data, function(parsed_data){
                content[file_name_and_type[0]] = parsed_data;
                callback(null, content);
              });
            }
          };
        });
      });

    });
  },

  fetchContent: function(path, callback){
    var self = this;

    var fetchForPath = function(content_path, callback){

      var contents = {};

      // check for a JSON file to exist
      fs.readFile(content_path + ".json", function (err, data) {
        if(!err) {
         //  assign it to the content object
         contents = JSON.parse(data);
        };
         
        // call to load content from the directory
        self.fetchContentFromDir(content_path + "/", function(err, contents_from_dir){
          if(!err){
            //  append results to content object
            _.extend(contents, contents_from_dir);
          }

          callback(contents);
        });
      });
    };

    // check for shared content
    var shared_path = path.split("/")[0] + "/shared";
    fetchForPath(shared_path, function(shared_content){

      // check for given path
      fetchForPath(path, function(given_content){
        callback(_.extend(shared_content, given_content)); 
      }); 
    });
     
  },

  fetchAndRender: function(template_path, config){
    var self = this;

    var content_identifier = template_path.split(/\/|\./);

    //remove the general template directory name from indentifer
    content_identifier.shift();

    //remove the extension from the identifier
    content_type = content_identifier.pop();

    content_path = config.content_dir + "/" + content_identifier.join("/");

    // get an instance of renderer
    var renderer = self.rendererFor(content_type);

    // set the handler to save the output
    renderer.afterRender = function(output){
      var output_dir = config.output_dir;
      var output_path = output_dir + "/" + content_identifier.join("/") + "." + config.output_extension;

      // if output directory doesn't exist,
      // create it.
      fs.stat(config.output_dir, function(err, stats){
        if(err || !stats.isDirectory()){
          fs.mkdirSync(output_dir); 
          console.log("Created " + output_dir + " directory");
        }

        fs.writeFile(output_path, output);
        console.log("Created " + output_path );
      });
    };

    // fetch template
    self.fetchTemplate(template_path, function(err, template){
      if(!err){
        renderer.setTemplate(template);       
      } else {
        console.log(err); 
      }
    });

    // fetch content
    self.fetchContent(content_path, function(content){
      renderer.setContent(content);       
    });

  },

  staticFileHandler: function(source_file, config){

    var output_path = config.output_path;

    // copy to output directory as it is
    fs.readFile(source_file, function (err, data) {
      if (err) throw err;

      var source_directory_path = source_file.split("/");
      source_directory_path[0] = output_path;
      var output_content_path = source_directory_path.join("/");

      fs.writeFile(output_content_path, data);
    });
  },

  traverseTemplates: function(config){
    var self = this;

    // Start traversing through template directory
    var traverseDir = function(path){
      fs.readdir(path, function(err, files){

        // error could occur due to given path is a file,
        // or path is not valid 
        // in either case pass the path to static file handler 
        if(err) {
          self.staticFileHandler(path, config);
          return false;
        }

        files.forEach(function(file){
          if(file.indexOf(".mustache") > -1){
            self.fetchAndRender(path + "/" + file, config);
          } else {
            traverseDir(path + "/" + file);
          }
        });
      }); 
    }

    traverseDir(config.template_dir)
  },

  generate: function(){

    var self = this;

    console.log("Generating Site...")

    // default configuration
    var default_config = {
      template_dir: "templates",
      content_dir: "contents",
      output_dir: "public",
      output_extension: "html",
      renderers: {
        "mustache": "./renderers/mustache" 
      },
      parsers: {
        "markdown": "./parsers/markdown" 
      }
    };

    self.extendConfig(default_config, function(config){

      // register renderers
      _.each(config.renderers, function(handler, content_type){
        self.registerRenderer(content_type, handler);
      });

      // register parsers
      _.each(config.parsers, function(handler, content_type){
        self.registerParser(content_type, handler);
      });

      // traverse templates
      self.traverseTemplates(config);
    });

  }

}
