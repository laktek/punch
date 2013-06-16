var _ = require("underscore");
var Fs = require("fs");

var SiteGenerator = require("./site_generator");
var ModuleUtils = require("./utils/module_utils");

module.exports = {

	config: {},

	lastPublishedDate: null,

	requireStrategy: function(strategy) {
		var self = this;

		if (_.has(self.config.plugins.publishers, strategy)) {
			return ModuleUtils.requireAndSetup(self.config.plugins.publishers[strategy]);
		} else {
			var error = (strategy + " isn't available as a publishing strategy.");
			throw error;
		}
	},

	delegatedPublish: function(strategy_obj) {
		var self = this;
		var error = "Publish property not defined or it's not a function.";

		if (_.has(strategy_obj, "publish") && _.isFunction(strategy_obj["publish"])) {
			strategy_obj.publish(self.config, self.lastPublishedDate, function() { return self.afterPublish(); });
		} else {
			throw error;
		}
	},

	afterPublish: function() {
		var self = this;

		self.setLastPublishedDate();

		console.log("Publishing complete");
	},

	setLastPublishedDate: function() {
		var self = this;
		var timestamp_file = self.config.publish.timestamp_file || ".last_published";

		try {
			var current_time = +new Date();
			Fs.writeFileSync(timestamp_file, current_time, "utf8");
		} catch (e) {
			// gotcha
		}
	},

	getLastPublishedDate: function() {
		var self = this;
		var timestamp_file = self.config.publish.timestamp_file || ".last_published";

		try {
			self.lastPublishedDate = new Date(parseInt(Fs.readFileSync(timestamp_file, "utf8"), 10));
		} catch (e) {
			self.lastPublishedDate = null;
		}
	},

	publish: function(config) {
		var self = this;
		var strategy_obj = null;

    self.config = config;

		if (!config.publish || _.isEmpty(config.publish)) {
			var error = "No publishing settings found. Specify the publish settings in the config file.";
			throw(error);
		} else {
			var specified_strategy = config.publish.strategy;
			strategy_obj = self.requireStrategy(specified_strategy);
		}

		self.getLastPublishedDate();

		var publish_site = function() {
			console.log("Publishing the site...");
			self.delegatedPublish(strategy_obj);
		};

		if(config.publish.generate) {
			SiteGenerator.setup(config);

			console.log("Generating the site before publishing...");

			SiteGenerator.generate(function() {
				return publish_site();
			});
		} else {
			return publish_site();
		}
	}

};
