module.exports = {

	run: function(file_path, options, callback) {
		var modified = options.modified || false;
		var finished = options.finished || false;

		if (file_path && modified) {
			console.log("Created " + file_path);
		} else if (file_path && !modified) {
			process.stdout.write(".");
		}

		return callback();
	}

};
