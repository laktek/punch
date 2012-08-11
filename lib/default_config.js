var path = require("path");

module.exports = {
  template_dir: "templates",
  content_dir: "contents",
  output_dir: "public",
  output_extension: "html",
  shared_content: "shared",
  
  server: {
    port: 9009, 
		cache: {
			max_age: 86400,
			public: true	
		}
  },

	generator: {
		blank: false	
	},

	plugins: {
		cache_store: 			path.join(__dirname, "cache_store"),
		template_handler: path.join(__dirname, "template_handler"),
		content_handler: 	path.join(__dirname, "content_handler"),
		template_engine: 	path.join(__dirname, "template_engines/mustache_engine"),

		parsers: {
			".markdown": path.join(__dirname, "parsers/markdown")
		},

		publishers: {
			"s3": 	path.join(__dirname, "publishers/s3"),
			"sftp": path.join(__dirname, "publishers/sftp"),
		}, 

		compilers: {
			".js": 	path.join(__dirname, "compilers/coffee_script"),
			".css": path.join(__dirname, "compilers/less"),
		}, 

		helpers: {
			"text_helper": path.join(__dirname, "helpers/text_helper"),
			"list_helper": path.join(__dirname, "helpers/list_helper"),
			"datetime_helper": path.join(__dirname, "helpers/datetime_helper")
		}
	}
}
