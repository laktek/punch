var less = require("less");
var path = require("path");

module.exports = {
	input_extensions: [".less"],
	force_compile: true,

	compile: function(input, filename, callback){
		var options = { "filename": filename, "paths": [ path.dirname(filename) ] };
		less.render(input, options, function (err, output) {
			return callback(err, output);
		});
	}

};
