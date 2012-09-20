var helper_utils = require("../utils/helper_utils.js");

var arg_condition = function(arg) { return Array.isArray(arg); };

var tag_helpers = {};

var block_helpers = {

		format_list: function() {
			return helper_utils.checkArgs(arguments, arg_condition, function(text) {
				var arr = [];

				if (!text){
					return "";
				} else if (Array.isArray(text)) {
					arr = text;
				} else {
					arr = text.split(",");
				}

				if(arr.length > 1){
					var last_value = arr.pop();
					return arr.join(", ") + ", &amp; " + last_value;
				} else {
					return arr.join("");
				}
			});
		},

		first: function() {
			return helper_utils.checkArgs(arguments, arg_condition, function(text) {
				var arr = [];

				if (!text){
					return "";
				} else if (Array.isArray(text)) {
					arr = text;
				} else {
					arr = text.split(",");
				}

				return arr[0];
			});
		},

		last: function() {
			return helper_utils.checkArgs(arguments, arg_condition, function(text) {
				var arr = [];

				if (!text){
					return "";
				} else if (Array.isArray(text)) {
					arr = text;
				} else {
					arr = text.split(",");
				}

				return arr[arr.length - 1];
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
