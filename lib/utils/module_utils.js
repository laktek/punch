var _ = require("underscore");
var Path = require("path");

module.exports = {

	wrappedRequire: function(path) {
		return require(path);
	},

	requireAndSetup: function(id, config) {
		var self = this;
		var exported_module;

		if (id.indexOf("./") === 0) {
			exported_module = self.wrappedRequire(Path.join(process.cwd(), id));
		} else {
			// try to load the module from /node_modules relative to
			// current working directory.
			var parts = process.cwd().split(Path.sep);
			var paths = [];

			for (var tip = parts.length - 1; tip >= 0; tip--) {
				// don't search in .../node_modules/node_modules
				if (parts[tip] === "node_modules") {
				 continue;
				}
				var dir = parts.slice(0, tip + 1).concat("node_modules").join(Path.sep);
				paths.push(Path.join(dir, id));
			}

			// if relative paths fail,
			// delegate module load to node's default procedure.
			paths.push(id);

			var load_module_from_paths = function() {
				try {
					exported_module = self.wrappedRequire(paths.shift());
				} catch (e) {
					if (paths.length) {
						return load_module_from_paths();
					} else {
						throw(e);
					}
				}
			};

			load_module_from_paths();
		}

		if (_.has(exported_module, "setup")) {
			exported_module.setup(config);
		}

		return exported_module;
	}

};
