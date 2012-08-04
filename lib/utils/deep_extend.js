var _ = require("underscore");

var deepExtend = function(destination, source) {
	_.each(source, function(value, key) {
		if (_.has(destination, key))	{

			if (_.isArray(destination[key])) {
				destination[key] = destination[key].concat(value);	
			} else if (_.isObject(destination[key])) {
				deepExtend(destination[key], value);
			}	else {
				destination[key] = value;	
			}

		} else {
			// check if the given property is an explicit Override property
			var override_pos = key.indexOf("Override"); 
			if (override_pos > 0) {
				var override_key = key.substring(0, override_pos);	
				destination[override_key] = value;
			} else {
				destination[key] = value;	
			}
		}
	});

	return destination
}

module.exports = deepExtend
