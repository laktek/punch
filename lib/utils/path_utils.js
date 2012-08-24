var path = require("path");
var mime = require("mime");

module.exports = {

	getExtension: function(request_path, accept_types) {
		var extension_from_path = path.extname(request_path);

		if (extension_from_path.length) {
			return extension_from_path;
		} else {
			var best_access_type = accept_types.length && accept_types.shift()["mediarange"];

			return "." + (mime.extension(best_access_type) || "html");
		}
	},

	getBasename: function(request_path, file_extension) {
		if(request_path === "/" || request_path === "") {
			return "/index";
		}

		var actual_extension_start_pos = request_path.indexOf(file_extension);
		var expected_extension_start_pos = request_path.length - file_extension.length;

		if ( actual_extension_start_pos > 0 && actual_extension_start_pos === expected_extension_start_pos ) {
			return request_path.substr(0, actual_extension_start_pos);
		} else {
			return request_path;
		}
	}

};
