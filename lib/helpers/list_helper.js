var _ = require("underscore");

var helpers = {

		format_list: function(text, render) {
			var arr = [];

			if (!text){
				return "";	
			} else if (_.isArray(text)) {
				arr = text;
			} else {
				arr = text.split(",");
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
				arr = text.split(",");
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
				arr = text.split(",");
			}

			return arr[arr.length - 1];
		}


}

module.exports = {

	directAccess: function(){
		return helpers;	
	},

	get: function(basepath, content_type, options, callback){
		var self = this;
		var mustache_helpers = {};

		_.each(helpers, function(helper_function, name){
			mustache_helpers[name] = function(){ return helper_function }	
		});

		return callback(null, mustache_helpers); 
	}
}
