var path = require("path");
var mime = require("mime");

module.exports = {

	getExtension: function(request_path, accept_types){
		var extension_from_path = path.extname(request_path);

		if(extension_from_path.length){
			return extension_from_path;
		} else {
			var best_access_type = accept_types.length && accept_types.shift()["mediarange"];		

			return "." + (mime.extension(best_access_type) || "html");
		}
	},

};
