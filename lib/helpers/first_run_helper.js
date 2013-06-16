var Fs = require("fs");
var Path = require("path");

var tag_helpers = {

	first_run: function() {
		var first_run_js = Fs.readFileSync(Path.join(__dirname, "first_run/first_run.js"));
		var first_run_css = Fs.readFileSync(Path.join(__dirname, "first_run/first_run.css"));

		var output_string = "<script type=\"text/javascript\">" + first_run_js + "</script>";
		output_string = output_string + "<style>" + first_run_css + "</style>";
		return output_string;
	}

};

module.exports = {

	get: function(basePath, file_extension, options, callback){
		var self = this;

		return callback(null, { "tag": tag_helpers }, {});
	}

};
