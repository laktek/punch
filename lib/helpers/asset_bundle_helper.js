var _ = require("underscore");
var util = require("util");

var bundles = {};

var bundling_disabled = false;

var skip_hosts = [];

var tag_helpers = {};

var block_helpers = {

		stylesheet_bundle: function(text, render) {
			var stylesheet_tag = '<link rel="stylesheet" type="text/css" media="screen" href="%s">'
			if (!bundling_disabled) {
				return util.format(stylesheet_tag, text);	
			}	else {
				var bundled_files = bundles[text];	
				var output = [];

				_.each(bundled_files, function(file) {
					output.push(util.format(stylesheet_tag, file));	
				});

				return output.join("\n");
			}
		},

		javascript_bundle: function(text, render) {
			var javascript_tag = '<script src="%s"></script>'
			if (!bundling_disabled) {
				return util.format(javascript_tag, text);	
			}	else {
				var bundled_files = bundles[text];	
				var output = [];

				_.each(bundled_files, function(file) {
					output.push(util.format(javascript_tag, file));	
				});

				return output.join("\n");
			}
		}
}

module.exports = {

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };	
	},

	get: function(basepath, content_type, options, callback){
		var self = this;

		var is_bundling_disabled_host = function(given_host) {
			return _.any(skip_hosts, function(host) {
				return given_host.indexOf(host) > -1;
			});
		}

		bundling_disabled = !!( (options.host && options.host.length) && is_bundling_disabled_host(options.host) );

		return callback(null, tag_helpers, block_helpers, {}); 
	},

	setup: function(config) {
		bundles = config.bundles;
		skip_hosts = config.skip_asset_bundling;
	}

}
