var Path = require("path");

module.exports = {
  template_dir: "templates",
  content_dir: "contents",
  output_dir: "output",
  shared_content: "shared",

	asset_bundling: {
		skip_hosts: ["localhost", "127.0.0.1", ".local"],
		fingerprint: true
	},

	bundles: {
	},

	generator: {
		blank: false,
		skip_paths: []
	},

	parser: {
		markdown: {}
	},

	publish: {
		generate: true
	},

	plugins: {
		cache_store: Path.join(__dirname, "cache_store.js"),
		template_handler: Path.join(__dirname, "template_handler.js"),
		content_handler: Path.join(__dirname, "content_handler.js"),
		template_engine: Path.join(__dirname, "template_engines/mustache_engine.js"),

		parsers: {
			".markdown": Path.join(__dirname, "parsers/markdown.js")
		},

		publishers: {
			"s3": Path.join(__dirname, "publishers/s3.js")
		},

		compilers: {
			".js": Path.join(__dirname, "compilers/coffee_script.js"),
			".css": Path.join(__dirname, "compilers/less.js")
		},

		minifiers: {
			".js": Path.join(__dirname, "minifiers/uglify.js"),
			".css": Path.join(__dirname, "minifiers/cssmin.js")
		},

		helpers: {
			"text_helper": Path.join(__dirname, "helpers/text_helper.js"),
			"list_helper": Path.join(__dirname, "helpers/list_helper.js"),
			"datetime_helper": Path.join(__dirname, "helpers/datetime_helper.js"),
			"asset_bundle_helper": Path.join(__dirname, "helpers/asset_bundle_helper.js"),
			"firstrun_helper": Path.join(__dirname, "helpers/first_run_helper.js")
		},

		generator_hooks: {
			"console_hook": Path.join(__dirname, "generator_hooks/console_output.js"),
		}
	},

  server: {
    port: 9009,
		cache: {
			"max_age": 0,
			"directives": [ "public" ]
		}
  }

};
