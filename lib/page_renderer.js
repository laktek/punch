var path = require("path");
var _ = require("underscore");

module.exports = {

	templates: null,

	contents: null,

	templateEngine: null,	

	compilers: {},

	createTemplateEngine: function(options){
		var self = this;

		return new self.templateEngine(options);	
	},

	serveStatic: function(request_path, last_modified, callback){
		var self = this;

		self.templates.getTemplate(request_path, function(err, stat){
			if(err){
				return callback({"ignore": true, "message": err}, null);	
			}

			if(stat.last_modified > last_modified){
				// file has changed, read it again		
				self.templates.readTemplate(request_path, function(err, output){
					if(err){
						return callback({"ignore": false, "message": err}, null);	
					}

					return callback(null, {"body": output, "modified": true});	
				});
			} else {
				return callback(null, {"body": null, "modified": false});	
			}	
		});
	},

	compileTo: function(request_path, output_extension, last_modified, callback){
		var self = this;

		var compiler = self.compilers[output_extension];

		if(!compiler){
			return callback({"ignore": true, "message": "no compiler found"}, null);	
		} 

		var basepath = request_path.split(".")[0];

		// check if there's a supported template
		self.templates.getTemplates(basepath, function(err, templates_list){

			if(err){
				return callback({"ignore": true, "message": err}, null);	
			}

			var checkForCompilableTemplates = function(){
				var template = templates_list.pop();
				var template_extension = path.extname(template.full_path);
				if(_.include(compiler.input_extensions, template_extension)){
					if(template.last_modified > last_modified){

						self.templates.readTemplate(template.full_path, function(err, template_output){
							if(err){
								return callback({"ignore": false, "message": err}, null);	
							}

							return compiler.compile(template_output, callback);	
						});
					} else {
						return callback(null, {"body": null, "modified": false});	
					} 
				} else if(templates_list.length){
					return checkForCompilableTemplates();
				}
			};

			return checkForCompilableTemplates();
		});
	},

	renderContent: function(request_path, output_extension, last_modified, options, callback){
		var self = this;

		var basepath = request_path.split(".")[0];

		var response_options = {};

		var render_options = {"last_render": last_modified}

		var template_engine = self.createTemplateEngine(render_options);

		template_engine.on("renderComplete", function(rendered_output, modified){
			return callback(null, {"body": rendered_output, "modified": modified, "options": response_options});	
		});

		template_engine.on("renderCanceled", function(err){
			return callback(null, {"body": null, "modified": false, "options": {"header": {"status": 404}, "log": {"error": err }} });	
		});

		self.contents.negotiateContent(basepath, output_extension, options, function(err, content_obj, content_last_modified, content_options){
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

	render: function(request_path, output_extension, last_modified, options, callback){
		var self = this;

		// check if request path is a template or content path
		if(self.templates.isTopLevelPath(request_path) || self.contents.isTopLevelPath(request_path)){
			// change the path to point to the index of the path
			request_path = path.join(request_path, ("index" + output_extension));
		}

		var callback_handler = function(err, output){
			if(!err){
				return callback(output);	
			} else if(!err.ignore){
				return callback({"body": null, "modified": false, "options": {"header": {"status": 500}, "log": {"error": err.message }} });	
			} else {
				if(rendering_steps.length){
					return rendering_steps.shift().call();	
				}	
			}
		}

		var rendering_steps = [
			function(){ self.serveStatic(request_path, last_modified, callback_handler) },		
			function(){ self.compileTo(request_path, output_extension, last_modified, callback_handler) },
			function(){ self.renderContent(request_path, output_extension, last_modified, callback_handler) }
		];

		rendering_steps.shift().call();

	},

	setup: function(config){
	
	}

}
