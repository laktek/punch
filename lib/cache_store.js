var path = require("path");
var fs = require("fs");

var getBasepath = function(request_path){
	var request_path_portions = String(request_path).split(".");
	//remove the extension
	if(request_path_portions.length > 1){
		request_path_portions.pop(); 
	}
	return request_path_portions.join(".");
}

module.exports = {
	outputDir: null, 

	//setup the module
	setup: function(config){
		var self = this;	
		self.outputDir = config.output_dir;
	},

	lastUpdated: function(request_path, file_extension, callback){
		var self = this;

		fs.stat(path.join(self.outputDir, (getBasepath(request_path) + file_extension)), function(err, stat){
			if(err){
				return callback(err, null);	
			}	

			return callback(null, stat.mtime);
		});	
	},

	get: function(request_path, file_extension, header, callback){
		var self = this;
		var cache_obj = {"body": null, "updated_at": null, "options": {"header": header}};

		var file_path = path.join(self.outputDir, (getBasepath(request_path) + file_extension));

		fs.stat(file_path, function(err, stat){
			if(err){
				return callback(err, cache_obj);	
			}	

			fs.readFile(file_path, "binary", function(err, cached_content){

				cache_obj.body = cached_content;
				cache_obj.updated_at = stat.mtime;
				cache_obj.options.header["Content-Length"] = (cached_content && cached_content.length || 0);

				return callback(err, cache_obj);
			});
		});
	},

	update: function(request_path, file_extension, body, callback){
		var self = this;

		var file_path = path.join(self.outputDir, (getBasepath(request_path) + file_extension));

		// TODO: Create directories
		fs.writeFile(file_path, body, "binary", function(err){
			return callback(err);	
		});
	}
}
