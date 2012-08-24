var helper_utils = require("../utils/helper_utils.js");

var getDateValue = function(text){
	return String(text).match(/^\d+$/) ? parseInt(text, 10) : text;
};

var tag_helpers = {
	timestamp: function() {
		return new Date().getTime();
	}
};

var block_helpers = {

	datetime: function() {
		return helper_utils.check_args(arguments, function(text) {
				if(!text) {
					return "";
				}

			return (new Date( getDateValue(text) )).toString();
		});
	},

	date: function() {
		return helper_utils.check_args(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toDateString();
		});
	},

	time: function() {
		return helper_utils.check_args(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toTimeString();
		});
	},

	iso_date: function() {
		return helper_utils.check_args(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toISOString();
		});
	}

};

module.exports = {

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };
	},

	get: function(basepath, content_type, options, callback){
		var self = this;

		return callback(null, tag_helpers, block_helpers, {});
	}

};
