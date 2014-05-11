'use strict';

$(function() {
  $('pre.code').each(function(i, el) {
    hljs.highlightBlock(el);
  });

  createFancyboxImages();

  function createFancyboxImages() {
    var $links = $(".imageCollage a");
    /*
    $links.each(function() {
      var $a = $(this);
      var title = $a.find('.title').text();
      if (title) {
        $a.attr('title', title);
      }
    });
    */
    $links.fancybox({
      type: 'image',
      beforeLoad: function() {
        this.title = $(this.element).find('.title').text();
      },
      helpers: {
        title: {
          type: 'inside'
        }/*,
        overlay: {
          css: {
            background: 'rgba(255,255,255, 0.75)'
          }
        }
        */
      }
    });
  }


});
