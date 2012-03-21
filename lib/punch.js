var fs = require("fs");
var util = require("util");
var _ = require("underscore");

module.exports = {

  registeredRenderers: {},

  registeredParsers: {},

  partials: {},

  callbacksForPartial: {},

  registerRenderer: function(content_type, handler){
    var self = this;

    self.registeredRenderers[content_type] = require(handler); 
  },

  registerParser: function(content_type, handler){
    var self = this;

    self.registeredParsers[content_type] = require(handler); 
  },

  rendererFor: function(content_type){
    var self = this;
    return (new self.registeredRenderers[content_type]); 
  },

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

      // ignore hidden files and files without extensions
      var content_files = files.filter(function(file){ return file.indexOf(".") > 0})

      content_files.forEach(function(file){
        
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

  fetchPartialsInDir: function(path, callback){
    var self = this;
    var partials = {};
    var partial_count = 0;

    fs.readdir(path, function(err, files){
      if(!err){

        var partial_templates = files.filter(function(file){ return (file[0] === "_" && file.indexOf(".mustache") > -1) });
        var partials_count = partial_templates.length;

        if(partials_count === 0) callback({});

        partial_templates.forEach(function(file){
          self.fetchTemplate(path + "/" + file, function(err, template){

            if(!err){
              var identifier = file.split(".").shift().substr(1);
              partials[identifier] = template;
            }

            if(--partials_count === 0){
              callback(partials); 
            };
          }); 
        }); 

      } else {
        // on an error return an empty object
        callback({}); 
      } 
    }); 
  },

  fetchPartialsWithCache: function(path, callback){
    var self = this;

    // check whether partials for given path
    // is available in cache
    if(self.partials[path]){
      callback(self.partials[path]); 

    } else if(self.callbacksForPartial[path]){

      //partials for this path is currently fetched
      //stay in queue to receive it when available
      self.callbacksForPartial[path].push(callback); 

    } else {
      // create a queue of callbacks  
      self.callbacksForPartial[path] = [callback];

      self.fetchPartialsInDir(path, function(partials){

        //set a cache entry
        self.partials[path] = partials;

        // invoke all callbacks (in FIFO order)
        while(self.callbacksForPartial[path].length > 0){
          var queued_callback = self.callbacksForPartial[path].shift(); 
          queued_callback(partials);
        }

      }); 
    }
  },

  fetchPartials: function(path, callback){
    var self = this;  
    var partial_lookup_dirs = path.split("/");
    var partial_lookups_to_wait = partial_lookup_dirs.length;
    var collected_partials = {};

    for(var i = 0; i < partial_lookup_dirs.length; i++){
      var partial_path = partial_lookup_dirs.slice(0, (i+1)).join("/");
      self.fetchPartialsWithCache(partial_path, function(partials){

        _.extend(collected_partials, partials);

        // wait till partial lookups have returned results
        // to invoke the callback
        if(--partial_lookups_to_wait === 0){
          callback(collected_partials); 
        }
      });
    }
  },

  fetchAndRender: function(template_path, config){
    var self = this;

    var content_identifier = template_path.split(/\/|\./);

    //remove the extension from the identifier
    content_type = content_identifier.pop();

    //remove the general template directory name from indentifer
    content_identifier.shift();

    // set the content path
    var content_path = config.content_dir + "/" + content_identifier.join("/");

    // set the partials path
    var parent_dirs = [config.template_dir].concat(content_identifier)
    parent_dirs.pop();
    var partials_path = parent_dirs.join("/");

    // get an instance of renderer
    var renderer = self.rendererFor(content_type);

    // set the handler to save the output
    renderer.afterRender = function(output){
      var output_dirs = [config.output_dir].concat(content_identifier);
      var output_file_path = output_dirs.join("/") + config.output_extension
      output_dirs.pop();

      // if a directory in output path doesn't exist,
      // create it.
      var createOutputDirs = function(path, dir_list, callback){

        var current_output_dir = path + dir_list.shift() + "/";

        var proceedToNextOrCallback = function(){
          if(dir_list.length === 0){
            callback(); 
          } else {
            createOutputDirs(current_output_dir, dir_list, callback); 
          }
        }

        fs.stat(current_output_dir, function(err, stats){
          if(err || !stats.isDirectory()){
            try {
              fs.mkdirSync(current_output_dir);
              console.log("Created " + current_output_dir + " directory");
            }
            catch(e) {
              if(e.code === "EEXIST"){
                proceedToNextOrCallback();
              };
            }

          } 
          proceedToNextOrCallback();
        });

      };

      createOutputDirs("", output_dirs, function(){
        fs.writeFile(output_file_path, output, function(err){
          if(err) throw err;
          console.log("Created " + output_file_path );
        });
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

    // fetch partials
    self.fetchPartials(partials_path, function(partials){
      renderer.setPartials(partials);       
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

        // An error can occur due to given path is a file,
        // or path is not valid 
        // in either case pass the path to static file handler 
        if(err) {
          self.staticFileHandler(path, config);
          return false;
        }

        files.forEach(function(file){
          if(file.indexOf(".mustache") > -1){
            // call render if template is not a partial 
            if(file[0] !== '_'){
              self.fetchAndRender(path + "/" + file, config);
            }
          } else {
            traverseDir(path + "/" + file);
          }
        });


      }); 
    }

    traverseDir(config.template_dir)
  },

  generate: function(supplied_config){

    var self = this;

    console.log("Generating Site...")

    // default configuration
    var default_config = {
      template_dir: "templates",
      content_dir: "contents",
      output_dir: "public",
      output_extension: ".html",
      renderers: {
        "mustache": "./renderers/mustache" 
      },
      parsers: {
        "markdown": "./parsers/markdown" 
      }
    };

    var config = _.extend(_.clone(default_config), supplied_config)

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

  }

}
