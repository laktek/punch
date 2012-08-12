var _ = require("underscore");

var getDateValue = function(text){
	return String(text).match(/^\d+$/) ? parseInt(text) : text;
};

var block_helpers = {

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
	},

};

var tag_helpers = {
	timestamp: function() {
		return new Date().getTime();	
	}
};

module.exports = {

	directAccess: function(){
		return _.extend({}, tag_helpers, block_helpers);	
	},

	get: function(basepath, content_type, options, callback){
		var self = this;
		var mustache_helpers = {};

		_.each(block_helpers, function(helper_function, name){
			mustache_helpers[name] = function(){ return helper_function }	
		});

		_.each(tag_helpers, function(helper_function, name){
			mustache_helpers[name] = helper_function();	
		});

		return callback(null, mustache_helpers); 
	}

}
