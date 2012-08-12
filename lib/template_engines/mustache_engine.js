/*
* Template engine for Mustache
* Based on Mustache.js - https://github.com/janl/mustache.js 
*/

var BaseEngine = require("./base_engine.js");
var Mustache = require("mustache");
var util = require('util');

function MustacheEngine(options){
	BaseEngine.call(this, options);

	this.extension = MustacheEngine.extension;
	this.renderFunction = MustacheEngine.renderFunction;
};

util.inherits(MustacheEngine, BaseEngine);

MustacheEngine.extension = ".mustache";

MustacheEngine.renderFunction = function(template, content, partials) {
	return Mustache.render(template, content, partials);
}

module.exports = MustacheEngine;
