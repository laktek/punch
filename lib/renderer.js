
module.exports = {

  registeredRenderers: {},

  registeredCompilers: {},

	canRender: function(content_type){
	
	},

	render: function(name, content_type, last_modified, options){
		var self = this;

		return self.canRender(content_type);
	}
}
