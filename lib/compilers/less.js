var Less = require("less");
var Path = require("path");

module.exports = {
	input_extensions: [".less"],
	force_compile: true,

	compile: function(input, filename, callback){
		var options = { "filename": filename, "paths": [ Path.dirname(filename) ] };
		Less.render(input, options, function (err, output) {
			return callback(err, output);
		});
	}

};
