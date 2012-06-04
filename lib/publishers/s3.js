var _ = require("underscore");
var knox = require("knox");
var fs = require("fs");

module.exports = {

	s3Config: function(supplied_config){
		var error = "Cannot find s3 settings in config";

		if(_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "s3"))
			return supplied_config["publish"]["s3"]
		else 
			throw error;
	},

	forEachFileIn: function(dir, callback){

		var self = this;

		fs.readdir(dir, function(err, files){
			if(err)	
				throw err;

			_.each(files, function(file){
				// check for sub directories
				fs.stat(file, function(stats){

					var file_path = dir + "/" + file;

					if(stats.isDirectory()){
						// iterate inside the directory	
						self.forEachFileIn(file_path, callback);
					} else {
						// execute the callback	
						callback(file_path);
					}

				});	
			});
		});

	},

	publish: function(supplied_config){

		var self = this;

		// create client
		var client = knox.createClient(self.s3Config(supplied_config));
		
		var output_dir = supplied_config.output_dir

		self.forEachFileIn(output_dir, function(){
			// copy it to the bucket
		});

	}
}


