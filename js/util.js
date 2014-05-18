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
      var $titleText = $('#title h1');
      var offset = 50 - (fromTop / height) * 100;
      $bg.css("background-position", "center " + offset + "%");
      setY($titleText, +fromTop/2);
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
