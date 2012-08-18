/*
* Template engine for Mustache
* Based on Mustache.js - https://github.com/janl/mustache.js 
*/

var BaseEngine = require("./base_engine.js");
var Mustache = require("mustache");

var _ = require("underscore");
var util = require('util');

function MustacheEngine(options){
	BaseEngine.call(this, options);

	this.extension = MustacheEngine.extension;
	this.renderFunction = MustacheEngine.renderFunction;
};

util.inherits(MustacheEngine, BaseEngine);

MustacheEngine.extension = ".mustache";

MustacheEngine.renderFunction = function(template, content, partials, helpers) {
	// since mustache doesn't have built-in support helpers,
	// we'll extend the content object with helpers.
	var content_with_helpers = _.extend({}, content, helpers.tag_helpers);

	_.each(helpers.block_helpers, function(helper_function, name) {
		content_with_helpers[name] = function() { return helper_function };
	});
	
	return Mustache.render(template, content_with_helpers, partials);
}

module.exports = MustacheEngine;
