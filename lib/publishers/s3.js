var _ = require("underscore");
var knox = require("knox");
var mime = require("mime");
var fs = require("fs");

module.exports = {

	client: null,

	retrieveOptions: function(supplied_config){
		var error = "Cannot find s3 settings in config";

		if(_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "s3"))
			return supplied_config["publish"]["s3"]
		else 
			throw error;
	},

	forEachFileIn: function(dir, callback){

		var self = this;

		fs.readdir(dir, function(read_err, files){
			if(read_err)	
				throw read_err;


			_.each(files, function(file){
				var file_path = dir + "/" + file;

				// check for sub directories
				fs.stat(file_path, function(stat_err, stats){

					if(stat_err)
						throw stat_err;

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

	copyFile: function(file_path){

		var self = this;

		fs.readFile(file_path, function(error, buf){

			if(error)
				throw error;

			var file_path_in_array = file_path.split("/");
			file_path_in_array.shift();
			file_path_without_output_dir = file_path_in_array.join("/");

			var req = self.client.put(file_path_without_output_dir, {
				'Content-Length': buf.length
			, 'Content-Type': mime.lookup(file_path)
			});

			req.on('response', function(res){
				if (200 == res.statusCode) {
					console.log('saved to %s', req.url);
				} else {
					console.log('error occured in copying to %s', req.url);	
				}

			});

			req.end(buf);
		});
	},

	publish: function(supplied_config){

		var self = this;

		// create client
		self.client = knox.createClient(self.retrieveOptions(supplied_config));

		var output_dir = supplied_config.output_dir

		self.forEachFileIn(output_dir, function(file_path){
			// copy the file to the bucket
			self.copyFile(file_path);
		});

	}
}


