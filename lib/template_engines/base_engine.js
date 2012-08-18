/*
 * Base template engine to extend and create custom template engines
 * Based on Mustache.js - https://github.com/janl/mustache.js 
*/

var events = require('events');
var util = require('util');

function BaseEngine(options) {
	events.EventEmitter.call(this);

  this.afterRender = null;
  this.template = null;
  this.content = null;
  this.partials = null;
  this.helpers = null;

	this.rendering_canceled = false;
	this.lastRender = (options && options.lastRender) || null;
	this.lastModified = null;

	this.extension = null;
	this.renderFunction = null;
};

util.inherits(BaseEngine, events.EventEmitter);

BaseEngine.prototype.setTemplate = function(template, last_modified) {
	var self = this;
  self.template = template;

	if (last_modified > self.lastModified) {
		self.lastModified = last_modified;	
	}

  return self.render(); 
};

BaseEngine.prototype.setContent = function(content, last_modified) {
  var self = this;
  self.content = content;

	if (last_modified > self.lastModified) {
		self.lastModified = last_modified;	
	}

  return self.render(); 
};

BaseEngine.prototype.setPartials = function(partials, last_modified) {
	var self = this;
  self.partials = partials;

	if (last_modified > self.lastModified) {
		self.lastModified = last_modified;	
	}

  return self.render(); 
};

BaseEngine.prototype.setHelpers = function(helpers) {
	var self = this;
  self.helpers = helpers;

  return self.render(); 
};

BaseEngine.prototype.render = function() {
	var self = this;

	if(self.template && self.content && self.partials && self.helpers && !self.rendering_canceled) {
		if(self.lastModified > self.lastRender) {
			try {
				var output = self.renderFunction(self.template, self.content, self.partials, self.helpers);  
				var modified = true;
			} catch (err) {
				return self.emit("renderCanceled", err, 500);
			}
		} else {
			var output = null;	
			var modified = false;
		}

		return self.emit("renderComplete", output, modified);
	}
};

BaseEngine.prototype.cancelRender = function(err, status_code) {
	var self = this;

	// rendering already canceled; do nothing
	if (self.rendering_canceled) {
		return;
	}

	self.rendering_canceled = true;
	self.emit("renderCanceled", err, (status_code || 404));
}

module.exports = BaseEngine;
