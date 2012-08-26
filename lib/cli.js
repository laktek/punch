var path = require("path");
var _ = require("underscore");

var setup = require(path.join(__dirname, "../lib/setup.js"));
var generator = require(path.join(__dirname, "../lib/site_generator.js"));
var server = require(path.join(__dirname, "../lib/server.js"));
var publisher = require(path.join(__dirname, "../lib/publisher.js"));
var config_handler = require(path.join(__dirname, "../lib/config_handler.js"));

module.exports = {

  setup: function(args) {
		return setup.bare_structure(args[0]);
	},

  server: function(args){
		var config_path, overriden_port;

    if (args.length && args[0].match(/^\d+$/)) {
			config_path = null;
			overriden_port = parseInt(args[0], 10);
    } else {
      config_path = args[0];
      overriden_port = null;
    }

    config_handler.getConfig(config_path, function(config){
      if (overriden_port) {
        config["server"]["port"] = overriden_port;
      }

      return server.startServer(config);
    });
  },

  generate: function(args) {
		var config_path = ( args[0] !== "--blank" ) && args[0];

		var blank = ( args.indexOf("--blank") > -1 );

    config_handler.getConfig(config_path, function(config){

			config.generator.blank = config.generator.blank || blank;

      generator.setup(config);

			console.log("Generating site...");
			var start_time = new Date();

      generator.generate(function(){
				var end_time = new Date();
				var duration = ( (end_time - start_time) / 1000 );
				console.log("Completed site generation. (" + duration + " seconds)");
			});
    });
  },

	publish: function(args){
		var config_path = args[0];

    config_handler.getConfig(config_path, function(config){
			publisher.publish(config);
		});
	},

  version: function(){
    var package_meta = require("../package.json");
    console.log("Punch version " + package_meta.version);
  },

  help: function(){
    console.log("Usage: punch COMMAND [ARGS]\n");
    console.log("You can use following commands:");
    console.log("  setup    - create directory strucutre for Punch. (punch setup PATH)");
    console.log("  server   - start the development server. (punch s [PORT])");
    console.log("  publish  - publish the site. (punch p)");
    console.log("  generate - generate HTML pages. (punch g)");
    console.log("  version  - show Punch version. (punch v)");
    console.log("  help     - show help. (punch h)\n");
    console.log("For more information about Punch visit: http://laktek.github.com/punch");
  },

  init: function(args){

    var commands = ["setup", "server", "generate", "publish", "help", "version"];

    var short_codes = { "s": "server", "g": "generate", "p": "publish", "h": "help", "v": "version", "-v": "version" };

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
