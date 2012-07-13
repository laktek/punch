module.exports = {

  registeredRenderers: {},

  registeredCompilers: {},

	resourceExist: function(path, last_modified, callback){
	
	},

	compileTo: function(path, content_type, last_modified, callback){
	
	},

	renderContent: function(path, content_type, last_modified, callback){
	
	},

	render: function(path, content_type, last_modified, callback, options){
		var self = this;

		// first, check if there's a static file that we can serve
		self.resourceExist(path, last_modified, function(err, static_output){
			if(!err){
				return callback(static_output);	
			} else {
				// then, check if there's a template we can compile to expected content type	
				self.compileTo(path, content_type, last_modified, function(err, compiled_output){
					if(!err){
						return callback(compiled_output);	
					} else {
						// finally, fetch and render the content matching the given	path
						self.renderContent(path, content_type, last_modified, function(err, rendered_output){
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
