$(function() {
  const $table = $('#suomi-twitterin-top-200-vaikuttajat-2016-05');
  pyppe.util.bindTableSorting($table);

  const i = pyppe.util.integerFormat;
  const d = pyppe.util.decimalFormat;

  const li = text => `<li><i class="fa fa-check"></i> ${text}<li>`;
  const dateRange = "<small>1.10.2015 &ndash; 1.4.2016</small>";
  const tr = (title, value) => `<tr><th>${title}</th><td>${value}</td></tr>`;

  $table.find('.twitter-user-col .hashtag').each((i, el) => {
    const $el = $(el);
    const text = $el.text();
    if (_.size(text) > 30) {
      const truncated = _.take(text, 27).join('') + '…';
      $el.text(truncated).attr('title', text);
    }
  });

  const closeDynamicTweetPopover = () => $('#dynamic-tweet-popover').closest('.popover').popover('dispose');

  $('body').on('click', '[data-close-dynamic-tweet-popover]', closeDynamicTweetPopover);

  $('.show-top-tweet').click(function() {
    const $el = $(this);
    const tweetId = $el.data('tweetId').toString();
    closeDynamicTweetPopover();
    const buttonHtml = `<div><button class="btn btn-primary btn-sm" data-close-dynamic-tweet-popover>Sulje</button></div>`
    $el.popover('dispose').popover({
      container : 'body',
      trigger   : 'manual',
      html      : true,
      content   : `<div id="dynamic-tweet-popover"><div data-embed-here></div><i class="fa fa-spin fa-spinner fa-lg"></i>${buttonHtml}</div>`
    }).popover('show');
    const $popover = $('#dynamic-tweet-popover');
    twttr.widgets.createTweet(
      tweetId,
      $popover.find('[data-embed-here]')[0],
      { id: tweetId, lang: 'fi' }
    ).then(() => {
      $popover.find('.fa-spinner').remove();
      const pos = $(window).scrollTop();
      $(window).scrollTop(pos+1).scrollTop(pos);
    });
  });

  const $amountSelect = $('#suomi-twitterin-top-200-vaikuttajat-2016-05-take');
  $amountSelect.change(showBubbleChart);

  const $finnishSelect = $('#suomi-twitterin-top-200-vaikuttajat-2016-05-finnish');
  $finnishSelect.change(showBubbleChart);

  function bindPopover(params) {
    const {key, title, ul, table, placement} = params;

    $(`[data-${key}]`).
      mouseenter(function() {
        const $el = $(this);
        $el.popover({
          trigger: 'hover',
          placement: placement || 'top',
          html: true,
          title: title,
          content: `<table><tbody>${table($el.data(key)).join('\n')}</tbody></table>`
        }).popover('show');
      }).mouseleave(function() {
        $(this).popover('hide');
      });
  }

  bindPopover({
    key: 'activity',
    title: 'Aktiivisuus',
    placement: 'right',
    table: (nums) => _.map(nums, (activity, idx) => (
      tr(moment('2015-10-01').add(idx, 'month').format('YYYY MMMM'), `${i(activity)} retwiittiä ja mainintaa yhteensä`)
    ))
  });

  bindPopover({
    key: 'retweets',
    title: 'Retwiittaajat',
    table: (rt) => [
      tr('Uniikkeja retwiittaajia (keskiarvo)', `${i(rt.monthlyUserAvg)} / kk`),
      tr('Uniikkeja retwiittaajia (mediaani)',  `${i(rt.monthlyUserMed)} / kk`),
      tr('Uniikkeja retwiittaajia yhteensä',    `${i(rt.totalUsers)}`),
      tr('Retwiittejä (keskiarvo)',             `${i(rt.monthlyCountAvg)} / kk`),
      tr('Retwiittejä (mediaani)',              `${i(rt.monthlyCountMed)} / kk`),
      tr('Retwiittejä yhteensä',                `${i(rt.totalCount)}`)
    ]
  });

  bindPopover({
    key: 'own',
    title: 'Omat twiitit',
    table: (own) => [
      tr('Omat twiitit (keskiarvo)', `${d(own.dailyCount)} / päivä`),
      tr('Omat twiitit yhteensä',    `${i(own.totalCount)}`)
    ]
  });

  bindPopover({
    key: 'reach',
    title: 'Tavoittavuus',
    table: (reach) => [
      tr('Tavoittavuus (keskiarvo)', `${i(reach.monthlyReachAvg)} / kk`),
      tr('Tavoittavuus (mediaani)',  `${i(reach.monthlyReachMed)} / kk`),
      tr('Tavoittavuus yhteensä',    `${i(reach.totalReach)}`)
    ]
  });

  bindPopover({
    key: 'mentions',
    title: 'Keskustelijat',
    placement: 'left',
    table: (mentions) => [
      tr('Uniikkeja keskustelijoita (keskiarvo)', `${i(mentions.monthlyUserAvg)} / kk`),
      tr('Uniikkeja keskustelijoita (mediaani)',  `${i(mentions.monthlyUserMed)} / kk`),
      tr('Uniikkeja keskustelijoita yhteensä',    `${i(mentions.totalUsers)}`),
      tr('Mainintoja (keskiarvo)',                `${i(mentions.monthlyCountAvg)} / kk`),
      tr('Mainintoja (mediaani)',                 `${i(mentions.monthlyCountMed)} / kk`),
      tr('Mainintoja yhteensä',                   `${i(mentions.totalCount)}`)
    ]
  });

  /*
  const sparkLineActivityDomain = (function() {
    const xs = _.chain($table.find('[data-activity]').toArray()).
      map(el => $(el).data('activity')).
      flatten().
      map(v => -v).
      value();
    return [_.min(xs), _.max(xs)];
  })();
  */

  function sparkLine($parent, realActivity) {
    const height = 40;
    const width = 80;
    const graph =
      d3.select($parent[0]).
        append("svg:svg").
        attr("width", `${width}px`).
        attr("height", `${height}px`);

    const activity = _.map(realActivity, a => -a);
    const activityDomain = [_.min(activity), _.max(activity)];
    const x = d3.scale.linear().domain([0, _.size(activity)-1]).range([0, width]);
    //const y = d3.scale.pow().exponent(0.5).domain(sparkLineActivityDomain).range([0, height]);
    const y = d3.scale.pow().exponent(4).domain(activityDomain).range([0, height]);

    const line = d3.svg.line().
      //interpolate("step-after").
      x((d,i) => {
        return x(i);
      }).
      y(d => {
        //console.log(`Plotting y ${d} -> ${y(d)}`);
        return y(d);
      });
    // display the line by appending an svg:path element with the data line we created above
    graph.append("svg:path").
      attr("class", "activity-line").
      //attr("transform", "translate(0, 40)").
      attr("d", line(activity));
  }

  const userData = _.map($table.find('tbody tr').toArray(), (el, i) => {
    const $tr = $(el);
    const dataValue = (idx, dataKey = 'value') => $tr.find('td:eq('+idx+')').data(dataKey);
    const $u = $tr.find('.twitter-user-col');

    const $activity = $tr.find('[data-activity]').addClass('spark-area');
    //$('<br/>').insertBefore($activity);
    const activity = $activity.data('activity');

    sparkLine($activity, activity);

    return {
      rank: dataValue(0)+1,
      user: {
        screenName: $u.data('value'),
        name: $u.find('small').text(),
        avatar: $u.find('img').attr('src')
      },
      activity,
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
        // sqrt / log / pow
        return d3.scale.pow().domain([_.min(values), _.max(values)]).range([5, 30]);
      }
    })();


    const height = Math.max(parseInt($(window).height()*0.7), 300);
    //$('.container').removeClass('container');
    $('#suomi-twitterin-top-200-vaikuttajat-2016-05-chart').css({height: height+'px'}).highcharts({
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
          const x = this.point.options;
          const finnishScale = $finnishSelect.val() === 'finnish'
          const factor = finnishScale ? x.finnishRate : 1.0;
          return [
            `<h5>
              <img class="avatar" src="${x.user.avatar}" alt="" />
              <small><span class="label label-primary">${x.rank}.</span></small>
              <small>@</small>${x.user.screenName} <small class="text-muted">${x.user.name}</small>
            </h5>`,
            '<table><tbody>',
            tr('Tavoittavuus keskimäärin',          `${i(factor * x.reach.monthlyReachAvg)} / kk`),
            tr('Uniikit retwiittaajat keskimäärin', `${i(factor * x.retweets.monthlyUserAvg)} / kk`),
            tr('Retwiitit ja maininnat yhteensä',   `${i(factor * (x.retweets.totalCount + x.mentions.totalCount))}`),
            '</tbody></table>',
            finnishScale ? `<br/><em>&ndash; Luvut skaalattu ${d(factor*100)}% suom. yleisön suhteen</em>` : '',
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
            x: finnishFactor(d) * d.reach.monthlyReachAvg,
            y: finnishFactor(d) * d.retweets.monthlyUserAvg,
            z: zAxisScale(extractZAxisValue(d))
          });
        })
      }]

    });
  }

});
