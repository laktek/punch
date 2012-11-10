module.exports = {

	run: function(file_path, options, callback) {
		var modified = options.modified || false;
		var finished = options.finished || false;

		if (file_path && modified) {
			console.log("Created " + file_path);
		} else if (file_path && !modified) {
			console.log("Not modified " + file_path);
		}

		return callback();
	}

};
