var UglifyJs = require("uglify-js");

module.exports = {
	compiler_options: {},

	input_extensions: [".js"],

	minify: function(input, callback) {
		var self = this;
		var output, err;

		try {
			output = UglifyJs.minify(input, {
				fromString: true
			}).code;
		} catch(error) {
			err = error;
		}

		return callback(err, output);
	}
};
