module.exports = {

	run: function(file_path, complete, callback) {
		if (file_path) {
			console.log("Created " + file_path);
		}

		return callback();
	}

};
