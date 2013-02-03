var coffee_script = require("coffee-script");

module.exports = {
	//compiler_options: {},
	force_compile: false,

	input_extensions: [".coffee"],

	compile: function(input, filename, callback){
		var self = this;
		var output, err;

		try {
			output = coffee_script.compile(input);
		} catch(error) {
			err = error;
		}

		return callback(err, output);
	}

};


