var cssminPkg = require("cssmin");

module.exports = {
	input_extensions: [".css"],

	minify: function(input, callback) {
		var self = this;
		var output, err;

		try {
			output = cssminPkg.cssmin(input);
		} catch(error) {
			err = error;
		}

		return callback(err, output);
	}

};
