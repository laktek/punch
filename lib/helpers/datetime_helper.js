var helper_utils = require("../utils/helper_utils.js");

var getDateValue = function(text){
	return String(text).match(/^\d+$/) ? parseInt(text, 10) : text;
};

var tag_helpers = {
	timestamp: function() {
		return new Date().getTime();
	},

	current_year: function() {
		return new Date().getFullYear();
	}
};

var block_helpers = {

	datetime: function() {
		return helper_utils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

			return (new Date( getDateValue(text) )).toString();
		});
	},

	date: function() {
		return helper_utils.checkArgs(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toDateString();
		});
	},

	time: function() {
		return helper_utils.checkArgs(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toTimeString();
		});
	},

	iso_date: function() {
		return helper_utils.checkArgs(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toISOString();
		});
	},

	utc_date: function() {
		return helper_utils.checkArgs(arguments, function(text) {
			if(!text) {
				return "";
			}

			return (new Date( getDateValue(text) )).toUTCString();
		});
	}

};

module.exports = {

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };
	},

	get: function(basepath, file_extension, options, callback){
		var self = this;

		return callback(null, { "tag": tag_helpers, "block": block_helpers }, {});
	}

};
