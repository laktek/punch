var path = require("path");
var child_process = require("child_process");
var _ = require("underscore");

var project_creator = require(path.join(__dirname, "../lib/project_creator.js"));
var generator = require(path.join(__dirname, "../lib/site_generator.js"));
var server = require(path.join(__dirname, "../lib/server.js"));
var publisher = require(path.join(__dirname, "../lib/publisher.js"));
var config_handler = require(path.join(__dirname, "../lib/config_handler.js"));

module.exports = {

	notifyIfOutdated: function(callback) {
		child_process.exec("npm outdated punch", function(err, stdout, stderr) {
			if (stdout.trim() !== "") {
				console.log("There's a new version of Punch available. You can upgrade to it by running `npm install -g punch`");
				console.log("[" + stdout + "]");
			}

			return callback();
		});
	},

  setup: function(args) {
		var self = this;

		self.notifyIfOutdated(function() {
			var template_path = null;

			_.any(args, function(arg, i) {
				if (arg === "-t" || arg === "--template") {
					template_path = args[i + 1];

					args.splice(i, 2);

					return true;
				} else {
					return false;
				}
			});

			if (template_path) {
				return project_creator.createStructure(args.pop(), template_path);
			} else {
				return project_creator.createStructure(args.pop());
			}
		});
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

      generator.generate(function() {
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

  version: function() {
		var self = this;

		self.notifyIfOutdated(function() {
			var package_meta = require("../package.json");
			console.log("Punch version " + package_meta.version);
		});
	},

  help: function() {
		var self = this;

		self.notifyIfOutdated(function() {
			console.log("Usage: punch COMMAND [ARGS]\n");
			console.log("You can use following commands:");
			console.log("  setup    - create a new site structure in the given path. (punch setup PATH [-t TEMPLATE_PATH])");
			console.log("  server   - start the Punch server. (punch s [PORT])");
			console.log("  publish  - publish the site. (punch p)");
			console.log("  generate - generate all pages in the site. (punch g)");
			console.log("  version  - version of the Punch installation. (punch v)");
			console.log("  help     - show help. (punch h)\n");
			console.log("For more information about Punch visit: http://laktek.github.com/punch");
		});
  },

  init: function(args) {
		var self = this;

    var commands = ["setup", "server", "generate", "publish", "help", "version"];

    var short_codes = { "s": "server", "g": "generate", "p": "publish", "h": "help", "v": "version", "-v": "version" };

    var command = args.shift();

    if(_.include(commands, command)){
      return self[command](args);
    } else if(_.include(_.keys(short_codes), command)){
      return self[short_codes[command]](args);
    } else {
      return self["help"]();
    }
  }

};
