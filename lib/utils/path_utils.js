var _ = require("underscore");
var Path = require("path");
var Mime = require("mime");
var Os = require("os");

module.exports = {

	getExtension: function(request_path, accept_types) {
    // try to get extension from path
		var ext = Path.extname(request_path);

		if (ext.length) {
			return ext;
		}

    var best_access_type = accept_types.length && accept_types.shift()["mediarange"];

    ext = "." + (best_access_type && Mime.extension(best_access_type) || "html");

    return ext;
	},

	getBasename: function(request_path, file_extension) {
		if(request_path === "/" || request_path === "") {
			return Path.sep + "index";
		}

		var actual_extension_start_pos = request_path.indexOf(file_extension);
		var expected_extension_start_pos = request_path.length - file_extension.length;

		if ( actual_extension_start_pos > 0 && actual_extension_start_pos === expected_extension_start_pos ) {
			return request_path.substr(0, actual_extension_start_pos);
		} else {
			return request_path;
		}
	},

	matchPath: function(basePath, patterns) {
		function match(file_path, regex)
		{
			if (Os.platform() === "win32") {
				return file_path.replace(/\\/g, "/").match( new RegExp(regex) );
			}
			return file_path.match( new RegExp(regex) );
		}
		if (Array.isArray(patterns)) {
			return _.any(patterns, function(pattern) {
				return match(basePath, pattern) !== null;
			});
		} else {
			// assume a single pattern given and match directly
			return match(basePath, patterns);
		}
	}
};
