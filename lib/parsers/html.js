/*
 * Parser for Html Fragment templates
*/

module.exports = {

	supportedExtensions: [".html", ".htm"],

	parse: function(input, callback){
		var output, err;

		try {
			output = input.toString();
		} catch(error){
			err = error;
		}

		return callback(err, output);
	},

	setup: function(/*config*/) {
        // Nothing to setup, config not needed
	}

};
