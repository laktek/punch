var fs = require("fs");
var path = require("path");

var tag_helpers = {

	first_run: function() {
		var first_run_js = fs.readFileSync(path.join(__dirname, "first_run/first_run.js"));
		var first_run_css = fs.readFileSync(path.join(__dirname, "first_run/first_run.css"));

		var output_string = "<script type=\"text/javascript\">" + first_run_js + "</script>";
		output_string = output_string + "<style>" + first_run_css + "</style>";
		return output_string;
	}

};

module.exports = {

	get: function(basepath, file_extension, options, callback){
		var self = this;

		return callback(null, { "tag": tag_helpers }, {});
	}

};
