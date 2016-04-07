$(function() {
  const $table = $('#suomen-top-100-twiittaajat-2016-04');
  pyppe.util.bindTableSorting($table);

  const i = pyppe.util.integerFormat;
  const d = pyppe.util.decimalFormat;

  const li = text => `<li><i class="fa fa-check"></i> ${text}<li>`;
  const dateRange = "<small>1.10.2015 &ndash; 1.4.2016</small>";
  const tr = (title, value) => `<tr><th>${title}</th><td>${value}</td></tr>`;

  $table.find('.twitter-user-col .label').each((i, el) => {
    const $el = $(el);
    const text = $el.text();
    if (_.size(text) > 30) {
      const truncated = _.take(text, 27).join('') + '…';
      $el.text(truncated).attr('title', text);
    }
  });

  const $amountSelect = $('#suomen-top-100-twiittaajat-2016-04-take');
  $amountSelect.change(showBubbleChart);

  const $finnishSelect = $('#suomen-top-100-twiittaajat-2016-04-finnish');
  $finnishSelect.change(showBubbleChart);

  function bindPopover(params) {
    const {key, title, ul, table, placement} = params;

    $(`[data-${key}]`).
      mouseenter(function() {
        const $el = $(this);
        const content =
          ul ?
          '<ul class="list-unstyled">' + ul($el.data(key)).join('\n') + '</ul>' :
          `<table><tbody>${table($el.data(key)).join('\n')}</tbody></table>`;
        $el.popover({
          trigger: 'hover',
          placement: placement || 'top',
          html: true,
          title: title,
          content: content
        }).popover('show');
      }).mouseleave(function() {
        $(this).popover('hide');
      });
  }

  bindPopover({
    key: 'retweets',
    title: 'Retwiittaajat',
    table: (rt) => [
      tr('Uniikkeja retwiittaajia keskimäärin', `${i(rt.monthlyUsers)} / kk`),
      tr('Uniikkeja retwiittaajia yhteensä',    `${i(rt.totalUsers)}`),
      tr('Retwiittejä keskimäärin',             `${i(rt.monthlyCount)} / kk`),
      tr('Retwiittejä yhteensä',                `${i(rt.totalCount)}`)
    ]
  });

  bindPopover({
    key: 'own',
    title: 'Omat twiitit',
    table: (own) => [
      tr('Omat twiitit keskimäärin', `${d(own.dailyCount)} / päivä`),
      tr('Omat twiitit yhteensä',    `${i(own.totalCount)}`)
    ]
  });

  bindPopover({
    key: 'reach',
    title: 'Tavoittavuus',
    table: (reach) => [
      tr('Tavoittavuus keskimäärin', `${i(reach.monthlyReach)} / kk`),
      tr('Tavoittavuus yhteensä',    `${i(reach.totalReach)}`)
    ]
  });

  bindPopover({
    key: 'mentions',
    title: 'Keskustelijat',
    placement: 'left',
    table: (mentions) => [
      tr('Uniikkeja keskustelijoita keskimäärin', `${i(mentions.monthlyUsers)} / kk`),
      tr('Uniikkeja keskustelijoita yhteensä',    `${i(mentions.totalUsers)}`),
      tr('Mainintoja keskimäärin',                `${i(mentions.monthlyCount)} / kk`),
      tr('Mainintoja yhteensä',                   `${i(mentions.totalCount)}`),
    ]
  })

  const userData = _.map($table.find('tbody tr').toArray(), el => {
    const $tr = $(el);
    const dataValue = (idx, dataKey = 'value') => $tr.find('td:eq('+idx+')').data(dataKey);
    const $u = $tr.find('.twitter-user-col');

    return {
      user: {
        screenName: $u.data('value'),
        name: $u.find('small').text(),
        avatar: $u.find('img').attr('src')
      },
      engagement: dataValue(3),
      reach: $tr.find('[data-reach]').data('reach'),
      retweets: $tr.find('[data-retweets]').data('retweets'),
      mentions: $tr.find('[data-mentions]').data('mentions'),
      finnishRate: dataValue(9)
    };
  });

  showBubbleChart();

  function showBubbleChart() {

    const relevantUserData = _.take(userData, parseInt($amountSelect.val()));
    const finnishFactor = (() => {
      if ($finnishSelect.val() === 'finnish') {
        return d => d.finnishRate;
      } else {
        return _.constant(1.0);
      }
    })();

    const scaleType = 'logarithmic' // 'linear' | 'logarithmic'
    const extractZAxisValue = d => finnishFactor(d) * (d.retweets.totalCount + d.mentions.totalCount);
    const zAxisScale = (function() {
      if (scaleType === 'linear') {
        return _.identity;
      } else {
        const values = _.map(relevantUserData, extractZAxisValue);
        window.values = values;
        // sqrt / log / pow
        return d3.scale.pow().domain([_.min(values), _.max(values)]).range([5, 30]);
      }
    })();


    const height = Math.max($(window).height()-100, 300);
    $('#suomen-top-100-twiittaajat-2016-04-chart').css({height: height+'px'}).highcharts({
      chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy',
        panning: true,
        panKey: 'shift'
      },

      legend: { enabled: false },
      title: { text: '' },
      credits: false,

      xAxis: {
        type: scaleType,
        gridLineWidth: 1,
        title: { text: 'Tavoittavuus / kk' }
      },

      yAxis: {
        type: scaleType,
        title: { text: 'Uniikit retwiittaajat / kk' },
        maxPadding: 0.2
      },

      tooltip: {
        useHTML: true,
        headerFormat: '',
        footerFormat: '',
        formatter: function() {
          var x = this.point.options;
          return [
            `<h5><img class="avatar" src="${x.user.avatar}" alt="" /><small>@</small>${x.user.screenName} <small class="text-muted">${x.user.name}</small></h5>`,
            '<table><tbody>',
            tr('Tavoittavuus keskimäärin', `${i(x.reach.monthlyReach)} / kk`),
            tr('Uniikit retwiittaajat keskimäärin', `${i(x.retweets.monthlyUsers)} / kk`),
            '</tbody></table>'
          ].join('');
        }
        //followPointer: true
      },

      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            format: '{point.user.screenName}'
          }
        },
        bubble: {
          minSize: 10,
          maxSize: 70
        }
      },

      series: [{
        data: _.map(relevantUserData, (d) => {
          return _.assign({}, d, {
            x: finnishFactor(d) * d.reach.monthlyReach,
            y: finnishFactor(d) * d.retweets.monthlyUsers,
            z: zAxisScale(extractZAxisValue(d))
          });
        })
      }]

    });
  }

  //console.log(tweetData);

});
