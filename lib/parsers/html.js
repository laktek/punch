/*
 * Parser for Html Fragment templates
*/

module.exports = {

	supportedExtensions: [".html", ".htm"],

	parse: function(input, callback){
		var self = this;
		var output, err;

		try {
			output = input.toString();
		} catch(error){
			err = error;
		}

		return callback(err, output);
	},

	setup: function(config) {
		var self = this;
	}

};
