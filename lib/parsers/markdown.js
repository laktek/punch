/*
 * Parser for Markdown templates
 * Based on Marked - https://github.com/chjj/marked
*/
var marked = require("marked");

function MarkdownParser(){
  //set default options
  marked.setOptions({
    gfm: true,
    pedantic: false,
    sanitize: false 
  });
};

MarkdownParser.prototype.parse = function(data, callback){
  callback(marked(data.toString())); 
}

module.exports = MarkdownParser;
