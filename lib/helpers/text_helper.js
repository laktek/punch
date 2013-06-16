var HelperUtils = require("../utils/helper_utils");

var tag_helpers = {};

var block_helpers = {

		upcase: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return text.toUpperCase();
			});
		},

		downcase: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return text.toLowerCase();
			});
		},

		capitalize: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return (text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
			});
		},

		titleize: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return text.replace(/(\S+)\s|(\S+)$/g, function(c){ return block_helpers.capitalize(c); });
			});
		},

		trim: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return text.trim();
			});
		},

		humanize: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return block_helpers.capitalize(text.replace(/([\-_])/g, " "));
			});
		},

		dasherize: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return block_helpers.trim(text).replace(/([A-Z])/g, "-$1").replace(/[\-_\s]+/g, "-").toLowerCase();
			});
    },

		underscored: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				if(!text) {
					return "";
				}

				return block_helpers.trim(text).replace(/([a-z\d])([A-Z]+)/g, "$1_$2").replace(/[\-\s]+/g, "_").toLowerCase();
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
