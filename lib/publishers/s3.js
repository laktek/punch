var _ = require("underscore");
var knox = require("knox");
var mime = require("mime");
var fs = require("fs");
var path = require("path");
var DeepFstream = require("../utils/deep_fstream"); 

module.exports = {

	client: null,

	retrieveOptions: function(supplied_config){
		var error = "Cannot find s3 settings in config";

		if(_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "s3"))
			return supplied_config["publish"]["s3"]
		else 
			throw error;
	},

	copyFile: function(file_path, remote_path, callback){

		var self = this;

		fs.readFile(file_path, function(error, buf){

			if(error)
				throw error;

			var req = self.client.put(remote_path, {
				'Content-Length': buf.length
			, 'Content-Type': mime.lookup(file_path)
			});

			req.on('response', function(res){
				if (200 == res.statusCode) {
					console.log('saved to %s', req.url);
				} else {
					console.log('error occured in copying to %s', req.url);	
				}

				callback();

			});

			req.end(buf);
		});
	},

	fetchAndCopyFiles: function(supplied_config){
		var self = this;
		var file_stream = new DeepFstream(supplied_config.output_dir);
		var output_dir_path = path.join(process.cwd(), supplied_config.output_dir);

		file_stream.on("directory", function(entry, callback){
			callback();
		});

		file_stream.on("file", function(entry, callback){
			var relative_path = path.relative(output_dir_path, entry.path);
			return self.copyFile(entry.path, relative_path, callback);
		});

		file_stream.on("end", function(){
			console.log("Published the site to S3");	
		});
	},	

	publish: function(supplied_config){

		var self = this;

		// create client
		self.client = knox.createClient(self.retrieveOptions(supplied_config));

		// recursively traverse the output directory
		self.fetchAndCopyFiles(supplied_config);

	}
}


