var renderer = new MustacheRenderer();

renderer.afterRender = function(output){
  document.getElementById("client_side").innerHTML = output;
};

renderer.setTemplate('<p>{{content}}</p>');
renderer.setContent({"content": "test"});
renderer.setPartials({});

