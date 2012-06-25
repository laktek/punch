var _ = require("underscore");
var fs = require("fs");
var path = require("path");
var Sftp = require("sftp");
var DeepFstream = require("../utils/deep_fstream"); 

module.exports = {

	client: null,

	timeoutId: null,

	retrieveOptions: function(supplied_config){
		var error = "Cannot find sftp settings in config";

		if(_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "sftp"))
			return supplied_config["publish"]["sftp"]
		else 
			throw error;
	},

	connectToRemote: function(supplied_config, callback){
		// correct the private key
		if(_.has(supplied_config, "private_key")){
			supplied_config["privateKey"] = supplied_config["private_key"];	
		}

		return new Sftp(supplied_config, callback); 
	},

	checkAndCreateDirectoryInRemote: function(remote_dir_path, callback){
		var self = this;

		// check for the directory in remote host
		self.client.stat(remote_dir_path, function(err, stats){
			if(err || !stats.isDirectory()){
				// create directory	
				self.client.mkdir(remote_dir_path, 0755, function(err){
					if(err)	
						throw err;
					
					// directory created
					// proceed with traversing files in the directory	
					callback();
				});
			}	else {
				// directory exists in remote host
				// proceed with traversing files in the directory	
				callback();
			}
		});
	},

	uploadFile: function(local_path, remote_path, callback){
		var self = this;

		fs.readFile(local_path, function(error, buf){
			if(error)
				throw error;

			// upload the file	
			self.client.writeFile(remote_path, buf, function(err){
				if(err)
					throw err;

				console.log('saved to %s', remote_path);
				callback();
			});
		});
	},

	publish: function(supplied_config){

		var self = this;

		var retrieved_options = self.retrieveOptions(supplied_config);
		var upload_path = retrieved_options.upload_path || "./";
		var output_dir = path.join(process.cwd(), supplied_config.output_dir);

		// connect to remote host 
		self.client = self.connectToRemote(retrieved_options, function(){

			// recursively traverse the output directory
			var file_stream = new DeepFstream(output_dir);

			file_stream.on("directory", function(entry, callback){
				var remote_dir_path = path.normalize(entry.path.replace(output_dir, upload_path));
				self.checkAndCreateDirectoryInRemote(remote_dir_path, callback);	
			});

			file_stream.on("file", function(entry, callback){
				var remote_path = path.normalize(entry.path.replace(output_dir, upload_path));
				self.uploadFile(entry.path, remote_path, callback);
			});

			file_stream.on("end", function(){
				// disconnect from remote host	
				self.client.disconnect(function(){
					console.log("Published the site to %s:%s", retrieved_options.host, retrieved_options.upload_path);	
				});
			});
		
		});
	}

}


