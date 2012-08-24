var path = require("path");
var DeepFstream = require("../../lib/utils/deep_fstream");

describe("deep fstream function", function(){

	it("emits directory event for every directory it finds", function(done){
		var file_stream = new DeepFstream(path.join(__dirname, "../sample_directory"));

		var count = 0;

		file_stream.on("directory", function(entry, callback){
			count++;
			callback();
		});

		file_stream.on("file", function(entry, callback){
			callback();
		});

		file_stream.on("end", function(){
			if (count === 2) {
				done();
			}
		});
	});

	it("emits file event for every file it finds (including the ones in sub-directories)", function(done){
		var file_stream = new DeepFstream(path.join(__dirname, "../sample_directory"));

		var count = 0;

		file_stream.on("directory", function(entry, callback){
			callback();
		});

		file_stream.on("file", function(entry, callback){
			count++;
			callback();
		});

		file_stream.on("end", function(){
			if (count === 6) {
				done();
			}
		});
	});

	it("skip reading files in directories marked to be skipped", function(done){
		var file_stream = new DeepFstream(path.join(__dirname, "../sample_directory"));

		var count = 0;

		file_stream.on("directory", function(entry, callback){
			if(entry.basename[0] === ".") {
				return callback(true);
			}

			return callback();
		});

		file_stream.on("file", function(entry, callback){
			count++;
			callback();
		});

		file_stream.on("end", function(){
			if (count === 4) {
				done();
			}
		});
	});

});
