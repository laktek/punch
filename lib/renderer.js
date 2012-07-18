var path = require("path");
var _ = require("underscore");

module.exports = {

	templates: null,

	contents: null,

	compilers: null,

	templateEngine: null,	

	createTemplateEngine: function(options){
		var self = this;

		return new self.templateEngine(options);	
	},

	serveStatic: function(request_path, last_modified, callback){
		var self = this;

		self.templates.getTemplate(request_path, function(err, stat){
			if(err){
				return callback(err, null);	
			}

			if(stat.last_modified > last_modified){
				// file has changed, read it again		
				self.templates.readTemplate(request_path, function(err, output){
					if(err){
						return callback(err, null);	
					}

					return callback(null, {"body": output, "modified": true});	
				});
			} else {
				return callback(null, {"body": null, "modified": false});	
			}	
		});
	},

	compileTo: function(request_path, content_type, last_modified, callback){
		var self = this;

		self.compilers.getCompilerForOutputExt(content_type, function(err, compiler){

			if(err){
				return callback(err, null);	
			} 

			var basepath = request_path.split(".")[0];

			// check if there's a supported template
			self.templates.getTemplates(basepath, function(err, templates_list){

				if(err){
					return callback(err, null);	
				}

				var checkForCompilableTemplates = function(){
					var template = templates_list.pop();
					var template_extension = path.extname(template.full_path);
					if(_.include(compiler.input_extensions, template_extension)){
						if(template.last_modified > last_modified){

							self.templates.readTemplate(template.full_path, function(err, template_output){
								if(err){
									return callback(err, null);	
								}

								return compiler.compile(template_output, callback);	
							});
						} else {
							return callback(null, {"body": null, "modified": false});	
						} 
					} else if(templates_list.length){
						return checkForCompilableTemplates();
					}
				}

				return checkForCompilableTemplates();
			});
		});	
	},

	renderContent: function(request_path, content_type, last_modified, options, callback){
		var self = this;

		var basepath = request_path.split(".")[0];

		var response_options = {};

		var render_options = {"last_render": last_modified}

		var template_engine = self.createTemplateEngine(render_options);

		template_engine.on("renderComplete", function(rendered_output, modified){
			return callback(null, {"body": rendered_output, "modified": modified, "options": response_options});	
		});

		template_engine.on("renderCanceled", function(err){
			return callback(err, {"body": null, "modified": false, "options": response_options});	
		});

		self.contents.negotiateContent(basepath, content_type, options, function(err, content_obj, content_last_modified, content_options){
			var response_options = content_options;
			if(!err){
				template_engine.setContent(content_obj, content_last_modified);
			} else {
				template_engine.cancelRender(err);
			}
		});

		self.templates.negotiateTemplate(basepath, template_engine.extension, options, function(err, template_output, template_last_modified){
			if(!err){
				template_engine.setTemplate(template_output, template_last_modified);
			} else {
				template_engine.cancelRender(err);
			}
		});

		self.templates.getPartials(basepath, template_engine.extension, options, function(err, partials, partials_last_modified){
			template_engine.setPartials(partials, partials_last_modified);
		});
	},

	render: function(request_path, content_type, last_modified, options, callback){
		var self = this;

		// first, check if there's a static file that we can serve
		self.serveStatic(request_path, last_modified, function(err, static_output){
			if(!err){
				return callback(static_output);	
			} else {
				// then, check if there's a template we can compile to expected content type	
				self.compileTo(request_path, content_type, last_modified, function(err, compiled_output){
					if(!err){
						return callback(compiled_output);	
					} else {
						// finally, fetch and render the content matching the given	path
						self.renderContent(request_path, content_type, last_modified, function(err, rendered_output){
							if(!err){
								return callback(rendered_output);	
							}	
						});
					}	
				});
			}
		});

	}

}
