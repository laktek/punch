var markdown_parser = require("../../lib/parsers/markdown.js");

describe("parsing given content", function() {

  it("calls the callback with desired output", function() {
    var output = null;

    var markdown_instance = new markdown_parser(); 
    markdown_instance.parse("*sample text*", function(parsed_content){
      output = parsed_content; 
    });

    waits(100);

    runs(function(){
      expect(output).toEqual("<p><em>sample text</em></p>\n");
    });

  });

});

