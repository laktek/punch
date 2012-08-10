var path = require("path");
var fs = require("fs");

module.exports = {
	outputDir: null, 

	//setup the module
	setup: function(config){
		var self = this;	
		self.outputDir = config.output_dir;
	},

	stat: function(request_basename, file_extension, callback){
		var self = this;

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		fs.stat(file_path, function(err, stat){
			if(err){
				return callback(err);	
			}	

			return callback(null, { "mtime": stat.mtime, "size": stat.size });
		});	
	},

	get: function(request_basename, file_extension, header, callback){
		var self = this;
		var cache_obj = {"body": null, "options": {"header": header}};

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		fs.stat(file_path, function(err, stat){
			if(err){
				return callback(err, cache_obj);	
			}	

			fs.readFile(file_path, "binary", function(err, cached_content){

				cache_obj.body = cached_content;
				cache_obj.options.header["Content-Length"] = (cached_content && cached_content.length || 0);
				cache_obj.options.header["ETag"] = '"' + stat.size + '-' + Number(stat.mtime) + '"'
				cache_obj.options.header["Last-Modified"] = new Date(stat.mtime).toUTCString();

				return callback(err, cache_obj);
			});
		});
	},

	update: function(request_basename, file_extension, body, header, callback){
		var self = this;

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		var dir_path_portions = path.dirname(file_path).split(path.sep || "/");

		var writeToCache = function() {
			fs.writeFile(file_path, body, "binary", function(err){
				if (err) {
					return callback(err);	
				}

				self.stat(file_path, file_extension, function(err, stat){
					if (err) {
						return callback(err, null);	
					}

					var cache_obj = { "body": body, "options": { "header": header } };
					cache_obj.options.header["Content-Length"] = (body && body.length || 0);
					cache_obj.options.header["ETag"] = '"' + stat.size + '-' + Number(stat.mtime) + '"'
					cache_obj.options.header["Last-Modified"] = new Date(stat.mtime).toUTCString();

					return callback(err, cache_obj);
				});
			});
		}

		var checkAndCreateDir = function(dirpath){
			fs.stat(dirpath, function(err, stat){
				if(err || !stat.isDirectory()){
					fs.mkdir(dirpath, function(err){
						return checkAndCreateDirCallback(dirpath);
					});	
				} else {
					return checkAndCreateDirCallback(dirpath);
				}
			});	
		}

		var checkAndCreateDirCallback = function(current_path){
			if(dir_path_portions.length){
				var next_dirpath = path.join(current_path, dir_path_portions.shift());	
				return checkAndCreateDir(next_dirpath);
			} else {
				return writeToCache();	
			}
		}
		checkAndCreateDirCallback("");
		
	}
}
