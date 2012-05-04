module.exports = {
  template_dir: "templates",
  content_dir: "contents",
  output_dir: "public",
  output_extension: "html",
  shared_content: "shared",
  server_port: 9009,
  renderers: {
    "mustache": "./renderers/mustache" 
  },
  parsers: {
    "markdown": "./parsers/markdown" 
  }
}
