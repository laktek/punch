var _ = require("underscore");
var fs = require("fs");
var Sftp = require("node-sftp");

var fileutils = require("../helpers/fileutils");

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

	connectToRemote: function(supplied_config){
		// correct the private key
		if(_.has(supplied_config, "private_key")){
			supplied_config["privateKey"] = supplied_config["private_key"];	
		}

		return new Sftp(supplied_config, function(error){
			if(error)	
				throw error;
		});
	},

	setFilePath: function(file_path, upload_path){
		
		var self = this;

		// copy the file
		fs.readFile(file_path, function(error, buf){

			if(error)
				throw error;

			// cancel any existing disconnect timeouts	
			clearTimeout(self.timeoutId);

			// get the filename and remote path to copy the file
			var file_path_in_array = file_path.split("/");
			var file_name = file_path_in_array.pop();
			file_path_in_array[0] = upload_path;
			var expected_remote_path = file_path_in_array.join("/");

			// change the remote path to expected path
			self.client.cd(expected_remote_path, function(err){
				if(err){
					// let's try to creating the directories in remote path
					// first, check the upload path exists
					self.client.cd(file_path_in_array.shift(), function(err){
						if(err)	
							throw err; //upload path doesn't exist, throw an error and cancel the process

						//recursively change the remote path while creating missing directories
						var change_or_create_remote_directory = function(){
							var current_dir = file_path_in_array.shift();

							self.client.cd(current_dir, function(err){
								if(err){
									// try to create directory	
									self.client.mkdir(current_dir, 0755, function(err){
										if(err)
											throw err;	

										if(file_path_in_array.length > 0){
											change_or_create_remote_directory();	
										} else {
											// upload file	
											self.uploadFile(file_name, buf);
										}
									});
								} else {
									if(file_path_in_array.length > 0){
										change_or_create_remote_directory();	
									} else {
										// upload file	
										self.uploadFile(file_name, buf);
									}
								}
							});
						}

						change_or_create_remote_directory();

					});
				} else {
					// upload file	
					self.uploadFile(file_name, buf);
				}
			});
		});
	},

	uploadFile: function(file_name, content){
		var self = this;

		self.client.writeFile(file_name, content, function(err){
			if(err)
				throw err;

			console.log('saved %s', file_name);

			// set a new timeout to disconnect the connection
			self.timeoutId = setTimeout(function(){
				self.client.disconnect();	
			}, 500);
		});
	},

	publish: function(supplied_config){

		var self = this;

		var retrieved_options = self.retrieveOptions(supplied_config);

		// connect to remote host 
		self.client = self.connectToRemote(retrieved_options);

		var upload_path = retrieved_options.upload_path || "./";
		var output_dir = supplied_config.output_dir

		// recursively upload the files
		fileutils.forEachFileIn(output_dir, function(file_path){
			self.setFilePath(file_path, upload_path);	
		});
	}

}


