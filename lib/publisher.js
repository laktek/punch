var _ = require("underscore");

var default_config = require("./default_config.js");

module.exports = {

	config: {},

	requireStrategy: function(strategy){
		var self = this;

		if(_.has(self.config.publishers, strategy)){
			return require(self.config.publishers[strategy]);
		} else {
			var error = strategy + " isn't available as a publishing strategy."
			throw error;
		}
	},

	delegatePublish: function(strategy_obj){
		var error = "Publish not defined or not a function.";

		if(_.has(strategy_obj, "publish") && _.isFunction(strategy_obj["publish"]))
			strategy_obj.publish();
		else
			throw error;
	},

	publish: function(supplied_config, selected_strategy){

		var self = this;
		var strategy_obj = null;

		// extend the default configuration
    self.config = _.extend(_.clone(default_config), supplied_config);

		if(selected_strategy){
			strategy_obj = self.requireStrategy(selected_strategy);		
		} else {
			if(!supplied_config.publish || _.isEmpty(supplied_config.publish)){
				var error = "No publishing strategy found. Set a publishing strategy in config file."
				throw(error);
			} else {
				var first_strategy = _.keys(supplied_config.publish)[0];
				strategy_obj = self.requireStrategy(first_strategy);	
			}
		}

		self.delegatePublish(strategy_obj);
	}

}
