var tag_helpers = {};

var block_helpers = {

		upcase: function(text, render) {
			var rendered_text = render(text);
			return rendered_text.toUpperCase();	
		},

		downcase: function(text, render) {
			var rendered_text = render(text);
			return rendered_text.toLowerCase();	
		},	

		capitalize: function(text, render) {
			var rendered_text = render(text);
			return (rendered_text.charAt(0).toUpperCase() + rendered_text.slice(1).toLowerCase());
		},

		titleize: function(text, render) {
			var rendered_text = render(text);
			return rendered_text.replace(/(\S+)\s|(\S+)$/g, function(c){ return block_helpers.capitalize(c, render); }); 
		},

		trim: function(text, render) {
			var rendered_text = render(text);
			return rendered_text.trim();
		},

		humanize: function(text, render) {
			var rendered_text = render(text);
			return block_helpers.capitalize(rendered_text.replace(/([-_])/g, " "), render); 
		},

		dasherize: function(text, render){
      return block_helpers.trim(text, render).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

		underscored: function(text, render){
      return block_helpers.trim(text, render).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    }
}

module.exports = {

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };	
	},

	get: function(basepath, content_type, options, callback){
		var self = this;

		return callback(null, tag_helpers, block_helpers, {}); 
	}
}
