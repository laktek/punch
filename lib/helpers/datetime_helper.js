var _ = require("underscore");

var getDateValue = function(text){
	return String(text).match(/^\d+$/) ? parseInt(text) : text;
};

var helpers = {

	datetime: function(text, render){
		return (new Date( getDateValue(text) )).toString();
	},

	date: function(text, render){
		return (new Date( getDateValue(text) )).toDateString();
	},

	time: function(text, render){
		return (new Date( getDateValue(text) )).toTimeString();
	},

	iso_date: function(text, render){
		return (new Date( getDateValue(text) )).toISOString();
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
