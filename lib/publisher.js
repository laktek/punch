var _ = require("underscore");
var fs = require("fs");

var default_config = require("./default_config.js");
var site_generator = require("./site_generator.js");

module.exports = {

	config: {},

	requireStrategy: function(strategy) {
		var self = this;

		if (_.has(self.config.plugins.publishers, strategy)) {
			return require(self.config.plugins.publishers[strategy]);
		} else {
			var error = strategy + " isn't available as a publishing strategy."
			throw error;
		}
	},

	delegatedPublish: function(strategy_obj) {

		var self = this;
		var error = "Publish property not defined or it's not a function.";

		if (_.has(strategy_obj, "publish") && _.isFunction(strategy_obj["publish"])) {
			strategy_obj.publish(self.config);
		} else {
			throw error;
		}
	},

	setLastPublishedDate: function() {
		var self = this;
		var timestamp_file = (self.config.publish.timestamp_file || ".last_published");

		try {
			self.lastPublishedDate = new Date(parseInt(fs.readFileSync(timestamp_file, "utf8")));
		} catch (e) {
			self.lastPublishedDate = null;
		}
	},

	publish: function(supplied_config, selected_strategy) {
		var self = this;
		var strategy_obj = null;

    self.config = _.extend(_.clone(default_config), supplied_config);

		if (selected_strategy) {
			strategy_obj = self.requireStrategy(selected_strategy);		
		} else {
			if (!supplied_config.publish || _.isEmpty(supplied_config.publish)) {
				var error = "No publishing strategy found. Set a publishing strategy in config file."
				throw(error);
			} else {
				var first_strategy = _.keys(self.config.publish)[0];
				strategy_obj = self.requireStrategy(first_strategy);	
			}
		}

		self.setLastPublishedDate();

		site_generator.setup(self.config);

		console.log("Generating the site before publishing...");

		site_generator.generate(function() {
			console.log("Publishing the site...")
			self.delegatedPublish(strategy_obj);
		});
	}

}
