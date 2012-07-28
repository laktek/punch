var path = require('path');
var fs   = require('fs');
var _    = require("underscore");

var generator = require(path.join(__dirname,'../lib/site_generator.js'));
var server    = require(path.join(__dirname,'../lib/server.js'));
var publisher = require(path.join(__dirname,'../lib/publisher.js'));

var default_config = require("./default_config.js");

var get_config = function(config_file, callback){
  fs.readFile(config_file, function(err, data){

    // if there's an error we assume the config doesn't exist.
    if(err){
      var supplied_config = {}; 
    } else {
      var supplied_config = JSON.parse(data);  
    } 

    callback(supplied_config); 
  });
}

module.exports = {

  setup: function(args){

    var setup_site = function(dir_name){
      // setup site
      fs.mkdir(dir_name + "/templates", function(err){
        if(!err)
          console.log("Created templates directory.");
      }); 

      fs.mkdir(dir_name + "/contents", function(err){
        if(!err)
          console.log("Created contents directory.");
      }); 

      var config_file = '{\n\"template_dir": "templates",\n\"content_dir": "contents",\n\"output_dir": "public",\n\"server": {\n\  "port": 9009\n\ }\n\}';

      fs.writeFile(dir_name + '/config.json', config_file, function (err) {
        if(!err)
          console.log("Created the config.json");
      });
    }

    if(args.length && args[0].length > 1){
      // site name given  
      fs.mkdir(args[0], function(err){
        if(!err) {
          console.log("Setting up Punch in " + args[0] + "."); 
          setup_site(args[0]); 
        }
        else
          console.log("Failed to create the site in given path. Directory already exists?");
      });
    } else {
      console.log("Setting up Punch in current directory.")
      setup_site("."); 
    }
  },

  server: function(args){

    if(args.length && args[0].indexOf(".json") > 1){
      var config_file = args[0];
      var override_port = false;
    } else {
      var config_file = "config.json";
      var override_port = true;
    }

    get_config(config_file, function(supplied_config){

      if(override_port && parseInt(args[0]) > 0){
        supplied_config["server"]["port"] = parseInt(args[0]);
      }

      // start server 
      server.startServer(supplied_config);

    }); 

  }, 

  generate: function(args){
    var config_file = args[0] || "config.json";

    get_config(config_file, function(supplied_config){
		 	var	config = _.extend(_.clone(default_config), supplied_config);
			// setup the generator
      generator.setup(config);

			console.log("Generating site...");
			var start_time = new Date();

      generator.generate(function(){
				var end_time = new Date();
				var duration = (end_time - start_time) / 1000
				console.log("Completed site generation. (" + duration + " seconds)");
			});
    });

  },

	publish: function(args){

		if(args.length && args[0].indexOf(".json") > 1){
      var config_file = args[0];
			var selected_strategy = null;
    } else {
      var config_file = "config.json";
			var selected_strategy = args[0];
    }

    get_config(config_file, function(supplied_config){
			publisher.publish(supplied_config, selected_strategy);	
		});

	},

  version: function(){
    var package_meta = require("../package.json");
    console.log('Punch version ' + package_meta.version);
  },

  help: function(){
    console.log('Usage: punch COMMAND \[ARGS]\n');
    console.log('You can use following commands:');        
    console.log('  setup    - create directory strucutre for Punch. (punch setup PATH)');
    console.log('  server   - start the development server. (punch s [PORT])'); 
    console.log('  publish  - publish the site. (punch p)'); 
    console.log('  generate - generate HTML pages. (punch g)');
    console.log('  version  - show Punch version. (punch v)'); 
    console.log('  help     - show help. (punch h)\n'); 
    console.log('For more information about Punch visit: http://laktek.github.com/punch'); 
  },

  init: function(args){

    var commands = ["setup", "server", "generate", "help", "version"];

    var short_codes = { "s": "server", "g": "generate", "p": "publish", "h": "help", "v": "version" };

    var command = args.shift();

    if(_.include(commands, command)){
      return this[command](args); 
    } else if(_.include(_.keys(short_codes), command)){
      return this[short_codes[command]](args); 
    } else {
      return this["help"]();
    }
  } 

};




