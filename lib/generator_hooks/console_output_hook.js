module.exports = {
	run: function(file_path, callback) {
		console.log("Created " + file_path);	
		return callback();
	}
}
