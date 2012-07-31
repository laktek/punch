var _ = require("underscore");

module.exports = {

	upcase: function(text, render){
		return text.toUpperCase();	
	},

  downcase: function(text, render){
		return text.toLowerCase();	
	},	

	capitalize: function(text, render){
		var text = String(text);
		return (text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
	},

	titleize: function(text, render){
		var self = this;
		return String(text).replace(/(\S+)\s|(\S+)$/g, function(c){ return self.capitalize(c); }); 
	},

	trim: function(text, render) {
		return text.trim();
	},

	humanize: function(text, render){
		var self = this;
		return self.capitalize(String(text).replace(/([-_])/g, " ")); 
	},

	to_sentence: function(text, render){
		if(!_.isArray(text)){
			var arr = text	
		}
	}

	// autolink

}
