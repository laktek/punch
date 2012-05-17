var fs = require("fs");
var util = require("util");
var child_process = require('child_process');
var path = require("path");
var _ = require("underscore");

var default_config = require("./default_config.js");

module.exports = {

  config: {},

  onComplete: {},

  onEach: function(){},

  registeredRenderers: {},

  registeredParsers: {},

  partials: {},

  callbacksForPartial: {},

  sharedContent: null, 

  runningActions: 0,

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
  
  registerLayout: function(layout_name){
	var self = this;
	self.layout_name = layout_name;
	var filename_and_extensions = self.layout_name.split(".");
    
    // get the rendering content type from the extensions 
    var content_type = filename_and_extensions.pop();
	self.layout_renderer = self.rendererFor(content_type);
	
	self.fetchTemplate(self.config.template_dir + '/' + layout_name,function(err, data){
		if(err){
			self.layout = false;
			console.log("Could not register global layout:" + layout_name); 
			return;
		}
		else{
			self.layout = layout_name;
			self.layout_renderer.setTemplate(data);
		}
	}); 
  },
  incrementRunningActions: function(){
    var self = this;
    self.runningActions++;
  },

  decrementAndCompleteRunningActions: function(){
    var self = this;

    if(--self.runningActions === 0){
      self.onComplete(); 
    }    
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

    // check for given path
    fetchForPath(path, function(content){
      callback(content); 
    }); 
  },

  // fetches shared content with caching
  fetchSharedContent: function(path, callback){
    var self = this; 

    if(!self.sharedContent){
      // cache the content
      self.fetchContent(path, function(content){
        self.sharedContent = content; 
        callback(self.sharedContent); 
      }); 
    } else {
      //serve the content from the cache
      callback(self.sharedContent); 
    }
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

  renderLayout: function(content, partials, template_content, func){
	var self = this;
	self.layout_renderer.setContent({"content":content, "template":template_content});
	self.layout_renderer.afterRender = func;
	self.layout_renderer.setPartials(partials);
  },

  fetchAndRender: function(template_path){
    var self = this;

    var content_identifier = template_path.split("/");

    // seperate the extensions from the content identifier
    var filename_and_extensions = content_identifier[content_identifier.length -1].split(".");
    content_identifier[content_identifier.length -1] = filename_and_extensions.shift();

    // get the rendering content type from the extensions 
    var content_type = filename_and_extensions.pop();

    // get the intended extension
    var intended_extension = filename_and_extensions.pop() || self.config.output_extension;

    //remove the template directory name from indentifer
    content_identifier.shift();

    // set the content path
    var content_path = self.config.content_dir + "/" + content_identifier.join("/");

    // set the partials path
    var parent_dirs = [self.config.template_dir].concat(content_identifier)
    parent_dirs.pop();
    var partials_path = parent_dirs.join("/");

    // get an instance of renderer
    var renderer = self.rendererFor(content_type);

    // set the handler to save the output
	var save_to_disk =  function(output){
      var output_dirs = [self.config.output_dir].concat(content_identifier);
      var output_file_path = output_dirs.join("/");

      // set the extension if the output file path doesn't already have an extension 
      output_file_path = output_file_path + "." + intended_extension;

      fs.writeFile(output_file_path, output, function(err){
        if(err) throw err;
        self.onEach("render", output_file_path);

        // decrement running actions
        self.decrementAndCompleteRunningActions();
      });
    };
    // increment running actions
    self.incrementRunningActions();

    // fetch template
    self.fetchTemplate(template_path, function(err, template){
      if(!err){
        renderer.setTemplate(template);       
      } else {
        console.log(err); 
      }
    });
	
	var template_contents; //used to pass to the layout

    // fetch content (with shared content)
    self.fetchSharedContent(self.config.content_dir + "/" + self.config.shared_content, function(shared_content){
      self.fetchContent(content_path, function(content){
		template_contents = _.extend(shared_content, content);
        renderer.setContent(template_contents);       
      });
    });

    // fetch partials
    self.fetchPartials(partials_path, function(partials){
		//render the layout if layout is configured
		if(self.layout)
			renderer.afterRender = function(output){
			self.renderLayout(output, partials, template_contents, save_to_disk);
		}
		else{
			renderer.afterRender = save_to_disk;
		}
	
      renderer.setPartials(partials);       
    });

  },

  staticFileHandler: function(source_file){

    var self = this;

    var source_directory_path = source_file.split("/");
    source_directory_path[0] = self.config.output_dir;
    var destination_path = source_directory_path.join("/");

    var copy_command = "cp " + source_file + " " + destination_path;
    
    // increment running actions
    self.incrementRunningActions();

    // copy the file to destination 
    child_process.exec(copy_command, function(err, stdout, stderr) {
      if(err) throw err;
      self.onEach("copy", path.join(self.config.output_dir, source_file));

      // decrement running actions
      self.decrementAndCompleteRunningActions();
    });
  },

  traverseTemplates: function(){
    var self = this;

    var traverseDir = function(path){
      fs.readdir(path, function(err, files){

        // if not a directory try to read it as a statc file
        if(err) {
          self.staticFileHandler(path);
          return false;
        }

        //create sub directories in the output path
        if(path !== self.config.template_dir){
          var output_path = path.split("/");
          output_path[0] = self.config.output_dir;

          try {
            // Create the output directory
            fs.mkdirSync(output_path.join("/"));
          }
          catch(err){
            // we can ignore the errors
            // since failing to create a directory means 
            // it already exists.
            // or destination is not writeable.
          }
        }

        files.forEach(function(file){
          // render file extention should always be at the end of the filename
          // TODO: Generalize this check to support other render types other than
          // mustache.
		  if(self.config.layout && file == self.config.layout)
			return;
          if(file.indexOf(".mustache") > 0 && (file.indexOf(".mustache") - (file.length - ".mustache".length) === 0)){
            // call render if template is not a partial 
            if(file[0] !== '_'){
              self.fetchAndRender(path + "/" + file);
            }
          } else {
            traverseDir(path + "/" + file);
          }
        });


      }); 
    }

    // Start traversing through template directory
    traverseDir(self.config.template_dir);
  },

  prepareOutputDirectory: function(){

    var self = this;

    // Check whether the output directory exists
    fs.stat(self.config.output_dir, function(err, stats){

      if(err || !stats.isDirectory()){
        // Create the output directory
        fs.mkdirSync(self.config.output_dir);
      }

      // traverse templates
      self.traverseTemplates();
    });
  },
  
  generate: function(supplied_config){

    var self = this;

    // extend the default configuration
    self.config = _.extend(_.clone(default_config), supplied_config);

    var on_start = (typeof self.config.on_start === "function") ? self.config.on_start : function(c){ c() };
    var on_complete = (typeof self.config.on_complete === "function") ? self.config.on_complete : function(){ };
    var on_each = (typeof self.config.on_each === "function") ? self.config.on_each : function(){ };

    // register renderers
    _.each(self.config.renderers, function(handler, content_type){
      self.registerRenderer(content_type, handler);
    });

    // register parsers
    _.each(self.config.parsers, function(handler, content_type){
      self.registerParser(content_type, handler);
    });
	
	// register the global layout
	if(self.config.layout){
		self.registerLayout(self.config.layout);
	}

    self.onComplete = on_complete;

    self.onEach = on_each;

    // reset instance variables 
    // TODO: Refactor to a proper initializer
    self.runningActions = 0;
    self.partials = {};
    self.callbacksForPartial = {};
    self.sharedContent = null;

    // run the before filter function
    on_start(function(){
      // prepare output directory
      self.prepareOutputDirectory();
    });
    
  }

}
