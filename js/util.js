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

(function(exports, undefined) {

  /*
  (function() {
    $('#footer [title]').
        attr('data-tooltip', '').
        addClass('tip-top black');
  })();
  */

  function localization() {
    var settings = {
      '/': { otherLanguage: '/frontpage/' },
      'frontpage': { otherLanguage: '/' },
      'elamantarina': { otherLanguage: '/life-story/', nav: 'lifeStory' },
      'life-story': { otherLanguage: '/elamantarina/', nav: 'lifeStory' },
      'blog': { otherLanguage: window.location.pathname.replace('/blog/', '/blogi/'), nav: 'blog' },
      'blogi': { otherLanguage: window.location.pathname.replace('/blogi/', '/blog/'), nav: 'blog' }
    };
    var path = window.location.pathname.split('/')[1] || '/';
    if (path === 'blog') $('html').addClass('en');
    if (path === 'blogi') $('html').addClass('fi');
    var current = settings[path];
    if (!current) return;
    if (current.nav) {
      $('#topbar .'+current.nav).addClass('active');
    }
    $('#topbar .change-lang').attr('href', current.otherLanguage);
  }
  localization();

  function bindCoverTitleScrolling() {
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

    $(window).scroll(function() {
      var fromTop = $(window).scrollTop();
      var height = $(window).height();

      var $bg = $('#title');
      var offset = 50 - (fromTop / height) * 100;
      $bg.css("background-position", "center " + offset + "%");
      setY($('#title h1'), +fromTop/2);
      setY($('#title h3'), +fromTop/2.4);
    });
    $(window).scroll();
  }

  $(function() {
    if ($('#title.cover').length > 0) {
      bindCoverTitleScrolling();
    }
  });

  //Foundation.libs.tooltip.settings.additional_inheritable_classes = ['black'];

})(pyppe.util = {});

$(document).foundation();
