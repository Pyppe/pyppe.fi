'use strict';

$(function() {

  var $posts;
  adjustSideImages();
  var interval = setTimeout(adjustSideImages, 1500);

  function adjustSideImages() {
    if (!$posts) {
      $posts = $('#blog > .post .aside').map(function() {
        return $(this).closest('.post');
      });
    }
    $posts.each(function() {
      var $post = $(this).closest('.post');
      var $aside = $post.find('.aside').css('margin-top', '0');
      var $right = $post.find('.rightColumn');
      var $left = $post.find('.leftColumn');
      var diff = Math.floor($left.height() - $right.height()) + 9;
      if (diff > 0) {
        $aside.css('margin-top', diff + 'px');
      }
    });
  }

  $(window).resize(adjustSideImages);
});

$(function() {

  createSearchElements();
  var $openSearch = $('#openSearch');
  var $search = $('#search');
  var $blog = $('#blog');
  var $searchResults = $('#searchResults');

  $openSearch.click(function() {
    showSearchBar($search.is(':hidden'));
  });
  $('#closeSearch').click(function() {
    showSearchBar(false);
  });

  var xhr;
  var timeout;
  function search(q) {
    clearTimeout(timeout);
    if (xhr && xhr.readyState != 4){
      xhr.abort();
    }
    timeout = setTimeout(function() {
      xhr = $.ajax({
        url: '/api/search?q=' + q,
        success: function(response) {
          $results.html('');
          var $col1 = $('<div class="large-6 columns"></div>').appendTo($results);
          var $col2 = $('<div class="large-6 columns"></div>').appendTo($results);
          $.each(response, function(i, post) {
            var $hit = $('<div class="hit"></div>');
            var url = location.pathname + '/' + post.path;
            if (post.wideImage) {
              $('<img />').
                  attr('src', post.wideImage + '?v=medium').
                  attr('style', 'width: 100%;').
                  appendTo($hit);
            }
            $('<a></a>').
                attr('href', url).
                html('<h3>'+post.titleHighlight+'</h3>').
                appendTo($hit);
            $('<h5></h5>').text(moment(post.time).format('LL')).appendTo($hit);
            if (!post.wideImage && post.image) {
              $('<img />').
                  attr('src', post.image + '?v=tiny').
                  attr('style', 'float: right; padding-left: 5px; padding-bottom: 10px;').
                  appendTo($hit);
            }
            var $p = $('<p class="contentHighlight"></p>').html(post.contentHighlight).appendTo($hit);
            $('<a></a>').attr('href', url).html(readMoreHtml).appendTo($p);
            $('<hr/>').appendTo($hit);
            $hit.appendTo((i % 2 === 0) ? $col1 : $col2);
          });
        },
        fail: function() {
          $results.html('');
        }
      });
    }, 250);
  };

  var $input = $('#searchForm input');
  var $results = $('#searchResults');
  var readMoreHtml = $('.readMoreButton:first').html();
  $input.on('input', function() {
    var q = $(this).val();
    search(q);
  });

  function showSearchBar(showSearch) {
    var show = 'animatedShow';
    var hide = 'animatedHide';
    if (showSearch === true) {
      $results.html('');
      $input.val('');

      /*
      $blog.css('height', '800px');
      $blog.slideUp(function() {
        $search.slideDown();
      });
      */

      $('#blog').addClass(hide).removeClass(show);
      setTimeout(function() {
        $('#blog').hide();
        $('#search').addClass(show).removeClass(hide).show();
        setTimeout(function() {
          $input.focus();
        }, 500);
      }, 500);

    } else {
      /*
      $search.slideUp(function() {
        $blog.slideDown();
      });
      */

      $('#search').addClass(hide).removeClass(show).show();
      setTimeout(function() {
        $('#search').hide();
        $('#blog').addClass(show).removeClass(hide).show();
      }, 500);

    }
  }

  function createSearchElements() {
    $(['<span id="openSearch" class="fa-stack fa-lg right show-for-medium-up">',
       '  <i class="fa fa-square fa-stack-2x"></i>',
       '  <i class="fa fa-search fa-stack-1x fa-inverse"></i>',
       '</span>'].join('')).prependTo($('#title .columns'));


  }


});