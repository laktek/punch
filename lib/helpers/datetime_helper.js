var getDateValue = function(text){
	return String(text).match(/^\d+$/) ? parseInt(text) : text;
};

var tag_helpers = {
	timestamp: function() {
		return new Date().getTime();	
	}
};

var block_helpers = {

	datetime: function(text, render) {
		var rendered_text = render(text);
		return (new Date( getDateValue(rendered_text) )).toString();
	},

	date: function(text, render) {
		var rendered_text = render(text);
		return (new Date( getDateValue(rendered_text) )).toDateString();
	},

	time: function(text, render) {
		var rendered_text = render(text);
		return (new Date( getDateValue(rendered_text) )).toTimeString();
	},

	iso_date: function(text, render) {
		var rendered_text = render(text);
		return (new Date( getDateValue(rendered_text) )).toISOString();
	}

};

module.exports = {

	directAccess: function(){
		return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };	
	},

	get: function(basepath, content_type, options, callback){
		var self = this;

		return callback(null, tag_helpers, block_helpers, {}); 
	}
}
