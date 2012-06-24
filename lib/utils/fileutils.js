var _ = require("underscore");
var fs = require("fs");

module.exports = {
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
}
