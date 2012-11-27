/*jshint regexp: false */
/*global $:true, window: true */

(function() {

	var main_text = $("div[role=main]").text();

	var conditions = {
		"initial": function() { return window.location.pathname === "/" && $.trim(main_text) === "" },
		"step2": function() { return window.location.pathname === "/" && $.trim(main_text) === "This is just a placeholder." },
		"step3": function() { return window.location.pathname === "/" && $("div[role=main] p").length < 1 },
		"step4": function() { return window.location.pathname !== "/about" && $(".navbar").children().length < 1 },
		"step5": function() { return window.location.pathname === "/about" && $(".navbar").children().length < 1 },
		"step6": function() { return window.location.pathname === "/about" && $(".navbar").children().length > 1 },
		"step7": function() { return window.location.pathname !== "/about" && $("div[role=main] img").length < 1 },
		"step8": function() { return true }
	};

	var messages = {
			"initial": "Thanks for trying out Punch! This <b>quick hands-on tutorial</b> will help you to get familiar with the basics of Punch (It won't take more than 15 minutes).\b[Let's Start!](#show_help)",

			"step1": "We believe the separation of content from its presentation is important for any kind of site. To make this easy, Punch creates two directories named `contents` and `templates`. All information you wish to communicate should go in `contents`; all presentational elements (layouts, assets) should be placed in `templates`.\bIf you go inside the `templates` directory, you will find a file named `_layout.mustache`. This is the main layout of your site. You can create different layouts for different sections of your site. For now, we shall use the main layout to render all pages.\bOpen the `_layout.mustache` and place the tag `{{{intro}}}` inside `&lt;div role=\"main\"&gt;&lt;/div&gt;`.\bReload this page when you're done.",

			"step2": "Did you notice that the `intro` tag you just placed, got replaced with some placeholder text? Let's try to figure out how it happened.\bWhen Punch serves a request, it looks for the best matching content and layout to render the requested page. In this case, we requested for the `/index.html` page. So, Punch chose `contents/index.json` as the best matching content and the main layout to render the page.\bIf you look in `contents/index.json`, you will find the `intro` property defined. You can change its value and see the effect.\bReload this page after changing the value of `intro`.",

			"step3": "Nice! You should now see the value you just defined got rendered on the page. [JSON](http://json.org) is a good way to define short, structured content. But what about long, formatted texts we often want to insert into our pages? It would be cumbersome if we had to write HTML tags inside JSON strings. Well, there's a smarter option - [Markdown](http://daringfireball.net/projects/markdown/).\bLet's try to define the intro text using Markdown. For that, we need to create a directory named `_index` under `contents`. Then inside it, create a file named `intro.markdown`. Write the intro in that file, using Markdown. Make sure you break the text into multiple paragraphs, emphasize points and add links.\bReload the page again, to see how updated intro will render.",

			"step4": "You're picking up so fast! Notice how you can provide content for a page, in a JSON file named by the page name(`index.json`) and/or a directory named by the page name preceded with an underscore(`_index`), placed inside `contents`.\bSuch a directory, is known as extended contents, can contain parsable content such as Markdown files or even JSON files. Those content can be accessed in layouts by the name of the file (eg. `intro.markdown` is accessed as `intro`).\bFollowing these concepts, let's add a About page to the site. Create a directory named `_about` in `contents` and place a `intro.markdown` file for the About page as well.\bOnce done, visit [http://" + location.hostname + ":" + location.port + "/about](/about) to see the About page you just created.",

			"step5": "Great job! Since there are already two pages in the site, it's better to add a navbar.\bOpen the `shared.json` file in `contents` and modify the `navbar` property to look like this:\b<pre>\"navbar\": [\n    { \"label\": \"Home\", \"href\": \"/\" },\n    { \"label\": \"About\", \"href\": \"/about\" }\n]</pre>\bAlso, you can change the title of your site by changing the `site-title` property.\bReload the page, when you're done.",

			"step6": "Sweet! This site is coming up nicely. If you want to change the markup used for the site title and navbar, you can do it by editing `templates/_header.mustache`. Layout files, other than the `_layout.mustache`, that has a name starting with an underscore are known as partial layouts. You can include them in other layouts, using the following syntax - `{{> header }}`.\bAlso note, any property you define in `contents/shared.json` is made available to all pages of the site.\bNow let's go back to [homepage](/) and try to make it little prominent.",

			"step7": "So far we used the main layout (`templates/_layout.mustache`) to render all pages of the site. We shall create a separate layout for the homepage to make it more prominent.\bYou can create a new layout by simply copying the `_layout.mustache` into a new file. Save it as `index.mustache`.\bIf there's a layout by the name of a requested page, Punch will use that layout to render the page (eg. `index.mustache` will be picked to render `/index` request).\bThere are many interesting things you can try on homepage; but for now we'll just insert a banner image. Copy a suitable image into `templates` directory. Then, modify the markup of `index.mustache` to show the image:\b<pre>&lt;div role=\"main\"&gt;\n  &lt;img src=\"banner.jpg\"&gt;\n  {{{intro}}}\n&lt;/div&gt;</pre>Reload the page, when you're done.",

			"step8": "Woah! Look you just created a nice little site with Punch :)\bTo learn further on the concepts we touched upon and discover other great features in Punch, you can peruse [Punch Guide](https://github.com/laktek/punch/wiki).\bTo remove this block, go to `templates/_footer.mustache` and remove the tag `{{{first_run}}}`.\bHappy Hacking!",

			"skip": "To remove this block, go to `templates/_footer.mustache` and remove the tag `{{{first_run}}}`.\bBTW, [Punch Guide](https://github.com/laktek/punch/wiki) might come in handy, when you want to refer how to get certain things done.\bHappy Hacking!"
	};

	var setupHelpBox = function() {
		var help_box = $("<div>").attr("id", "punch-help-box");
		var help_message = $("<div>").attr("class", "message");
		var sticky_links = $("<span>").append("<a href=\"https://github.com/laktek/punch/wiki\">Got stuck? Seek help</a> | <a href=\"#no_help\">Skip the tutorial</a>");

		$(help_box).append(help_message).append(sticky_links);
		$("div[role=main]").append(help_box);
	};

	var setMessage = function(msg, replace) {
		var msg_lines = messages[msg].split("\b");
		var help_box = $("#punch-help-box .message");
		var formatted_msg = $("<div>");

		var add_markup = function(text) {
			return text.replace(/`([^`]*)`/g, "<code>$1</code>").replace(/\[([^\]]*)\]\(([\S]*)\)/g, "<a href=\"$2\">$1</a>");
		};

		for(var i = 0; i < msg_lines.length; i++) {
			formatted_msg.append($("<p>").html(add_markup(msg_lines[i])));
		}

		if (replace) {
			help_box.html(formatted_msg);
		} else {
			help_box.append(formatted_msg);
		}
	};

	var checkConditions = function(){
		$.each(conditions, function(key, value) {
			if(value()) {
				setMessage(key);
				return false;
			}
		});
	};

	$("div[role=main]").delegate("a", "click", function() {
		var link = $(this).attr("href");

		if(link === "#show_help") {
			setMessage("step1", true);
			return false;
		} else if(link === "#no_help") {
			setMessage("skip", true);
			return false;
		}
	});

	setupHelpBox();
	checkConditions();

})();
