var _ = require("underscore");

var helpers = {

		upcase: function(text, render) {
			return text.toUpperCase();	
		},

		downcase: function(text, render) {
			return text.toLowerCase();	
		},	

		capitalize: function(text, render) {
			var text = String(text);
			return (text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
		},

		titleize: function(text, render) {
			return String(text).replace(/(\S+)\s|(\S+)$/g, function(c){ return helpers.capitalize(c); }); 
		},

		trim: function(text, render) {
			return text.trim();
		},

		humanize: function(text, render) {
			return helpers.capitalize(String(text).replace(/([-_])/g, " ")); 
		},

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
		}

	// autolink

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
