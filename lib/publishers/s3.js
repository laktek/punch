var _ = require("underscore");
var knox = require("knox");
var mime = require("mime");
var fs = require("fs");
var path = require("path");

var DeepFstream = require("../utils/deep_fstream");

module.exports = {

	client: null,

	lastPublishedDate: null,

	publishOptions: null,

	retrieveOptions: function(supplied_config) {
		var self = this;
		var error = "Cannot find s3 settings in config";

		if (_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "options")) {
			return supplied_config["publish"]["options"];
		} else {
			throw error;
		}
	},

	isModified: function(modified_date) {
		var self = this;

		return ( modified_date > self.lastPublishedDate	);
	},

	copyFile: function(local_path, remote_path, callback) {
		var self = this;

		fs.readFile(local_path, function(error, buf) {
			if (error) {
				throw error;
			}

			var content_headers = {
				"Content-Length": buf.length,
				"Content-Type": mime.lookup(local_path)
			};

			var request_headers = _.extend( _.omit(self.publishOptions, "key", "secret", "bucket"), content_headers);

			var req = self.client.put(remote_path, request_headers);

			req.on("response", function(res) {
				if (parseInt(res.statusCode, 10) === 200) {
					console.log("saved to %s", req.url);
				} else {
					console.log("error occured in copying to %s", req.url);
				}

				callback();
			});

			req.end(buf);
		});
	},

	fetchAndCopyFiles: function(supplied_config, complete) {
		var self = this;
		var output_dir_path = path.join(process.cwd(), supplied_config.output_dir);
		var file_stream = new DeepFstream(output_dir_path);

		file_stream.on("directory", function(entry, callback) {
			return callback();
		});

		file_stream.on("file", function(entry, callback) {
			if (self.isModified(entry.props.mtime)) {
				var relative_path = path.relative(output_dir_path, entry.path);
				return self.copyFile(entry.path, relative_path, callback);
			} else {
				return callback();
			}
		});

		file_stream.on("end", function() {
			return complete();
		});
	},

	publish: function(supplied_config, last_published_date, callback) {
		var self = this;

		self.publishOptions = self.retrieveOptions(supplied_config);

		self.client = knox.createClient( self.publishOptions );

		self.lastPublishedDate = last_published_date;

		return self.fetchAndCopyFiles(supplied_config, callback);
	}

};
