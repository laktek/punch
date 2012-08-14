module.exports = {
	run: function(file_path, callback) {
		if (file_path) {
			console.log("Created " + file_path);	
		}

		return callback();
	}
}
