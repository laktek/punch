/*
* Should load registered renderers (mustache) and pre-processors (coffeeScript, SASS)

* Should receive name, content-type, last modified date, options object
* Proceed according to the content-type of the request.
	- if it a static file serve it from templates
	- if it is a pre-processor type, file process using the its pre-processor.
	- else:
		-- look for available content.
		-- look for a template file with the same name as content file.
		-- if not, look for a layout in the same path.
		-- if not, go one level up until it finds a layout 
		-- if no layout found throw an exception.
		-- finally, render the content with the correct template
	Note: on each case renderer should check the last modified date, if the contents hasn't change it should just say "not modified"

*/

var renderer = require("../lib/renderer.js");

describe("handle rendering request", function(){

  it("check if there is a registered renderer for given content type", function(){
		
		spyOn(renderer, "canRender");

		renderer.render("test", "magic", null, {});

		expect(renderer.canRender).toHaveBeenCalledWith("magic");
  }); 

});

