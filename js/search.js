'use strict';

$(function() {
  var $input = $('#searchForm input');
  var $results = $('#searchResults');

  // TODO: Let's put this on Blog-page instead
  $input.on('input', function() {
    var q = $(this).val();
    $.getJSON('/api/search?q='+q, function (response) {
      $results.html('');
      var $col1 = $('<div class="large-6 columns"></div>').appendTo($results);
      var $col2 = $('<div class="large-6 columns"></div>').appendTo($results);
      $.each(response, function(i, post) {
        var $hit = $('<div class="hit"></div>');
        $('<h4></h4>').html(post.titleHighlight).appendTo($hit);
        $('<p class="contentHighlight"></p>').html(post.contentHighlight).appendTo($hit);
        $hit.appendTo((i % 2 === 0) ? $col1 : $col2);
      });
    }).fail(function() {
      $results.html('');
    });
  });


});
