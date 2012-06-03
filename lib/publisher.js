var _ = require("underscore");

module.exports = {
	config: {},

	require_strategy: function(strategy){
			
	},

	publish: function(supplied_config, selected_strategy){

		var self = this;
		self.config = supplied_config;

		if(selected_strategy){
			self.require_strategy(selected_strategy);		
		} else {
			if(!supplied_config.publish || _.isEmpty(supplied_config.publish)){
				var error = "No publishing strategy provided. Provide your publishing strategy in config.json"
				throw(error);
			} else {
				var first_strategy = _.keys(supplied_config.publish)[0];
				self.require_strategy(first_strategy);	
			}
		}
	}
}
