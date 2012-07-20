var less = require("less");

module.exports = {
	input_extensions: [".less"],

	compile: function(input, callback){
		less.render(input, function (err, output) {
			return callback(err, output);
		});	
	}

}
