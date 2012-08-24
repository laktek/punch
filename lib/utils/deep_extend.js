var _ = require("underscore");

var deepExtend = function(destination, source) {

	var copyValueToDestination = function(value, key) {
		if (_.isArray(value)) {
			destination[key] = [].concat(value);
		} else if (_.isObject(value)) {
			destination[key] = {};
			_.each(value, function(v, k) {
				destination[key][k] = v;
			});
		} else {
			destination[key] = value;
		}
	};

	_.each(source, function(value, key) {
		if (_.has(destination, key))	{

			if (_.isArray(destination[key])) {
				destination[key] = destination[key].concat(value);
			} else if (_.isObject(destination[key])) {
				deepExtend(destination[key], value);
			}	else {
				copyValueToDestination(value, key);
			}

		} else {
			// check if the given property is an explicit Override property
			var override_pos = key.indexOf("Override");
			if (override_pos > 0) {
				var override_key = key.substring(0, override_pos);
				copyValueToDestination(value, override_key);
			} else {
				copyValueToDestination(value, key);
			}
		}
	});

	return destination;
};

module.exports = deepExtend;
