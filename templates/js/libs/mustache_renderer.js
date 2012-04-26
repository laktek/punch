/*
 * Renderer for Mustache
 * Based on Mustache.js - https://github.com/janl/mustache.js 
*/

if(typeof require !== "undefined"){
  var Mustache = require("mustache");
}

function MustacheRenderer(){
  this.afterRender = null;
  this.template = null;
  this.content = null;
  this.partials = null;
};

MustacheRenderer.prototype.setTemplate = function(template){
  this.template = template;

  if(this.template && this.content && this.partials){
    this.render(); 
  };
};

MustacheRenderer.prototype.setContent = function(content){
  this.content = content;

  if(this.template && this.content && this.partials){
    this.render(); 
  };
};

MustacheRenderer.prototype.setPartials = function(partials){
  this.partials = partials;

  if(this.template && this.content && this.partials){
    this.render(); 
  };
}

MustacheRenderer.prototype.render = function(){
  var output = Mustache.render(this.template, this.content, this.partials);  
  
  if(typeof this.afterRender === "function"){
    this.afterRender(output); 
  } else {
    return output; 
  }
}

if(typeof module !== "undefined" && module.exports){
  module.exports = MustacheRenderer;
}
