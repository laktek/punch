var _ = require("underscore");
var path = require("path");

module.exports = {

	requireAndSetup: function(id, config) {
		if (id.indexOf("./") === 0) {
			var exported_module = require(path.join(process.cwd(), id));	
		} else {
			var exported_module = require(id);	
		}

		if (_.has(exported_module, "setup")) {
			exported_module.setup(config);
		}

		return exported_module
	}

}
