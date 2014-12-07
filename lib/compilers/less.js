var Less = require("less");
var Path = require("path");

module.exports = {
	input_extensions: [".less"],
	force_compile: true,

	compile: function(input, filename, callback) {
		var options = { "filename": filename, "paths": [ Path.dirname(filename) ] };
		Less.render(input, options, function (err, output) {
      var error_msg = null;
      if (err) {
        error_msg = "Less parsing error: " + err.message;
      }
      if (output && typeof(output) === "object") {
        output = output.css;
      }
			return callback(error_msg, output);
		});
	}

};
