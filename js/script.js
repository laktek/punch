/* Author:

*/


$(document).ready(function(){
	
	// Run Matt Kersley's jQuery Responsive menu plugin (see plugins.js)
	if ($.fn.mobileMenu) {
		$('ol#id').mobileMenu({
			switchWidth: 768,                   // width (in px to switch at)
			topOptionText: 'Choose a page',     // first option text
			indentString: '&nbsp;&nbsp;&nbsp;'  // string for indenting nested items
		});
	}

  // Load and Render GitHub followers
  (function(){
    if($("#github_followers").length > 0){
      var renderer = new MustacheRenderer();

      renderer.afterRender = function(output){
        $("#github_followers").html(output);
      };

      renderer.setTemplate('{{#followers}} \
                            <a href="http://github.com/{{login}}" rel="nofollow"><img size="16" src="{{avatar_url}}" title="{{login}}" alt="{{login}}"/></a> \
                            {{/followers}} \
                          ');
      renderer.setPartials({});

      $.getJSON("https://api.github.com/repos/laktek/punch/watchers", function(data){
        renderer.setContent({"followers": data});
      });
    }
  })();

});







