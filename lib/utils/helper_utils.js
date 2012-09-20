module.exports = {

	checkArgs: function() {
		var args, condition, callback;

		if (arguments.length === 3) {
			args = arguments[0];
			condition = arguments[1];
			callback = arguments[2];
		} else {
			args = arguments[0];
			condition = function(arg) { return false; };
			callback = arguments[1];
		}

		if ( args.length === 1 && (args[0] === undefined || args[0] === null || typeof args[0] === "string" || condition(args[0]) )) {
			return callback(args[0]);
		}	else {
			throw "[Error: Invalid parameters.]";
		}
	}

};
