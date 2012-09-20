var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

module.exports = {
	compiler_options: {},

	input_extensions: [".js"],

	minify: function(input, callback) {
		var self = this;
		var output, err;

		try {
			var ast = jsp.parse(input); // parse code and get the initial AST
			ast = pro.ast_mangle(ast); // get a new AST with mangled names
			ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
			output = pro.gen_code(ast); // compressed code here
			output = output.replace(/;*$/, ";"); //add a semi-colon to the end
		} catch(error) {
			err = error;
		}

		return callback(err, output);
	}
};
