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

  function bindTableSorting($table) {
    $table.addClass('sortable');
    $table.find('th').each(function(i) {
      $(this).data('eq', i);
    });
    $table.find('th').click(function() {
      $table.find('th i').remove();
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
    });
    $table.find('th:eq(0)').click();
  }

  pyppe.util = {
    sortTable,
    bindTableSorting,
    numberFormat,
    integerFormat: n => numberFormat(n, 0, ',', nonBreakingSpace),
    decimalFormat: n => numberFormat(n, 1, ',', nonBreakingSpace),
    pageLanguage: () => $('html').hasClass('fi') ? 'fi' : 'en',
    parseMoment: (text) => moment(text, 'YYYY-MM-DD[T]HH:mm:ssZ')
  };

})();