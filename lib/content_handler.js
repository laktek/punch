var _ = require("underscore");
var Path = require("path");
var Fs = require("fs");

var ModuleUtils = require("./utils/module_utils.js");

module.exports = {

	contentDir: null,

	parsers: {},

	setup: function(config) {
		var self = this;
		self.contentDir = config.content_dir;

		_.each(config.plugins.parsers, function(value, key){
      var parser = ModuleUtils.requireAndSetup(value, config);
      var extensions = _.union( [key], (parser.supportedExtensions || []) );

      _.each(extensions, function(extension) {
        self.parsers[extension] = parser;
      });
		});
	},

	isSection: function(content_path) {
		var self = this;

		if (!content_path) {
			return false;
		}

		var path_portions = content_path.split(Path.sep || "/");
		if (_.any(path_portions, function(portion) { return ( [".", "_"].indexOf(portion[0]) > -1 ); } )) {
			return false;
		}

		var stat;
		try {
			stat = Fs.statSync(Path.join(self.contentDir, content_path));
		} catch(e) {
			//gotcha!
		}

		return stat && stat.isDirectory();
	},

	parseExtendedContent: function(basePath, callback) {
		var self = this;

		var extended_dir_path = function() {
			var path_portions = basePath.split(Path.sep || "/");
			path_portions.push("_" + path_portions.pop().replace("/",""));
			path_portions.unshift(self.contentDir);

			return Path.join.apply(null, path_portions);
		};

		var getParserFor = function(extension) {
			return self.parsers[extension];
		};

		var jsonParse = function(input, callback) {
			return callback(null, JSON.parse(input));
		};

		var parseFile = function(file_path, callback) {
			// check if there's a parser supporting the given extension
			var basename = Path.basename(file_path).split(".");
			var file_extension = "." + basename.pop();
			var parser;

			if (file_extension === ".json") {
				parser = { "parse": jsonParse };
			} else {
				parser = getParserFor(file_extension);
			}

			if (parser) {
				Fs.stat(file_path, function(err, stat) {
					if (err) {
						return callback(err);
					}

					var modified_date = stat.mtime;

					Fs.readFile(file_path, function(err, file_output) {
						if (err) {
							return callback(err);
						}

						parser.parse(file_output.toString(), function(err, parsed_output) {
							if (err) {
								return callback(err, basename.shift(), null, modified_date);
							}

							return callback(null, basename.shift(), parsed_output, modified_date);
						});
					});
				});
			} else {
				return callback("no parser found");
			}
		};

		var parsed_contents = {};
		var last_modified = null;

		// go through each file in the directory and parse them
		Fs.readdir(extended_dir_path(), function(err, files) {
			if (err) {
				return callback(err, null, null);
			}

			// filter the hidden files
			var content_files = [];
			_.each(files, function(file) {
				if (file[0] !== ".") {
					content_files.push(Path.join(extended_dir_path(), file));
				}
			});

			// parse each file
			var parse_file_callback = function(err, content_name, parsed_content, modified_date) {
				if (!err) {
					parsed_contents[content_name] = parsed_content;

					if (modified_date > last_modified) {
						last_modified = modified_date;
					}
				}

				if (content_files.length) {
					return parseFile(content_files.pop(), parse_file_callback);
				} else {
					return callback(null, parsed_contents, last_modified);
				}
			};

			parseFile(content_files.pop(), parse_file_callback);

		});
	},

	getContent: function(basePath, callback) {
		var self = this;

		var content_output = {};
		var last_modified = null;

		var getJSONFile = function(file_path, callback) {
			Fs.stat(file_path, function(err, stat) {
				if (err) {
					return callback(err);
				}

				Fs.readFile(file_path, function(err, file_output) {
					if (err) {
						return callback(err);
					}

					var parsed_json, error;

					try {
						parsed_json = file_output.length ? JSON.parse(file_output) : "";
					} catch (err) {
						error = err;
					}

					return callback(error, parsed_json, stat.mtime);
				});
			});
		};

		// look for the JSON file in the path
		var json_file = Path.join(self.contentDir, basePath) + ".json";
		getJSONFile(json_file, function(json_err, json_output, modified_date) {
			if (!json_err) {
				content_output = _.extend(content_output, json_output);
				last_modified = modified_date;
			}

			// look for extended content
			self.parseExtendedContent(basePath, function(extended_err, extended_output, extended_modified_date) {
				if (!extended_err) {
					content_output = _.extend(content_output, extended_output);

					if (extended_modified_date > last_modified) {
						last_modified = extended_modified_date;
					}
				}

				if (json_err && extended_err) {
					return callback("[Error] No content found", null, last_modified);
				} else {
					return callback(null, content_output, last_modified);
				}
			});
		});
	},

	getSharedContent: function(callback) {
		var self = this;
		return self.getContent("shared", callback);
	},

	// returns all available sections rooting from the given path
	getSections: function(callback) {
		var self = this;
		var sections = [Path.join("/")];
		var paths_to_traverse = [];

		var should_exclude = function(entry) {
			return entry[0] === "." || entry[0] === "_" || entry === "shared";
		};

		var traverse_path = function() {
			var current_path = paths_to_traverse.shift() || "";
			Fs.readdir(Path.join(self.contentDir, current_path), function(err, entries) {
				if (err) {
					throw err;
				}

				var run_callbacks = function() {
					if (entries.length) {
						return next_entry();
					} else if (paths_to_traverse.length) {
						return traverse_path();
					} else {
						return callback(sections);
					}
				};

				var next_entry = function() {
					var current_entry = entries.shift();
					if (should_exclude(current_entry)) {
						return run_callbacks();
					}

					var current_entry_path = Path.join(current_path, current_entry);
					Fs.stat(Path.join(self.contentDir, current_entry_path), function(err, stat) {
						if (err) {
							return run_callbacks();
						}

						if (stat.isDirectory()) {
							sections.push(Path.join("/",current_entry_path));
							paths_to_traverse.push(current_entry_path);
						}

						return run_callbacks();
					});
				};

				return run_callbacks();
			});
		};
		return traverse_path();
	},

	// returns all available content paths under a given section path
	getContentPaths: function(basePath, callback) {
		var self = this;
		var collected_contents = [];

		if (!basePath) {
			return callback("base path can't be null", []);
		}

		// try to read the given path dir
		Fs.readdir(Path.join(self.contentDir, basePath), function(err, files) {
			if (err) {
				return callback(err, []);
			}

			_.each(files, function(file) {
				if (file.indexOf(".") > 0 || file[0] === "_") {
					var basename;

					// given entry is a extended directory
					if (file[0] === "_") {
						basename = file.substr(1);
					} else {
						// given entry is a JSON file
						var path_portions = file.split(".");
						path_portions.pop(); //remove the final extension
						basename = path_portions.join(".");
					}

					var full_path = Path.join(basePath, basename);

					if (basename !== "shared" && collected_contents.indexOf(full_path) < 0) {
						collected_contents.push(full_path);
					}
				}
			});

			return callback(null, collected_contents);
		});
	},

	// provide the best matching content for the given arguments
	negotiateContent: function(basePath, output_extension, options, callback) {
		var self = this;
		var collected_contents = {};
		var content_options = {};
		var last_modified = null;

		// treat files with special output extensions
		if (output_extension !== ".html") {
			basePath = basePath + output_extension;
		}

		self.getContent(basePath, function(err, contents, modified_date) {
			if (!err) {
				collected_contents = _.extend(collected_contents, contents);
				last_modified = modified_date;

				var run_callback = function() {
					return callback(null, collected_contents, content_options, last_modified);
				};

				//fetch shared content
				self.getSharedContent(function(err, shared_content, shared_modified_date) {
					if (!err) {
						collected_contents = _.extend(shared_content, collected_contents);
						if (shared_modified_date > last_modified) {
							last_modified = shared_modified_date;
						}
					}

					return run_callback();
				});
			} else {
				return callback("[Error: Content for " + basePath + " not found]", null, null, {});
			}
		});
	}

};
