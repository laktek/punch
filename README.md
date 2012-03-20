# Punch 
### Generate static sites with mustache templates & json

I'll update the README soon with more elaborative details and examples.

Installation
------------

* Download and Install Node.js.
 
  http://nodejs.org/#download 

* Install `npm`

  curl http://npmjs.org/install.sh | sh

* Then run `npm intall punch`

Conventions
-----------

Templates should be available in mustache format. Other formats are copied directly without going through the renderer.
 
Content should be either in JSON format or markdown. Markdown is converted to a JSON value with the file name as the key.
 
Punch will render each template by fetching the relavant content. It moves the rendered file into output directory (preserving the directory structure). Uses .html (or what's specified in the config file) as the default extension (eg. index.mustache -> index.html)


Issues & Suggestions
--------------------

Please report any bugs or feature requests here:
http://github.com/laktek/punch/issues/

