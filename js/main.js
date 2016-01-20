'use strict';

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
  };
}
if (typeof String.prototype.contains != 'function') {
  String.prototype.contains = function (str) {
    return this.indexOf(str) !== -1;
  };
}

// Mock console.log if not exist
if (!window.console) {
  window.console = {
    log: $.noop
  };
}

(function(exports, undefined) {

  var pageLanguage = 'en';

  // Localization
  (function() {
    var settings = {
      '/': { otherLanguage: '/frontpage/' },
      'frontpage': { otherLanguage: '/' },
      'elamantarina': { otherLanguage: '/life-story/', nav: 'lifeStory' },
      'life-story': { otherLanguage: '/elamantarina/', nav: 'lifeStory' },
      'blog': { otherLanguage: window.location.pathname.replace('/blog/', '/blogi/'), nav: 'blog' },
      'blogi': { otherLanguage: window.location.pathname.replace('/blogi/', '/blog/'), nav: 'blog' }
    };
    var path = window.location.pathname.split('/')[1] || '/';
    if (path === 'blog') $('html').addClass('en');
    if (path === 'blogi') $('html').addClass('fi');
    if (pyppe.finnishPageTitle && window.location.pathname === '/blogi/') {
      document.title = pyppe.finnishPageTitle;
    }
    var current = settings[path];
    if (!current) return;
    if (current.nav) {
      $('#topbar .' + current.nav).addClass('active');
    }
    $('#topbar .change-lang').attr('href', current.otherLanguage);
    var lang = $('html').hasClass('fi') ? 'fi' : 'en';
    pageLanguage = lang;
    moment.lang(lang);
    $('html').attr('lang', lang);
  })();

  // Date-times / localization
  (function() {
    function formatTime($elements) {
      $elements.each(function() {
        var $el = $(this);
        var time = $el.text();
        $el.text(moment(time, 'YYYY-MM-DD[T]HH:mm:ssZ').format('LL'));
      });
    }
    formatTime($('[time-title]'));
  })();

  // Link to posts
  (function() {
    function localizeBlogLink() {
      var $a = $(this);
      var link = $a.attr('href').replace(/^\/blog\//, '/blogi/');
      $a.attr('href', link);
    }

    if (window.location.pathname.startsWith('/blogi/')) {
      $('.post-listing a[href]').each(localizeBlogLink);
      $('#post a[href]').each(localizeBlogLink);
      $('.pagination a').each(function() {
        var $a = $(this);
        var link = $a.attr('href');
        if (link) {
          $a.attr('href', link.replace('/blog/', '/blogi/'));
        }
      });
    }

    $('.post-listing .caption').each(function() {
      var $c = $(this);
      var $last = $c.children().last();
      var nodeName = $last.prop('nodeName').toLowerCase();
      var readMoreLink = (function() {
        var text = pageLanguage === 'fi' ? 'Lue lisää' : 'Continue reading';
        return '<a href="#" class="read-more-link">'+text+' <i class="fa fa-angle-double-right"></i></a>';
      })();
      if (nodeName === 'p') {
        $('<span> '+readMoreLink+'</span>').appendTo($last);
      } else {
        $('<div>'+readMoreLink+'</div>').insertAfter($last);
      }
    });

  })();

  function bindCoverTitleScrolling() {
    if ($('#title.cover').length === 0) {
      return;
    }
    function setY($elem, value) {
      var translate = 'translateY('+value+'px)';
      $elem.css({
        "-webkit-transform": translate,
        "-a-transform": translate,
        "-ms-transform": translate,
        "-moz-transform": translate,
        "transform": translate
      });
    }

    var defaultOffset = 30;
    var start = (function() {
      var m = $('#title').attr('class').match(/cover-offset-(\d+)/);
      if (m && m.length == 2) {
        return parseInt(m[1]);
      } else {
        return defaultOffset;
      }
    })();
    $(window).scroll(function() {
      var fromTop = $(window).scrollTop();
      var height = $(window).height();

      var $bg = $('#title');
      var diff = (fromTop / height) * 100;
      var diffFactor = (start <= defaultOffset) ? 1.8 : 2.2;
      var offset = (start <= defaultOffset) ? (start + diff*diffFactor) : (start - diff*diffFactor);
      offset = Math.max(0, Math.min(100, offset));
      $bg.css("background-position", "center " + offset + "%");
      //setY($('#title h1'), +fromTop/2*diffFactor);
      //setY($('#title h3'), +fromTop/2.05*diffFactor);
    });
    $(window).scroll();
  }

  function createFancyboxImages() {
    $(".image-collage a").fancybox({
      type: 'image',
      beforeLoad: function() {
        var title = $(this.element).find('.title').text();
        if (title) {
          this.title = title;
        }
      },
      helpers: {
        overlay: {
          locked: false
        },
        title: {
          type: 'inside'
        }
      }
    });
  }

  $(function() {
    bindCoverTitleScrolling();
    createFancyboxImages();

    // Life-story page
    $("#showMoreNostalgia").prop('disabled', false).click(function() {
      $(this).off("click").prop('disabled', true);
      $("#moreNostalgia").slideDown();
      $('html, body').animate({scrollTop: $('#moreNostalgia').offset().top}, 400);
    });
  });

})(pyppe.main = {});

//$(document).foundation();
