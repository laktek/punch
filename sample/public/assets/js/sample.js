(function() {
  var square;

  square = function(x) {
    return x * x;
  };

  $("body").append("<p>Added from CoffeeScript - " + (square(2)) + "<p>");

}).call(this);
