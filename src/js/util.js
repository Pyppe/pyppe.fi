(function () {

  const nonBreakingSpace = ' ';

  // https://github.com/epeli/underscore.string/blob/master/numberFormat.js
  function numberFormat(number, dec, dsep, tsep) {
    if (isNaN(number) || number == null) return '';

    number = number.toFixed(~~dec);
    tsep = typeof tsep == 'string' ? tsep : ',';

    var parts = number.split('.'),
      fnums = parts[0],
      decimals = parts[1] ? (dsep || '.') + parts[1] : '';

    return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
  }

  function sortTable($table, idx, sortAsc) {
    function rowValue(tr) {
      var $tr = $(tr);
      var data = $tr.find('td:eq('+idx+')').data('value');
      return (_.isString(data) && data.match(/^(0\.)?\d+$/g)) ? parseInt(data) : data;
    }

    var $rows = $table.find('tbody > tr');
    $rows.sort(function(rowA, rowB) {
      var a = rowValue(rowA);
      var b = rowValue(rowB);
      if (sortAsc) {
        return (a > b) ? 1 : (a < b) ? -1 : 0;
      } else {
        return (a < b) ? 1 : (a > b) ? -1 : 0;
      }
    });

    $rows.each(function() {
      $(this).appendTo($table);
    });
  }

  function bindTableSorting({$table, initialSortIndex = 0, beforeSort = _.noop, afterSort = _.noop}) {
    $table.addClass('sortable');
    $table.find('th').each(function(i) {
      $(this).data('eq', i);
    });
    $table.find('th').click(function() {
      beforeSort();
      $table.find('th i.fa-caret-down').remove();
      $table.find('th.sorted').removeClass('sorted');
      var $el = $(this);
      $el.addClass('sorted');
      $('<i class="fa fa-caret-down"></i>').appendTo($el);

      var idx = $el.data('eq');
      $table.find('tbody tr').each(function() {
        var $tr = $(this);
        $tr.find('.sorted').removeClass('sorted');
        $tr.find('td:eq('+idx+')').addClass('sorted');
      });

      sortTable($table, idx, $el.data('asc'));

      afterSort();
    });
    $table.find(`th:eq(${initialSortIndex})`).click();
  }

  function isElementInViewport(el, {bottomThreshold = 0}) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      (rect.bottom - bottomThreshold) <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function createTableContent($table, columns, data) {
    $(`
      <thead>
        <tr>
          ${_.map(columns, ({label, tooltipHtml, ascending = false}) => {
            const tooltipAttributes = _.isString(tooltipHtml) ?
              `class="has-tooltip" title="${_.escape(tooltipHtml)}" tip-is-html`
              : '';
            return `<th data-asc="${ascending}" ${tooltipAttributes}>${label}</th>`;
          })}
        </tr>
      </thead>
    `).appendTo($table);

    const $tbody = $('<tbody></tbody>').appendTo($table);
    _.forEach(data, (item, idx) => {
      const $tr = $(`<tr></tr>`);
      _.forEach(columns, ({value, render, className, alterColumn}) => {
        const $td = $(
          `<td data-value="${value(item, idx)}"${className ? ` class="${className}"` : ''}>${render(item, idx)}</td>`
        );
        $td.appendTo($tr);
        if (_.isFunction(alterColumn)) {
          alterColumn($td, item);
        }
      });
      $tr.appendTo($tbody);
    });

    return $table;
  }

  function parseQueryParams(search) {
    const parts = search.replace(/^\?/, '').split('&');
    return _.reduce(parts, (acc, pair) => {
      const [key, value] = pair.split('=');
      if (key !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  function onWindowWidthResized($el, callback) {
    let previousWidth = $(window).width();
    $(window).resize(_.debounce(() => {
      if ($el.is(':visible')) {
        const width = $(window).width();
        if (previousWidth !== width) {
          previousWidth = width;
          callback(width);
        }
      }
    }, 100, {maxWait: 100}));
  }

  pyppe.util = {
    isElementInViewport,
    sortTable,
    bindTableSorting,
    createTableContent,
    numberFormat,
    parseQueryParams,
    onWindowWidthResized,
    integerFormat: n => numberFormat(n, 0, ',', nonBreakingSpace),
    decimalFormat: n => numberFormat(n, 1, ',', nonBreakingSpace),
    pageLanguage: () => $('html').hasClass('fi') ? 'fi' : 'en',
    parseMoment: text => moment(text, 'YYYY-MM-DD[T]HH:mm:ssZ'),
    replaceUrlSearch: (params, settings) => {
      const {keepPrevious = true, compact = true} = settings || {};
      if (window.history && _.isFunction(window.history.replaceState)) {
        const existingParams = keepPrevious ? parseQueryParams(location.search) : {};
        const keys = _.uniq(_.keys(existingParams).concat(_.keys(params)));
        const keyValuePairs = _.reduce(keys, (acc, k) => {
          const value = _.has(params, k) ? params[k] : existingParams[k];
          if (compact && (value === null || value === undefined)) {
            return acc;
          }
          acc.push([k, value]);
          return acc;
        }, []);

        const qsPrefix = _.size(keyValuePairs) > 0 ? '?' : '';
        const qs = qsPrefix + _.map(keyValuePairs, ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        ).join('&');

        history.replaceState({}, document.title, location.pathname + qs);
      }
    },
    bindTooltips: $parent => {
      $parent.find('.has-tooltip[title]').each(function() {
        const $el = $(this);
        const tooltipClass = $el.attr('tooltip-class') || '';
        $el.tooltip({
          html: _.isString($el.attr('tip-is-html')),
          template: `<div class="tooltip ${tooltipClass}" role="tooltip">` + '<div class="tooltip-arrow"></div>' + '<div class="tooltip-inner"></div></div>'
        });
      })
    }
  };

})();