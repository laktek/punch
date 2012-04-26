Here's a step by step guide on how to create a simple HTML site using Punch.

* First of all we should create a new directory for our site. (`mkdir awesome_site`)

* Then, go inside the directory (`cd awesome_site`) and run the command `punch setup`.

* This will create two directories to hold `templates` and `contents`. Also, it will add a `config.json` file which contains the default configuration for Punch.

* Say we want to have a page called `about.html`, to give an overview of the company and details of the team members.

* First we must create a corresponding template for the page inside `templates` directory.

* Here's how our `about.mustache` template will look like.

      <!doctype html>

      <head>
      <meta charset="utf-8">

      <title>{{title}}</title>
      </head>

      <body>

        <h1>{{title}}</h1>

       <p>{{{overview}}}</p> 
        
        <ul>
          {{#team}}
            <li><strong>{{name}} - {{bio}}</li>
          {{/team}}
        <ul>
      </body>
      </html>

* Now inside `contents` directory let's create a file called `about.json` to hold the corresponding content.

* We'll add the following content in `about.json`.
  
      {
        "title": "About Us",
        "team": [
          {
            "name": "Pointy-Haired Boss",
            "bio": "Incompetent Manager"
          },

          {
            "name": "Wally",
            "bio": "Senior Engineer"
          },

          {
            "name": "Dilbert",
            "bio": "Engineer"
          }
        ]
      }

* We also have a lengthy company overview written in markdwon format. Instead of adding it to the `about.json` file, we'll be keeping it seperately. For that we create a new directory named `about` inside the `contents` directory and save the markdown file there as `overview.markdown`.

* Now we can generate the site, for that go back to the top-most directory (`cd ../`) and run the command `punch`.

* Punch will output the generated pages in a directory named `public`.

* To view the generated site you can run the command `python -m SimpleHTTPServer` inside the `public` directory. 

* Then point your browser to `http://localhost:8000/about.html` to see the generated about page.

### Additional Features

#### Partial Templates

You can specify reusable partial templates with Punch. Partial templates should be named with a leading underscore character (eg. `_sidebar.mustache`). To render a partial in another template, do this:  

    {{> sidebar }}

#### Shared Content

If you create a JSON file with the name `shared.json` or a directory named `shared` under `contents` its content will be automatically available for all templates in your site.

#### Client-side Rendering 

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

#### Configuration Options

    {
      "template_dir": "templates",      // directory to look for templates
      "content_dir": "contents",        // directory to look for contents
      "output_dir": "public",           // directory to save the generated output
      "output_extension": "html",       // default extension to use for output files
      "shared_content": "shared",       // name of the file/directory of shared content inside `contents`

      // register new renderers or parsers (paths should be valid node.js require paths)

      "renderers": {
        "mustache": "./renderers/mustache" 
      },
      "parsers": {
        "markdown": "./parsers/markdown" 
      }
    };
