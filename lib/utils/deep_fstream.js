var events = require("events");
var util = require("util");
var fstream = require("fstream");

// fstream with the ability to traverse through sub-directories
var DeepFstream = function(path){
	events.EventEmitter.call(this);
	var self = this;

	var deep_fstream = function(path, parent_stream){
		var r = fstream.Reader({ path: path });

		r.on("entry", function(entry){
			// pause the stream while the action is completed.
			r.pause();

			if(entry.type === "Directory"){
				// emit directory event
				self.emit("directory", entry, function(skip){
					if (!skip) {
						return deep_fstream(entry.path, r);
					} else {
						return r.resume();
					}
				});
			} else {
				// emit file event
				self.emit("file", entry, function(){
					return r.resume();
				});
			}
		});

		r.on("end", function(){
			if(parent_stream){
				parent_stream.resume();
			}	else {
				self.emit("end");
			}
		});

		r.on("error", function(err) {
			self.emit("error", err);
		});

	};

	deep_fstream(path);
};

util.inherits(DeepFstream, events.EventEmitter);

module.exports = DeepFstream;
