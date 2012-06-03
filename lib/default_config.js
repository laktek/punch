module.exports = {
  template_dir: "templates",
  content_dir: "contents",
  output_dir: "public",
  output_extension: "html",
  shared_content: "shared",
  renderers: {
    "mustache": "./renderers/mustache" 
  },
  parsers: {
    "markdown": "./parsers/markdown" 
  },
	publishers: {
		"s3": "./publishers/s3",
		"sftp": "./publishers/sftp"
	},
  server: {
    port: 9009, 
    generate_interval: 10000,
    serving_only: false   
  }
}
