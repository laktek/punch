/*
 * Parser for Markdown templates
 * Based on Marked - https://github.com/chjj/marked
*/
var marked = require("marked");

module.exports = {
	supportedExtensions: [".markdown", ".md"],

	parse: function(input, callback){
		var self = this;
		var output, err;

		//set default options
		marked.setOptions({
			gfm: true,
			pedantic: false,
			sanitize: false 
		});

		try {
			output = marked(input.toString());
		} catch(error){
			err = error;	
		}

		return callback(err, output); 
	}
}
