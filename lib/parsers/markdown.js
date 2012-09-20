/*
 * Parser for Markdown templates
 * Based on Marked - https://github.com/chjj/marked
*/
var marked = require("marked");
var _ = require("underscore");

module.exports = {

	markedOptions: {},

	supportedExtensions: [".markdown", ".md"],

	parse: function(input, callback){
		var self = this;
		var output, err;

		marked.setOptions(self.markedOptions);

		try {
			output = marked.parse(input.toString());
		} catch(error){
			err = error;
		}

		return callback(err, output);
	},

	setup: function(config) {
		var self = this;
		var default_marked_options = { gfm: true, pedantic: false, sanitize: false };

		if (config.parser) {
			self.markedOptions = _.extend(default_marked_options, config.parser.markdown);
		} else {
			self.markedOptions = default_marked_options;
		}
	}

};
