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

(function (exports, undefined) {

  var pageLanguage = 'en';

  // Localization
  function localization() {
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
  }

  // Date-times / localization
  function formatTimes() {
    function formatTime($elements) {
      $elements.each(function () {
        var $el = $(this);
        var time = $el.text();
        $el.text(pyppe.util.parseMoment(time).format('LL'));
        $el.addClass('formatted');
      });
    }
    formatTime($('.time-title'));
  }

  // Link to posts
  function handlePosts() {
    function localizeBlogLink() {
      var $a = $(this);
      var link = $a.attr('href').replace(/^\/blog\//, '/blogi/');
      $a.attr('href', link);
    }

    if (window.location.pathname.startsWith('/blogi/')) {
      $('.post-listing a[href]').each(localizeBlogLink);
      $('#post a[href]').each(localizeBlogLink);
      $('.pagination a').each(function () {
        var $a = $(this);
        var link = $a.attr('href');
        if (link) {
          $a.attr('href', link.replace('/blog/', '/blogi/'));
        }
      });
    }

    $('.post-listing .caption').each(function () {
      const $c = $(this);
      const $last = $c.children().last();
      const nodeName = $last.prop('nodeName').toLowerCase();
      const readMoreLink = (function () {
        const text = pageLanguage === 'fi' ? 'Lue lisää' : 'Continue reading';
        const link = $c.closest('.post-listing').find('h1 a[href]').attr('href');
        return `<a href="${link}" class="read-more-link">${text} <i class="fa fa-angle-double-right"></i></a>`;
      })();
      if (nodeName === 'p') {
        $('<span> ' + readMoreLink + '</span>').appendTo($last);
      } else {
        $('<div>' + readMoreLink + '</div>').insertAfter($last);
      }
    });
  }

  function bindCoverTitleScrolling() {
    if ($('#title.cover').length === 0) {
      return;
    }
    function setY($elem, value) {
      var translate = 'translateY(' + value + 'px)';
      $elem.css({
        "-webkit-transform": translate,
        "-a-transform": translate,
        "-ms-transform": translate,
        "-moz-transform": translate,
        "transform": translate
      });
    }

    var defaultOffset = 30;
    var start = function () {
      var m = $('#title').attr('class').match(/cover-offset-(\d+)/);
      if (m && m.length == 2) {
        return parseInt(m[1]);
      } else {
        return defaultOffset;
      }
    }();
    $(window).scroll(function () {
      var fromTop = $(window).scrollTop();
      var height = $(window).height();

      var $bg = $('#title');
      var diff = fromTop / height * 100;
      var diffFactor = start <= defaultOffset ? 1.8 : 2.2;
      var offset = start <= defaultOffset ? start + diff * diffFactor : start - diff * diffFactor;
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
      beforeLoad: function () {
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

  function handleRelatedPosts() {
    const $post = $('#post');
    if ($post.length === 0) return;
    const currentCanonicalUrl = location.pathname.replace(/\/blogi\//, "/blog/");
    console.log(currentCanonicalUrl);
    $.get(`/posts.json?h=${pyppe.resourceHash}`).done(posts => {
      const now = moment();
      const currentPost = _.find(posts, {url: currentCanonicalUrl});
      const currentTags = _.get(currentPost, 'tags', []);
      const relatedPosts = _.chain(posts).
        reject({url: currentCanonicalUrl}).
        sortBy(post => {
          const age = Math.abs(now.diff(pyppe.util.parseMoment(post.time), 'days'));
          const matchingTagCount = _.size(_.intersection(post.tags, currentTags));
          return age - matchingTagCount*99999;
        }).
        value();

      const $relevant = $('#relevant-posts');

      const populateColumn = ($parent, posts) => {
        const $list = $('<div class="relevant-post-group"></div>').appendTo($parent);
        _.forEach(posts, post => {
          const image = post.imageAside || post.imageMeta || post.imageCover;
          const $item = $(
            `<a href="${post.url}" class="relevant-post">
              <h5 class="post-heading">${post.title}</h5>
              <h5><small class="text-muted">${pyppe.util.parseMoment(post.time).format('LL')}</small></h5>
              <div style="clear:both"></div>
            </a>`
          ).appendTo($list);
          if (image) {
            $(`<img src=${image} />`).prependTo($item);
          } else {
            $('<div class="image"></div>').prependTo($item);
          }
          /*
          const $tagContainer = $('<div class="tags"></div>').appendTo($item);
          _.forEach(post.tags, tag => {
            $(`<span class="label label-default"><i class="fa fa-tag"></i> ${tag}</span>`).appendTo($tagContainer);
          });
          */
        });
      };

      populateColumn($relevant.find('[data-first-col]'), _.take(relatedPosts, 3));
      populateColumn($relevant.find('[data-second-col]'), _.take(_.drop(relatedPosts, 3), 3));
      $relevant.show();

    });
  }

  $(function () {
    localization();
    formatTimes();
    handlePosts();
    bindCoverTitleScrolling();
    createFancyboxImages();
    handleRelatedPosts();
    $('.has-tooltip[title]').each(function() {
      const $el = $(this);
      $el.tooltip({
        html: _.isString($el.attr('tip-is-html'))
      });
    });

    // Life-story page
    $("#showMoreNostalgia").prop('disabled', false).click(function () {
      $(this).off("click").prop('disabled', true);
      $("#moreNostalgia").slideDown();
      $('html, body').animate({ scrollTop: $('#moreNostalgia').offset().top }, 400);
    });
  });
})(pyppe.main = {});
