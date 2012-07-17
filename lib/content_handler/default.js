var _ = require("underscore");
var path = require("path");
var fs = require("fs");

module.exports = {

	contentDir: null,

	parsers: null,

	parseExtendedContent: function(dir_path, callback){
		var self = this;	

		var getParserFor = function(extension){
			return _.find(self.parsers, function(parser){
				if(_.include(parser.supportedExtensions, extension)){
					return parser; 	
				}	
			});
		};

		var jsonParse = function(input, callback){
			return callback(null, JSON.parse(input));	
		};

		var parseFile = function(file_path, callback){
			// check if there's a parser supporting the given extension 
			var basename = path.basename(file_path).split(".");
			var file_extension = "." + basename.pop();

			if(file_extension === ".json"){
				var parser = {"parse": jsonParse};
			} else {
				var parser = getParserFor(file_extension);
			}

			if(parser){
				fs.stat(file_path, function(err, stat){
					if(err){
						return callback(err);	
					}	

					var modified_date = stat.mtime;

					fs.readFile(file_path, function(err, file_output){
						if(err){
							return callback(err);	
						}

						parser.parse(file_output.toString(), function(err, parsed_output){
							if(err){
								return callback(err, basename.join("."), null, modified_date);	
							}

							return callback(null, basename.join("."), parsed_output, modified_date);
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
		fs.readdir(dir_path, function(err, files){
			// filter the hidden files	
			var content_files = files.filter(function(file){ return file[0] !== "." });

			// parse each file
			var parse_file_callback = function(err, content_name, parsed_content, modified_date){
				if(!err){
					parsed_contents[content_name] = parsed_content;

					if(modified_date > last_modified){
						last_modified = modified_date;
					}
				}

				if(content_files.length){
					return parseFile(content_files.pop(), parse_file_callback);	
				} else {
					return callback(null, parsed_contents, last_modified);	
				}
			};
			parseFile(content_files.pop(), parse_file_callback);

		});
	},

	getContent: function(basepath, content_type, options, callback){
		var self = this;

		var content_output = {};
		var last_modified = null;

		var getJSONFile = function(file_path, callback){
			fs.stat(file_path, function(err, stat){
				if(err){
					return callback(err, null);	
				}	

				fs.readFile(file_path, function(err, file_output){
					if(err){
						return callback(err, null);
					}

					return callback(null, JSON.parse(file_output), stat.mtime);
				});
			});
		};

		// look for the JSON file in the path
		var json_file = path.join(self.contentDir, basepath) + ".json";
		getJSONFile(json_file, function(err, json_output, modified_date){
			if(!err){
				content_output = _.extend(content_output, json_output);
				last_modified = modified_date; 
			}

			// look for extended content 
			self.parseExtendedContent(basepath, function(err, extended_output, extended_modified_date){
				if(!err){
					content_output = _.extend(content_output, extended_output);	

					if(extended_modified_date > last_modified){
						last_modified = extended_modified_date;	
					}
				}

				callback(null, content_output, last_modified);
			});
		});
	},

	getSharedContent: function(){
	
	},

	getPaths: function(){
	
	},

	getContents: function(){
	
	},

	// returns a combination of the content fetched from following sources
	// content matching for the given path
	// shared content
	// helper content
	negotiateContent: function(template_path, callback){
	},

}
