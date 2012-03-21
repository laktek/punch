# Punch 
### An easy way to generate static sites with Mustache templates & JSON

NOTE: I will update the README with more elaborative details and examples.

Installation
------------

* Download and Install Node.js.
 
    http://nodejs.org/#download 

* Install `npm`

    `curl http://npmjs.org/install.sh | sh`

* Then run `npm intall punch`

Usage
-----

Go inside your site's directory and then run `punch` to generate the output. 

If you got a `config.json` file inside the site's directory its configurations will be used to generate  the site. Alternatively, you can provide a path to custom configuration file when running punch (eg. `punch path/to/config`) 

If no configuration found, `punch` will use the default configurations. According to default configurations, you expect to have `templates` and `contents` directories and output will be written to `public` directory.

Sample
------

Checkout the sample available at `/sample` to understand the directory structure and configurations.

Conventions
-----------

Templates should be available in mustache format. Other formats are copied directly without going through the renderer.
 
Content should be either in JSON format or markdown. Markdown is converted to a JSON value with the file name as the key.
 
Punch will render each template by fetching the relavant content. It moves the rendered file into output directory (preserving the directory structure). Uses .html (or what's specified in the config file) as the default extension (eg. index.mustache -> index.html)


Issues & Suggestions
--------------------

Please report any bugs or feature requests here:
http://github.com/laktek/punch/issues/

