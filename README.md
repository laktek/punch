# Punch 
### Fun and easy way to manage little websites 

Punch is a simple tool to generate a static website out of [Mustache](http://mustache.github.com/) templates and content stored in either [JSON](http://json.org) or [Markdown](daringfireball.net/projects/markdown/) format.

### Why Punch is awesome?

* Total freedom over templating (logic-less templates, not tied to any programming language).
* Flexible content structure (use any JSON data strcuture for your content).
* Use your favorite editor to edit the site (without getting stuck in a crappy WYSIWYG editor)
* Use your favorite SCM to version control the content (Git, Darc, Mercurial or even Zip files).
* Host it anywhere! (all you need is a server capable of serving HTML).

### Punch is great for:

* App Promo sites
* Portfolio sites
* Event Marketing sites

(& also for your cat's homepage)

** Remember: Punch is not a blogging engine **
(You can use [Jekyll](https://github.com/mojombo/jekyll) and other similar tools to power a blog)

### Installation

* Download and Install Node.js.
 
    http://nodejs.org/#download 

* Install `npm`

    `curl http://npmjs.org/install.sh | sh`

* Then run `npm intall punch`

### Usage

* Start by creating a new directory to hold your site. (`mkdir mysite`)

* Run `punch --setup` to create a skeleton. (it will create a `templates` directory, `contents` directory and `config.json` file)

* Create your site's structure inside the `templates` directory. Punch will try to render templates with `.mustache` extension and any other file (JS, CSS & images) will be copied as it is.

* When rendering a mustache template, Punch will look for relavant content for the template in `contents` directory. You can serve the content in a single `.json` file or as a collection of `.markdown` and `.json` file inside a directory.

For example, to render `about.mustache` template you can provide content in `about.json` file or in a directory called `about` which can have bunch of content in `.markdown` or `.json` format. 

* To generate the site, run the command `punch` in the main site directory. Generated site can be found inside the `public` directory.

* Go inside the `public` directory and run `python -m SimpleHTTPServer`. Then point your browser to `http://localhost:8000` to see your site in action!

### Additional Features

**Partial templates**

You can specify reusable partial templates with Punch. Partial templates should be named with a leading underscore character (eg. `_sidebar.mustache`). To render a partial in another template, do this:  

    {{> sidebar }}

**Shared content**

If you create a JSON file with the name `shared.json` or a directory named `shared` under `contents` its content will be automatically available for all templates in your site.

**Using the renderer in browser**

It's possible to use the Punch's renderer in the browser as well. All you need to do is include the latest [`mustache.js`](https://github.com/janl/mustache.js/) and the [Punch's renderer](https://github.com/laktek/Punch/tree/master/lib/renderers) in your client-side script.

    <script type="text/javascript" src="assets/mustache.js"></script>
    <script type="text/javascript" src="node_modules/punch/lib/renderers/mustache.js"></script>

Here's how you can use it in the browser:

    var renderer = new MustacheRenderer();

    renderer.afterRender = function(output){
      document.getElementById("client_block").innerHTML = output;
    };

    renderer.setTemplate('<p>{{content}}</p>');
    renderer.setContent({"content": "test"});
    renderer.setPartials({});
 
Since Punch's renderer is asynchronous, you can call `setTemplate`, `setContent` and `setPartials` once you have the data (eg. after loading via AJAX). Rendering will happen when the renderer receives all 3 method calls.

**Configuration options**

    {
      template_dir: "templates",      // directory to look for templates
      content_dir: "contents",        // directory to look for contents
      output_dir: "public",           // directory to save the generated output
      output_extension: "html",       // default extension to use for output files
      shared_content: "shared",       // name of the file/directory of shared content inside `contents`

      // register new renderers or parsers (paths should be valid node.js require paths)

      renderers: {
        "mustache": "./renderers/mustache" 
      },
      parsers: {
        "markdown": "./parsers/markdown" 
      }
    };

Sample
------

Checkout the sample available at `/sample` to understand the directory structure and configurations.

Issues & Suggestions
--------------------

Please report any bugs or feature requests here:
http://github.com/laktek/punch/issues/

