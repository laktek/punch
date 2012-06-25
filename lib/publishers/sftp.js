var _ = require("underscore");
var fs = require("fs");
var path = require("path");
var Sftp = require("sftp");
var fstream = require("fstream");

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

	publish: function(supplied_config){

		var self = this;

		var retrieved_options = self.retrieveOptions(supplied_config);
		var upload_path = retrieved_options.upload_path || "./";
		var output_dir = path.join(process.cwd(), supplied_config.output_dir);

		// connect to remote host 
		self.client = self.connectToRemote(retrieved_options, function(){

			// recursively traverse the output directory
			var traverse_directory = function(dir_path, parent_stream){
				var r = fstream.Reader({ path: dir_path });
				r.on("entry", function(entry){

					// pause the stream till action is completed
					r.pause();		

					if(entry.type === "Directory"){

						// check for the directory in remote host
						var remote_dir_path = path.normalize(entry.path.replace(output_dir, upload_path));
						self.client.stat(remote_dir_path, function(err, stats){
							if(err || !stats.isDirectory()){
								// create directory	
								self.client.mkdir(remote_dir_path, 0755, function(err){
									if(err)	
										throw err;
									
									// directory created
									// proceed with traversing files in the directory	
									traverse_directory(entry.path, r);

								});
							}	else {
								// directory exists in remote host
								// proceed with traversing files in the directory	
								traverse_directory(entry.path, r);
							}
						});

					} else {
						// treat the entry as a file
						fs.readFile(entry.path, function(error, buf){

							if(error)
								throw error;

							// upload the file	
							var remote_filename = path.normalize(entry.path.replace(output_dir, upload_path));
							self.client.writeFile(remote_filename, buf, function(err){
								if(err)
									throw err;

								console.log('saved to %s', remote_filename);
								r.resume();
							});
						});
					}
				});

				r.on("end", function(){
					if(parent_stream){
						parent_stream.resume();	
					}	else {
						// no paused streams
						// disconnect from remote host	
						self.client.disconnect(function(){
							console.log("Published the site to %s:%s", retrieved_options.host, retrieved_options.upload_path);	
						});
					}
				});
			}

			traverse_directory(output_dir);
		
		});
	}

}


