var path = require("path");
var fs = require("fs");

var DeepFstream = require("./utils/deep_fstream");
var module_utils = require("./utils/module_utils");

module.exports = {
	outputDir: null,

	templates: null,

	contents: null,

	setup: function(config){
		var self = this;
		self.outputDir = config.output_dir;

		self.templates = module_utils.requireAndSetup(config.plugins.template_handler, config);
		self.contents = module_utils.requireAndSetup(config.plugins.content_handler, config);
	},

	stat: function(request_basename, file_extension, request_options, callback) {
		var self = this;

		if (self.templates.isSection(request_basename) || self.contents.isSection(request_basename)) {
			request_basename = path.join(request_basename, "index");
		}

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		fs.stat(file_path, function(err, stat) {
			if(err){
				return callback(err);
			}

			return callback(null, { "mtime": stat.mtime, "size": stat.size });
		});
	},

	get: function(request_basename, file_extension, rendered_obj, request_options, callback){
		var self = this;
		var header = (rendered_obj.options && rendered_obj.options.header) || {};
		var cache_obj = {"body": null, "options": {"header": header}};
		var encoding = (file_extension === ".html") ? "utf8" : "binary";

		if (self.templates.isSection(request_basename) || self.contents.isSection(request_basename)) {
			request_basename = path.join(request_basename, "index");
		}

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		fs.stat(file_path, function(err, stat){
			if(err){
				return callback(err, cache_obj);
			}

			fs.readFile(file_path, encoding, function(err, cached_content){

				cache_obj.body = cached_content;
				cache_obj.options.header["Content-Length"] = (cached_content && cached_content.length || 0);
				cache_obj.options.header["ETag"] = ("\"" + stat.size + "-" + Number(stat.mtime.getTime()) + "\"");
				cache_obj.options.header["Last-Modified"] = stat.mtime.toUTCString();

				return callback(err, cache_obj);
			});
		});
	},

	update: function(request_basename, file_extension, rendered_obj, request_options, callback){
		var self = this;
		var body = rendered_obj.body;
		var header = (rendered_obj.options && rendered_obj.options.header) || {};
		var encoding = (file_extension === ".html") ? "utf8" : "binary";

		if (self.templates.isSection(request_basename) || self.contents.isSection(request_basename)) {
			request_basename = path.join(request_basename, "index");
		}

		var file_path = path.join(self.outputDir, (request_basename + file_extension));

		var dir_path_portions = path.dirname(file_path).split(path.sep || "/");

		var write_to_cache = function() {
			fs.writeFile(file_path, body, encoding, function(err){
				if (err) {
					return callback(err);
				}

				self.stat(request_basename, file_extension, request_options, function(err, stat){
					if (err) {
						return callback(err, null);
					}

					var cache_obj = { "body": body, "options": { "header": header } };
					cache_obj.options.header["Content-Length"] = (body && body.length || 0);
					cache_obj.options.header["ETag"] = ("\"" + stat.size + "-" + stat.mtime.getTime() + "\"");
					cache_obj.options.header["Last-Modified"] = stat.mtime.toUTCString();

					return callback(err, cache_obj);
				});
			});
		};

		var check_and_create_dir = function(dirpath){
			fs.stat(dirpath, function(err, stat){
				if(err || !stat.isDirectory()){
					fs.mkdir(dirpath, function(){
						return check_and_create_dir_callback(dirpath);
					});
				} else {
					return check_and_create_dir_callback(dirpath);
				}
			});
		};

		var check_and_create_dir_callback = function(current_path){
			if(dir_path_portions.length){
				var next_dirpath = path.join(current_path, dir_path_portions.shift());
				return check_and_create_dir(next_dirpath);
			} else {
				return write_to_cache();
			}
		};
		check_and_create_dir_callback("");
	},

	clear: function(callback) {
		var self = this;

		var file_stream = new DeepFstream(self.outputDir);
		var collected_files = [];
		var collected_directories = [];

		var remove_directories = function(complete) {
			if (collected_directories.length) {
				fs.rmdir(collected_directories.pop(), function() {
					return remove_directories(complete);
				});
			}	else {
				return complete();
			}
		};

		var remove_files = function(complete) {
			if (collected_files.length) {
				return fs.unlink(collected_files.pop(), function() {
					return remove_files(complete);
				});
			} else {
				return complete();
			}
		};

		file_stream.on("directory", function(entry, next) {
			var skip = true;

			// skip hidden directories
			if (entry.basename[0] !== ".") {
				collected_directories.push(entry.path);
				skip = false;
			}

			return next(skip);
		});

		file_stream.on("file", function(entry, next) {
			if (entry.basename[0] !== ".") {
				collected_files.push(entry.path);
			}
			return next();
		});

		file_stream.on("end", function() {
			return remove_files(function() {
				return remove_directories(function() {
					return callback();
				});
			});
		});

		// If there's an error in reading the file-stream,
		// we assume it doesn't exist yet and move on.
		file_stream.on("error", function() {
			return callback();
		});
	}

};
