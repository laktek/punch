var _ = require("underscore");

module.exports = {

	requireAndSetup: function(id, config) {
		var exported_module = require(id);	

		if (_.has(exported_module, "setup")) {
			exported_module.setup(config);
		}

		return exported_module
	}

}
