module.exports = {

	check_args: function() {
		if (arguments.length === 3) {
			var args = arguments[0];
			var condition = arguments[1];
			var callback = arguments[2];
		} else {
			var args = arguments[0];
			var condition = function(arg) { return false };
			var callback = arguments[1];
		}

		if ( args.length === 1 && (args[0] === undefined || args[0] === null || typeof args[0] === "string" || condition(args[0]) )) {
			return callback(args[0]);
		}	else {
			throw "[Error: Invalid parameters.]"	
		}
	}

}
