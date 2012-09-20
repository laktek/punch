var _ = require("underscore");
var path = require("path");
var fs = require("fs");

module.exports = {

	templateDir: null,

	setup: function(config) {
		var self = this;
		self.templateDir = config.template_dir;
	},

	// check whether the given path is a top level path
	isSection: function(template_path) {
		var self = this;

		var path_portions = template_path.split(path.sep || "/");
		if(_.any(path_portions, function(portion){ return portion[0] === "."; })){
			return false;
		}

		var stat;

		try {
			stat = fs.statSync(path.join(self.templateDir, template_path));
		} catch(e) {
			//gotcha!
		}

		return stat && stat.isDirectory();
	},

	// get the template matching the exact path
	getTemplate: function(template_path, callback) {
		var self = this;

		fs.stat(path.join(self.templateDir, template_path), function(err, stat){
			if(err){
				return callback(err, null);
			}

			if(!stat.isFile()){
				return callback("given path is not a file", null);
			}

			return callback(null, {"full_path": template_path, "last_modified": stat.mtime });
		});
	},

  // get all templates fuzzly matches the path
	getTemplates: function(basepath, callback) {
		var self = this;

		var filter_dir = function(dirpath, filter, last_attempt){
			var absolute_dirpath = path.join(self.templateDir, dirpath);
			fs.readdir(absolute_dirpath, function(err, files){
				if(!err){

					var templates = [];

					//exclude dot files
					var template_files = files.filter(function(file){ return file[0] !== "."; });

					_.each(template_files, function(file){

						var filename = file.split(".")[0];

						if(filter === "" || filename === filter){
							var relative_template_path = path.join(dirpath, file);
							var stat = fs.statSync(path.join(absolute_dirpath, file));

							if(!stat.isDirectory()){
								templates.push({"full_path": relative_template_path, "last_modified": stat.mtime });
							}
						}
					});

					return callback(null, templates);
				} else if(!last_attempt){
					var new_dirpath = path.dirname(dirpath);
					var new_filter = path.basename(dirpath).split(".")[0];

					return filter_dir(new_dirpath, new_filter, true);
				}	else {
					return callback(err, null);
				}
			});
		};

		return filter_dir(basepath, "");
	},

	// reads and outputs the template matching the exact path
	readTemplate: function(template_path, callback) {
		var self = this;

		fs.readFile(path.join(self.templateDir, template_path), "binary", function(err, template_output){
			if(err){
				return callback(err, null);
			}

			return callback(null, template_output.toString());
		});
	},

	// read the best template fuzzly matches the path
	negotiateTemplate: function(basepath, output_extension, template_extension, options, callback) {
		var self = this;

		var read_template_or_layout = function(base_file_path, extension) {
			var full_file_path = base_file_path + extension;

			fs.stat(full_file_path, function(err, stat) {
				if (err) {
					// read the layout file
					var basename = path.basename(base_file_path);
					var dir_path = path.dirname(base_file_path);

					if (basename.indexOf("_layout") > -1) {
						dir_path = path.join(dir_path, "..");
					}

					if (dir_path.indexOf(self.templateDir) > -1) {
						var layout_file_path = path.join(dir_path, "_layout");
						return read_template_or_layout(layout_file_path, extension);
					} else {
						return read_template_or_layout_callback();
					}
				}

				fs.readFile(full_file_path, function(err, template_output) {
					if (err) {
						return callback(err, null, stat.mtime);
					}

					return callback(null, template_output.toString(), stat.mtime);
				});
			});
		};

		var template_base_file_path = path.join(self.templateDir, basepath);
		var template_extensions = [ (output_extension + template_extension), template_extension];

		var read_template_or_layout_callback = function() {
			if (template_extensions.length) {
				return read_template_or_layout(template_base_file_path, template_extensions.shift());
			} else {
				return callback("[Error: No matching template found]", null, null);
			}
		};

		return read_template_or_layout_callback();
	},

	// get all partials matching the given path
	getPartials: function(basepath, extension, options, callback) {
		var self = this;

		var last_modified = null;
		var collected_partials = {};

		var read_partial = function(partial_path, partial_complete){
			fs.stat(partial_path, function(err, stat){
				if(err){
					return partial_complete();
				}

				fs.readFile(partial_path, function(err, partial_output){
					if(err){
						return partial_complete();
					}

					// if the given partial has been updated,
					// change the last modified of the collection
					if(stat.mtime > last_modified){
						last_modified	= stat.mtime;
					}

					var partial_name = path.basename(partial_path, extension).substring(1);
					collected_partials[partial_name] = partial_output.toString();

					return partial_complete();
				});
			});
		};

		var traverse_dir = function(dir, dir_complete){
			var dirpath = path.join(self.templateDir, dir);

			fs.readdir(dirpath, function(err, files){
				if(err){
					return dir_complete();
				}

        var partials = files.filter(function(file){ return (file[0] === "_" && file.indexOf(extension) > -1); });

				var read_partial_callback = function(){
					if(partials.length){
						return read_partial(path.join(dirpath, partials.pop()), read_partial_callback);
					} else {
						return dir_complete();
					}
				};

				return read_partial_callback();
			});
		};

		var directories_to_look = [];
		_.each(basepath.split("/"), function(current_dir_entry){
			var previous_dir_entry = directories_to_look[directories_to_look.length - 1];
			directories_to_look.push(path.join(previous_dir_entry, current_dir_entry));
		});

		var traverse_dir_callback = function(){
			if(directories_to_look.length){
				return traverse_dir(directories_to_look.shift(), traverse_dir_callback);
			}	else {
				return callback(null, collected_partials, last_modified);
			}
		};

		return traverse_dir_callback();
	},

	// returns all available template sections
	getSections: function(callback) {
		var self = this;
		var sections = ["/"];
		var paths_to_traverse = [];

		var should_exclude = function(entry) {
			return entry[0] === ".";
		};

		var traverse_path = function(){
			var current_path = paths_to_traverse.shift();
			fs.readdir(path.join(self.templateDir, current_path), function(err, entries){
				if(err){
					throw err;
				}

				var run_callbacks = function(){
					if(entries.length){
						return next_entry();
					} else if(paths_to_traverse.length){
						return traverse_path();
					} else {
						return callback(sections);
					}
				};

				var next_entry = function(){
					var current_entry = entries.shift();
					if(should_exclude(current_entry)){
						return run_callbacks();
					}

					var current_entry_path = path.join(current_path, current_entry);
					fs.stat(path.join(self.templateDir, current_entry_path), function(err, stat){
						if(err){
							return run_callbacks();
						}

						if(stat.isDirectory()){
							sections.push("/" + current_entry_path);
							paths_to_traverse.push(current_entry_path);
						}

						return run_callbacks();
					});
				};

				return run_callbacks();
			});
		};
		return traverse_path();
	}

};
