var path = require("path");
var fs = require("fs");

module.exports = {
	outputDir: null, 

	lastUpdated: function(request_path, file_extension, callback){
		var self = this;

		fs.stat(path.join(self.outputDir, (request_path + file_extension)), function(err, stat){
			if(err){
				return callback(err, null);	
			}	

			return callback(null, stat.mtime);
		});	
	},

	get: function(request_path, file_extension, header, callback){
		var self = this;

		var file_path = path.join(self.outputDir, (request_path + file_extension));

		fs.stat(file_path, function(err, stat){
			if(err){
				return callback(err, null);	
			}	

			fs.readFile(file_path, "binary", function(err, cached_content){

				if(err){
					return callback(err, null);	
				}

				header["Content-Length"] = cached_content.length;

				return callback(null, {"body": cached_content, "updated_at": stat.mtime, "options": {"header": header}});
			});
		});
	},

	update: function(request_path, file_extension, body, callback){
		var self = this;

		var file_path = path.join(self.outputDir, (request_path + file_extension));

		fs.writeFile(file_path, body, "binary", function(err){
			return callback(err);	
		});
	}
}
