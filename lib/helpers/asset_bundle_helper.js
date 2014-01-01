var Path = require("path");
var _ = require("underscore");
var Util = require("util");
var Fs = require("fs");

var AssetBundler = require("../asset_bundler");
var HelperUtils = require("../utils/helper_utils");
var PathUtils = require("../utils/path_utils");

var bundles = {};

var bundle_fingerprints = {};

var bundles_last_modified = null;

var bundling_disabled = false;

var skip_hosts = [];

var fingerprint = false;

var template_dir = null;

var build_bundle_tag = function(template_tag, bundle) {
  var file_extension = PathUtils.getExtension(bundle, null);
  var request_basename = PathUtils.getBasename(bundle, file_extension);

  var output_path;

  if (fingerprint) {
    var bundle_fingerprint = bundle_fingerprints[bundle];
    if (bundle_fingerprint) {
      output_path = (request_basename + "-" + bundle_fingerprint.getTime() + file_extension);
    } else {
      // bundle path not found. Return an empty string while logging a message.
      console.log("Incorrect bundle path. '" + bundle + "' not available.")
      return "";
    }
  } else {
    output_path = (request_basename + file_extension);
  }

  return Util.format(template_tag, output_path);
};

var build_output_file_tag = function(template_tag, bundle_file, source_file) {
	var bundle_extension = PathUtils.getExtension(bundle_file, null);
	var source_extension = PathUtils.getExtension(source_file, null);

	var output_file = source_file.replace(source_extension, bundle_extension);

	return Util.format(template_tag, output_file);
};

var refresh_all_bundle_fingerprints = function(callback) {
	var bundle_names = _.keys(bundles);

	var refresh_bundle_fingerprint = function() {
		if (bundle_names.length) {
			var bundle = bundle_names.shift();
			var file_extension = PathUtils.getExtension(bundle, null);
			var request_basename = PathUtils.getBasename(bundle, file_extension);

			AssetBundler.statBundle(request_basename, file_extension, function(err, stat) {
				bundle_fingerprints[bundle] = stat.mtime;

				if (stat.mtime > bundles_last_modified) {
					bundles_last_modified = stat.mtime;
				}

				return refresh_bundle_fingerprint();
			});
		} else {
			return callback();
		}
	};

	if (fingerprint) {
		return refresh_bundle_fingerprint();
	} else {
		return callback();
	}
};

var expand_wildcard_in_bundling_disabled = function(config_bundled_files, filetype){
	var glob_pattern = new RegExp("[*][.]" + filetype + "$"); // /\*\.css$/ or /\*\.js$/
	var bundled_files = _.filter(config_bundled_files, function(v){
		return ! glob_pattern.test(v);
	});
	var wildcard_files = _.filter(config_bundled_files, function(v){
		return glob_pattern.test(v);
	});

	_.each(wildcard_files, function(wildcard_file){
		var dir_path = Path.dirname(wildcard_file);
		var absolute_dir_path = Path.join(template_dir, dir_path);
		var css_pattern = new RegExp("[.]" + filetype + "$");
		_.each(Fs.readdirSync(absolute_dir_path), function(file_path){
			if (css_pattern.test(file_path)) {
				bundled_files.push(Path.join(dir_path, file_path));
			}
		});
	});
	return bundled_files;
};

var tag_helpers = {};

var block_helpers = {

		stylesheet_bundle: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				var stylesheet_tag = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"%s\">";
				if (!bundling_disabled) {
					return build_bundle_tag(stylesheet_tag, text);
				}	else {
					var output = [];
					var bundled_files = expand_wildcard_in_bundling_disabled(bundles[text], "css");

					_.each(bundled_files, function(file) {
						output.push(build_output_file_tag(stylesheet_tag, text, file));
					});

					return output.join("\n");
				}
			});
		},

		javascript_bundle: function() {
			return HelperUtils.checkArgs(arguments, function(text) {
				var javascript_tag = "<script src=\"%s\"></script>";
				if (!bundling_disabled) {
					return build_bundle_tag(javascript_tag, text);
				}	else {
					var output = [];
					var bundled_files = expand_wildcard_in_bundling_disabled(bundles[text], "js");

					_.each(bundled_files, function(file) {
						output.push(build_output_file_tag(javascript_tag, text, file));
					});

					return output.join("\n");
				}
			});
		}
};

module.exports = {

	setup: function(config) {
		bundles = config.bundles;
		skip_hosts = config.asset_bundling.skip_hosts;
		fingerprint = config.asset_bundling.fingerprint;
		template_dir = config.template_dir;

		AssetBundler.setup(config);
	},

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };
	},

	get: function(basepath, file_extension, options, callback){
		var self = this;

		var is_bundling_disabled_host = function(given_host) {
			return _.any(skip_hosts, function(host) {
				return given_host.indexOf(host) > -1;
			});
		};

		bundling_disabled = !!( (options.host && options.host.length) && is_bundling_disabled_host(options.host) );

		refresh_all_bundle_fingerprints(function() {
			return callback(null, { "tag": tag_helpers, "block": block_helpers }, {}, bundles_last_modified);
		});
	},

};
