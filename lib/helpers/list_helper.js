var _ = require("underscore");

var tag_helpers = {};

var block_helpers = {

		format_list: function(text, render) {
			var arr = [];

			if (!text){
				return "";	
			} else if (_.isArray(text)) {
				arr = text;
			} else {
				var rendered_text = render(text);
				arr = rendered_text.split(",");
			}

			if(arr.length > 1){
				var last_value = arr.pop();
				return arr.join(", ") + " &amp; " + last_value;
			} else {
				return arr.join("");	
			}
		},

		first: function(text, render) {
			var arr = [];

			if (!text){
				return "";	
			} else if (_.isArray(text)) {
				arr = text;
			} else {
				var rendered_text = render(text);
				arr = rendered_text.split(",");
			}

			return arr[0];
		},

		last: function(text, render) {
			var arr = [];

			if (!text){
				return "";	
			} else if (_.isArray(text)) {
				arr = text;
			} else {
				var rendered_text = render(text);
				arr = rendered_text.split(",");
			}

			return arr[arr.length - 1];
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
