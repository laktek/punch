var _ = require("underscore");
var util = require("util");

var asset_bundler = require("../asset_bundler.js");
var helper_utils = require("../utils/helper_utils.js");
var path_utils = require("../utils/path_utils.js");

var bundles = {};

var bundle_fingerprints = {};

var bundling_disabled = false;

var skip_hosts = [];

var build_bundle_tag = function(template_tag, bundle) {
	var file_extension = path_utils.getExtension(bundle, null);
	var request_basename = path_utils.getBasename(bundle, file_extension);

	var fingerprinted_path = (request_basename + "-" + bundle_fingerprints[bundle] + file_extension);
	return util.format(template_tag, fingerprinted_path);
};

var refresh_all_bundle_fingerprints = function(callback) {
	var bundle_names = _.keys(bundles);

	var refresh_bundle_fingerprint = function() {
		if (bundle_names.length) {
			var bundle = bundle_names.shift();
			var file_extension = path_utils.getExtension(bundle, null);
			var request_basename = path_utils.getBasename(bundle, file_extension);

			asset_bundler.statBundle(request_basename, file_extension, function(err, stat) {
				bundle_fingerprints[bundle] = stat.mtime;

				return refresh_bundle_fingerprint();
			});
		} else {
			callback();
		}
	};

	return refresh_bundle_fingerprint();
};

var tag_helpers = {};

var block_helpers = {

		stylesheet_bundle: function() {
			return helper_utils.check_args(arguments, function(text) {
				var stylesheet_tag = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"%s\">";
				if (!bundling_disabled) {
					return build_bundle_tag(stylesheet_tag, text);
				}	else {
					var bundled_files = bundles[text];
					var output = [];

					_.each(bundled_files, function(file) {
						output.push(util.format(stylesheet_tag, file));
					});

					return output.join("\n");
				}
			});
		},

		javascript_bundle: function() {
			return helper_utils.check_args(arguments, function(text) {
				var javascript_tag = "<script src=\"%s\"></script>";
				if (!bundling_disabled) {
					return build_bundle_tag(javascript_tag, text);
				}	else {
					var bundled_files = bundles[text];
					var output = [];

					_.each(bundled_files, function(file) {
						output.push(util.format(javascript_tag, file));
					});

					return output.join("\n");
				}
			});
		}
};

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
		};

		bundling_disabled = !!( (options.host && options.host.length) && is_bundling_disabled_host(options.host) );

		refresh_all_bundle_fingerprints(function() {
			return callback(null, tag_helpers, block_helpers, {});
		});
	},

	setup: function(config) {
		bundles = config.bundles;
		skip_hosts = config.skip_asset_bundling;

		asset_bundler.setup(config);
	}

};
