$(function() {

  moment.locale('fi');

  const {decimalFormat, integerFormat} = pyppe.util;

  const nowrap = html => `<span class="text-nowrap">${html}</span>`;

  const asyncJson = suffix => {
    const tabId = $('#suomi-twitter-2017-tabs a.active').attr('href').replace('#','');
    const $tabContent = $(`#suomi-twitter-2017-tab-contents [data-tab-id="${tabId}"]`).hide();
    const $spinner = $('<i class="fa fa-spin fa-spinner fa-lg" style="margin-bottom: 50px;"></i>').insertBefore($tabContent);
    return $.get(`/dist/resources/twitter-2017/${suffix}.json`, {h: pyppe.resourceHash}).then(response => {
      $spinner.remove();
      $tabContent.show();
      return response;
    });
  };

  const Actions = {
    'yhteenveto'       : () => asyncJson('totals').then(createTotalsTabContent),
    'vaikuttajat'      : () => asyncJson('users').then(createUsersTabContent),
    'vaikuttajaverkko' : () => pyppe.twitterUserGraph.createTwitterUserGraph(asyncJson('relationships')),
    'hashtagit'        : () => asyncJson('hashtags').then(createHashtagsTabContent),
    'retwiitatut'      : _.noop,
    'viraali-ilmiot'   : () => asyncJson('virals').then(createViralTabContent)
  };
  const ActionsDone = {};

  function drawHashtagCloud(topHashtags, $container) {
    const words = _.map(topHashtags, ({key, tweetCount, userCardinality}) => ({
      text: key,
      score: tweetCount * userCardinality
    }));

    const scores = _.map(words, 'score');

    const colorOptions = _.reverse([
      '#0e2e60', '#31558e', '#5990b7', '#8eb3cc'
    ]);
    const color = d3.scaleSqrt().
      domain([_.min(scores), _.max(scores)]).
      range([0, _.size(colorOptions) - 1]);

    const fontSize = d3.scaleSqrt().
      domain([_.min(scores), _.max(scores)]).
      range([10, 50]);

    const [width, height] = (() => {
      //const windowHeight = $(window).height();
      return [$container.width(), 500];
    })();

    d3.layout.cloud().
      size([width, height]).
      words(words).
      padding(5).
      //spiral('archimedean').
      //rotate(function() { return (~~(Math.random() * 6) - 3) * 30; }).
      fontSize(({score}) => fontSize(score)).
      on("end", draw).
      start();

    function draw(words) {
      d3.select($container[0]).
        append("svg").
        attr("width", width).
        attr("height", height).
        attr("class", "wordcloud").
        append("g").
        // without the transform, words would get cutoff to the left and top, they would
        // appear outside of the SVG area
        attr("transform", `translate(${width / 2}, ${height / 2})`).
        selectAll("text").
        data(words).
        enter().append("text").
        style("font-size", ({score}) => `${fontSize(score)}px`).
        style("fill", ({score}) => {
          const index = Math.round(color(score));
          console.log('color for score %s is %s', score, index);
          return colorOptions[index];
        }).
        attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        }).
        text(function(d) { return d.text; });
    }
  }

  function openInitialTab() {
    const {view = 'unknown'} = pyppe.util.parseQueryParams(location.search);
    const availableTabs = $('#suomi-twitter-2017-tabs a').map((i, el) => $(el).attr('href').replace('#', ''));

    const initialTab = _.includes(availableTabs, view) ? view : 'yhteenveto';
    $(`#suomi-twitter-2017-tabs a[href="#${initialTab}"]`).click();
  }

  $('#suomi-twitter-2017-tabs a').click(function(e) {
    e.preventDefault();
    if ($(this).is('.disabled')) {
      return;
    }
    $('#suomi-twitter-2017-tabs a').removeClass('active');
    const id = $(this).addClass('active').attr('href').replace('#', '');
    pyppe.util.replaceUrlSearch({view: id === 'yhteenveto' ? null : id});

    $(`#suomi-twitter-2017-tab-contents [data-tab-id]`).hide();
    $(`#suomi-twitter-2017-tab-contents [data-tab-id="${id}"]`).show();

    if (!ActionsDone[id]) {
      ActionsDone[id] = true;
      Actions[id]();
    } else {
      $(window).resize();
    }
  });

  openInitialTab();

  function createUsersTabContent(rows) {
    _.forEach(rows, (r, idx) => {
      r.rank = idx + 1;
    });
    const $container = $('#suomi-twitter-2017-users');

    $(`
      <h3>
        Visualisointi
        <span class="has-tooltip bare" style="font-size: 70%; color: green;"
              title="Voit zoomata valitsemalla alueen hiiren vasen nappi pohjassa. Shift-näppäin pohjassa voit scrollata aluetta.">
          <i class="fa fa-question-circle"></i>
        </span>
      </h3>
      <form>
        <div class="row">
          <div class="col-sm-6">
            <b>Näytä:</b>
            <select class="custom-select" style="width: 100%;">
              <option value="10">TOP 10</option>
              <option value="20">TOP 20</option>
              <option value="30">TOP 30</option>
              <option value="50" selected>TOP 50</option>
              <option value="100">TOP 100</option>
              <option value="999">TOP 200 (kaikki)</option>
            </select>
          </div>
          <div class="col-sm-6">
            <b>Laskenta:</b>
            <select class="custom-select" style="width: 100%;">
              <option value="finnish" selected>Skaalaa luvut arvioidun suomalaisen yleisön määrällä</option>
              <option value="all">Ota kaikki twiitit huomioon</option>
            </select>
          </div>
        </div>
      </form>
    `).appendTo($container);
    pyppe.util.bindTooltips($container);

    const $userCanvas = $('<div id="suomi-twitter-vuonna-2017-users-chart"></div>').appendTo($container);

    const $amountSelect = $container.find('select:first');
    $amountSelect.change(showUserBubbleChart);

    const $finnishSelect = $container.find('select:last');
    $finnishSelect.change(showUserBubbleChart);

    $('<h2>TOP-200 <small class="text-muted">Suomi-Twitterin vaikuttajat</small></h2>').appendTo($container);

    const $checkboxContainer = $(`
      <div class="checkbox">
        <label><input type="checkbox"/> Näytä käyttäjien ykköstwiitit</label>
      </div>
    `).appendTo($container);

    const $table = $('<table class="table table-striped compact-table"></table>').appendTo($container);

    const withTooltip = html => `<span class="text-nowrap has-tooltip">${html}</span>`;
    const tr = (title, value) => `<tr><th>${title}</th><td>${value}</td></tr>`;

    //console.log(_.map(rows, r => r.user.screenName).join('\n'));

    function bindPopover(params) {
      const {el, title, table, placement} = params;

      el.
        mouseenter(function() {
          const $el = $(this);
          $el.popover({
            trigger: 'hover',
            placement: placement || 'top',
            html: true,
            title: title,
            content: `<table><tbody>${table.join('\n')}</tbody></table>`
          }).popover('show');
        }).mouseleave(function() {
          $(this).popover('hide');
        });
    }

    function showUserBubbleChart() {
      const relevantUserData = _.take(rows, parseInt($amountSelect.val()));
      const finnishFactor = (() => {
        if ($finnishSelect.val() === 'finnish') {
          return d => d.finnishRatio;
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
          return d3.scalePow().domain([_.min(values), _.max(values)]).range([5, 30]);
        }
      })();


      const height = Math.max(parseInt($(window).height()*0.7), 300);
      //$('.container').removeClass('container');
      $userCanvas.css({height: height+'px'}).highcharts({
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
          formatter() {
            const x = this.point.options;
            const finnishScale = $finnishSelect.val() === 'finnish'
            const factor = finnishScale ? x.finnishRatio : 1.0;
            // /img/twitter/profile_images/${user.screenName}.jpg
            return [
              `<h5>
                <img class="avatar" src="/img/twitter/profile_images/${x.user.screenName}.jpg" alt="" />
                <small><span class="badge badge-primary">${x.rank}.</span></small>
                <small>@</small>${x.user.screenName} <small class="text-muted">${x.user.name}</small>
              </h5>`,
              '<table class="table table-striped"><tbody>',
              tr('Tavoittavuus keskimäärin',          `${integerFormat(factor * x.reach.monthlyReachAvg)} / kk`),
              tr('Uniikit retwiittaajat keskimäärin', `${integerFormat(factor * x.retweets.monthlyUserAvg)} / kk`),
              tr('Retwiitit ja maininnat yhteensä',   `${integerFormat(factor * (x.retweets.totalCount + x.mentions.totalCount))}`),
              '</tbody></table>',
              finnishScale ? `<br/><em>&ndash; Luvut skaalattu ${decimalFormat(factor*100)}% suom. yleisön suhteen</em>` : '',
            ].join('');
          }
          //followPointer: true
        },

        plotOptions: {
          series: {
            cursor: 'pointer',
            point: {
              events: {
                click() {
                  const $row = $table.find(`[data-user-id="${this.user.id}"]`).closest('tr');
                  if ($row.length === 1) {
                    $('html, body').animate({
                      scrollTop: $row.offset().top
                    }, 400);
                  }
                }
              }
            },
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
          data: _.map(relevantUserData, (d, i) => {
            return _.assign({}, d, {
              x: finnishFactor(d) * d.reach.monthlyReachAvg,
              y: finnishFactor(d) * d.retweets.monthlyUserAvg,
              z: zAxisScale(extractZAxisValue(d))
            });
          })
        }]

      });
    }

    showUserBubbleChart();

    pyppe.util.createTableContent(
      $table,
      [
        {
          label: 'Sija',
          ascending: true,
          value: (r, i) => i,
          render: (r, i) => nowrap((i+1) + ".")
        },
        {
          label: 'Käyttäjä',
          ascending: true,
          tooltipHtml: 'Käyttäjän tiedot <small>(ykköstwiitti, eniten käytetyt hashtagit sekä aktiivisuus/kk)</small>',
          value: ({user}) => user.screenName.toLowerCase(),
          className: 'twitter-user-col',
          render: row => {
            const {user, topHashtags, topTweet} = row;
            const topTweetHtml = topTweet ? (`
              <span class="badge badge-info has-tooltip bare show-top-tweet" title="Näytä käyttäjän ykköstwiitti" data-tweet-id="${topTweet.id}">
                <i class="fa fa-trophy"></i>&nbsp;${moment(topTweet.time).format("dd D.M.YYYY")}
              </span>
            `) : '';
            const hashtagsHtml = _.size(topHashtags) > 0 ? (
              _.map(topHashtags, hashtag => {
                const q = `#${hashtag} from:${user.screenName} since:2017-01-01 until:2018-01-01`;
                const truncatedHashtag = _.size(hashtag) > 30 ? _.take(hashtag, 27).join('') + '…' : hashtag;
                return (`
                  <a href="https://twitter.com/search?q=${encodeURIComponent(q)}" target="_blank">
                    <span class="badge badge-secondary hashtag">#${_.escape(truncatedHashtag)}</span>
                  </a>
                `);
              }).join('')
            ) : '';
            return (`
              <img src="/img/twitter/profile_images/${user.screenName}.jpg" />
              <div class="user" data-user-id="${user.id}">
                <a href="https://twitter.com/intent/user?user_id=${user.id}" target="_blank">@${_.escape(user.screenName)}</a>
                ${topTweetHtml}
                <small>${_.escape(user.name)}</small>
              </div>
              <div class="spark-area"></div>
              ${hashtagsHtml}
              <div style="clear: both;"></div>
              <div data-twitter-id="${topTweet.id}"></div>
            `);
          },
          alterColumn: ($td, {activity}) => {
            bindPopover({
              el: $td.find('.spark-area'),
              title: 'Aktiivisuus',
              placement: 'right',
              table: _.map(activity, (count, idx) => tr(
                moment('2017-01-01').add(idx, 'month').format('YYYY MMMM'),
                `${integerFormat(count)} retwiittiä ja mainintaa yhteensä`
              ))
            });
          }
        },
        {
          label: 'Seuraajia',
          tooltipHtml: 'Käyttäjän seuraajalukumäärä<br/><small>(engl. <em>followers</em>)</small>',
          value: r => r.user.followersCount,
          render: r => nowrap(integerFormat(r.user.followersCount))
        },
        {
          label: 'Kiehtovuus',
          tooltipHtml: 'Retwiittaajien ja keskustelijoiden suhde käyttäjän seuraajiin',
          value: r => r.engagementRatio,
          render: r => nowrap(decimalFormat(r.engagementRatio * 100) + ' %')
        },
        {
          label: 'Tavoittavuus',
          tooltipHtml: 'Retwiittaajien yhteenlaskettu seuraajamäärä',
          value: r => r.reach.monthlyReachAvg,
          render: r => withTooltip(`${integerFormat(r.reach.monthlyReachAvg)} / kk`),
          alterColumn: ($td, {reach}) => {
            bindPopover({
              el: $td.find('.has-tooltip'),
              title: 'Tavoittavuus',
              table: [
                tr('Tavoittavuus (keskiarvo)', `${integerFormat(reach.monthlyReachAvg)} / kk`),
                tr('Tavoittavuus (mediaani)',  `${integerFormat(reach.monthlyReachMed)} / kk`),
                tr('Tavoittavuus yhteensä',    `${integerFormat(reach.totalReach)}`)
              ]
            });
          }
        },
        {
          label: 'Omat',
          tooltipHtml: 'Käyttäjän omat twiitit<br/><small>(pl. retwiitit)</small>',
          value: r => r.own.totalCount,
          render: r => withTooltip(`${decimalFormat(r.own.dailyCount)} / pv`),
          alterColumn: ($td, {own}) => {
            bindPopover({
              el: $td.find('.has-tooltip'),
              title: 'Omat twiitit',
              table: [
                tr('Omat twiitit (keskiarvo)', `${decimalFormat(own.dailyCount)} / päivä`),
                tr('Omat twiitit yhteensä',    `${integerFormat(own.totalCount)}`)
              ]
            });
          }
        },
        {
          label: 'Retwiittaajat',
          tooltipHtml: 'Uniikit retwiittaajat',
          value: r => r.retweets.monthlyUserAvg,
          render: r => withTooltip(`${integerFormat(r.retweets.monthlyUserAvg)} / kk`),
          alterColumn: ($td, {retweets}) => {
            bindPopover({
              el: $td.find('.has-tooltip'),
              title: 'Retwiittaajat',
              table: [
                tr('Uniikkeja retwiittaajia (keskiarvo)', `${integerFormat(retweets.monthlyUserAvg)} / kk`),
                tr('Uniikkeja retwiittaajia (mediaani)',  `${integerFormat(retweets.monthlyUserMed)} / kk`),
                tr('Uniikkeja retwiittaajia yhteensä',    `${integerFormat(retweets.totalUsers)}`),
                tr('Retwiittejä (keskiarvo)',             `${integerFormat(retweets.monthlyCountAvg)} / kk`),
                tr('Retwiittejä (mediaani)',              `${integerFormat(retweets.monthlyCountMed)} / kk`),
                tr('Retwiittejä yhteensä',                `${integerFormat(retweets.totalCount)}`)
              ]
            });
          }
        },
        {
          label: 'RT-suhde',
          tooltipHtml: 'Saatujen retwiittien suhde käyttäjän omiin twiitteihin',
          value: r => r.retweetRatio,
          render: r => nowrap(decimalFormat(r.retweetRatio))
        },
        {
          label: 'Keskustelijat',
          tooltipHtml: 'Uniikit käyttäjät, jotka ovat maininneet käyttäjän omissa twiiteissään',
          value: r => r.mentions.monthlyUserAvg,
          render: r => withTooltip(`${integerFormat(r.mentions.monthlyUserAvg)} / kk`),
          alterColumn: ($td, {mentions}) => {
            bindPopover({
              el: $td.find('.has-tooltip'),
              title: 'Keskustelijat',
              placement: 'left',
              table: [
                tr('Uniikkeja keskustelijoita (keskiarvo)', `${integerFormat(mentions.monthlyUserAvg)} / kk`),
                tr('Uniikkeja keskustelijoita (mediaani)',  `${integerFormat(mentions.monthlyUserMed)} / kk`),
                tr('Uniikkeja keskustelijoita yhteensä',    `${integerFormat(mentions.totalUsers)}`),
                tr('Mainintoja (keskiarvo)',                `${integerFormat(mentions.monthlyCountAvg)} / kk`),
                tr('Mainintoja (mediaani)',                 `${integerFormat(mentions.monthlyCountMed)} / kk`),
                tr('Mainintoja yhteensä',                   `${integerFormat(mentions.totalCount)}`)
              ]
            });
          }
        },
        {
          label: 'Suom.',
          tooltipHtml: 'Kuinka suuri osuus käyttäjän yleisöstä<br/><small>(retwiittaajat / keskustelijat)</small><br/>on suomalaisia',
          value: r => r.finnishRatio,
          render: r => nowrap(r.finnishRatio ? `${decimalFormat(r.finnishRatio * 100)} %` : '?')
        }
      ],
      rows
    );

    $table.find('tbody tr').each(function(i) {
      const $tr = $(this);
      sparkLine(
        $tr.find('.spark-area'),
        rows[i].activity
      );
    });

    const closeDynamicTweetPopover = () => $('#dynamic-tweet-popover').closest('.popover').popover('dispose');

    $('body').on('click', '[data-close-dynamic-tweet-popover]', closeDynamicTweetPopover);

    pyppe.util.bindTooltips($table);

    $table.find('.show-top-tweet').click(function() {
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

    const $tweets = $table.find('[data-twitter-id]');

    const $checkbox = $checkboxContainer.find('input');

    bindTableSortingAndOnScrollEmbeddedTweets({
      $table, $checkbox, $tweets,
      onCheck: () =>  {
        $table.find('.show-top-tweet').hide();
        $table.find('thead th').each(function(i) {
          if (i === 2) $(this).hide();
        });
        $table.find('tbody tr').each(function() {
          $(this).find('td').each(function(i) {
            if (i === 2) $(this).hide();
          });
        });
      },
      onUncheck : () => {
        $table.find('.show-top-tweet').show();
        $table.find('thead th').show();
        $table.find('tbody td').show();
      }
    });
  }

  function createHashtagsTabContent({hashtags}) {
    const $container = $('#suomi-twitter-2017-hashtags');

    const $canvas = $('<div class="canvas"></div>').appendTo($container);
    drawHashtagCloud(hashtags, $canvas);
    pyppe.util.onWindowWidthResized($canvas, () => {
      d3.selectAll('#suomi-twitter-2017-hashtags .canvas svg').remove(); // remove existing
      drawHashtagCloud(hashtags, $canvas);
    });

    $('<h2>TOP-200 <small class="text-muted">hashtagit</small></h2>').appendTo($container);

    const $checkboxContainer = $(`
      <div class="checkbox">
        <label><input type="checkbox"/> Näytä aihetwiitit</label>
      </div>
    `).appendTo($container);

    const $table = $('<table class="table table-striped"></table>').appendTo($container);
    const score = ({tweetCount, userCardinality, originalTweetCount}) => (
      -tweetCount * userCardinality * originalTweetCount
    );
    _.forEach(hashtags, (h, idx) => {
      h.rank = idx + 1;
    });
    const retweetRatio = ({tweetCount, originalTweetCount}) => 1 - (originalTweetCount / tweetCount);
    pyppe.util.createTableContent(
      $table,
      [
        {
          label: 'Sija',
          ascending: true,
          value: b => b.rank,
          render: b => b.rank + "."
        },
        {
          label: 'Hashtag',
          ascending: true,
          value: b => b.key,
          render: b => {
            const q = `#${b.key} since:2017-01-01 until:2018-01-01`
            const url = `https://twitter.com/search?q=${encodeURIComponent(q)}`
            return (`
              <a href="${url}" target="_blank">#${b.key}</a>
              <div data-twitter-id="${b.topTweetId}"></div>
            `);
          }
        },
        {
          label: 'Twiittejä',
          value: b => b.tweetCount,
          render: b => integerFormat(b.tweetCount)
        },
        {
          label: 'Twiittaajia',
          value: b => b.userCardinality,
          render: b => integerFormat(b.userCardinality)
        },
        {
          label: 'RT-osuus',
          value: retweetRatio,
          render: b => decimalFormat(retweetRatio(b) * 100) + ' %'
        }
      ],
      hashtags
    );

    bindTableSortingAndOnScrollEmbeddedTweets({
      $table,
      $checkbox: $checkboxContainer.find('input'),
      $tweets: $table.find('[data-twitter-id]')
    });
  }

  function createTotalsTabContent(response) {

    const {buckets} = response;
    const tweetData = _.map(buckets, bucket => ({
      x: bucket.key,
      y: bucket.tweetCount,
      peak: bucket.peak
    }));

    $('#suomi-twitter-2017-totals-chart').highcharts({
      chart: { type: 'line' },
      title: { text: ' ' },
      xAxis: {
        type: 'datetime',
        labels: {
          formatter: function() {
            const m = moment(this.value);

            if (m.date() === 1) {
              return m.format('MMM');
            } else {
              return m.format('D.M.');
            }
          }
        }
      },
      yAxis: [
        {
          title: {
            text: 'Twiittejä / ' + response.info.bucketIntervalLabel
          },
          min: 0
        }
      ],
      credits: false,
      plotOptions: {
        line: {
          lineWidth: 1,
          turboThreshold: 0,
          dataLabels: {
            enabled: true,
            useHTML: true,
            formatter: function() {
              const {peak} = this.point.options;
              if (peak) {
                const key = this.x;
                const bucket = _.find(buckets, b => b.key === key);
                const {tweetCount} = bucket;
                const ratio = peak.count / tweetCount;
                let fontSize = "8px";
                if (ratio > 0.09) {
                  fontSize = "10px";
                }
                if (ratio > 0.15) {
                  fontSize = "16px";
                }
                return `<span class="badge badge-secondary peak-data-label" style="font-size: ${fontSize}">#${peak.key}</span>`;
              }
              return null;
            }
          }
        }
      },
      tooltip: {
        shared: true,
        crosshairs: true,

        // These are essential where useHTML and custom tooltip
        // Issue was: http://stackoverflow.com/questions/13740200/highcharts-html-tooltip-datalabels-render-issue
        borderWidth: 0,
        borderRadius: 0,
        shadow: false,
        backgroundColor: "rgba(255,255,255,0)",
        useHTML: true,

        formatter: function() {
          var key = this.x;
          var bucket = _.find(buckets, function(b) { return b.key === key; });
          var rtPercentage = Math.round(bucket.retweetCount / bucket.tweetCount * 100);
          var peak = bucket.peak;

          function row(k, v) {
            return '<tr><th>'+k+'</th><td>'+v+'</td></tr>';
          }

          var peakRow = (function() {
            if (peak) {
              var percentage = Math.round(peak.count / bucket.tweetCount * 100);
              return row('#' + peak.key, integerFormat(peak.count) + ' kpl ' + '<small>('+percentage+' %)</small>')
            } else {
              return '';
            }
          })();
          return '<div class="pyppe-highcharts-tooltip">' + [
              '<h5>'+bucket.name+'</h5>',
              '<table class="table table-striped"><tbody>',
              row('Twiittejä yht.', integerFormat(bucket.tweetCount) + ' kpl'),
              row('Retwiittejä', integerFormat(bucket.retweetCount) + ' kpl'),
              row('RT-osuus', rtPercentage + ' %'),
              peakRow,
              '</tbody></table>'
            ].join('') + '</div>';
        }
      },
      series: [
        {
          name : 'Twiittejä',
          data : tweetData,
          type : 'line',
          tooltip: { valueDecimals: 0 }
        }
      ]
    });
  }

  function createViralTabContent({days, buckets}) {
    bindViralsBubbleChart(buckets);
    createViralsDayTable(days);
    createViralsTable(buckets);
    createViralsNavigation();
  }

  function createViralsNavigation() {
    const $dayTable = $('#suomi-twitter-2017-virals table:first');
    const $bucketTable = $('#suomi-twitter-2017-virals table:eq(1)');

    $('<h2>TOP-150 <small class="text-muted">viraali-ilmöt</small></h2>').insertBefore($dayTable);

    const $form = $(`
      <form class="form-inline">
        <div class="form-group">
          <label><b>Ryhmittele:</b></label>
          <select class="custom-select">
            <option value="hashtags" selected>Hashtagit erikseen</option>
            <option value="days">Hashtagit per päivä</option>
          </select>
        </div>
        <div class="form-group" style="margin-left: 20px;">
          <div class="checkbox">
            <label><input type="checkbox"/> Näytä aihetwiitit</label>
          </div>
        </div>
      </form>
    `).insertBefore($dayTable);
    $dayTable.hide();
    $bucketTable.hide();
    const $checkboxContainer = $form.find('.checkbox');
    const $select = $form.find('select');
    $select.
      change(function() {
        if ($(this).val() === 'days') {
          $checkboxContainer.hide();
          $bucketTable.hide();
          $dayTable.show();
        } else {
          $checkboxContainer.show();
          $dayTable.hide();
          $bucketTable.show();
        }
      }).
      change();

    bindTableSortingAndOnScrollEmbeddedTweets({
      $table: $bucketTable,
      $checkbox: $checkboxContainer.find('input'),
      $tweets: $('#suomi-twitter-2017-virals [data-twitter-id]')
    });
  }

  function createViralsDayTable(days) {
    const $container = $('#suomi-twitter-2017-virals');
    const $table = $('<table class="table table-striped compact-table" style="display: none;"></table>').appendTo($container);

    pyppe.util.createTableContent(
      $table,
      [
        {
          label: 'Aiheet',
          tooltipHtml: 'Päivän viraaliaiheet',
          value: b => (_.size(b.hashtags) * 999) + b.hashtags[0].toLowerCase().charCodeAt(0),
          render: b => _.map(b.hashtags, hashtag => `
            <a href="${hashtagSearchUrlForDay(hashtag, b.day)}" target="_blank">#${_.escape(hashtag)}</a>
          `).join('')
        },
        {
          label: 'Päivä',
          ascending: true,
          value: b => b.day,
          render: b => nowrap(moment(b.day).format('dd D.M.YYYY'))
        },
        {
          label: 'Viraalitwiittaajat',
          tooltipHtml: 'Viraaliaiheista twiitanneet uniikit käyttäjät',
          value: b => b.viralUserCount,
          render: b => nowrap(integerFormat(b.viralUserCount))
        },
        {
          label: 'Viraalitwiitit',
          tooltipHtml: 'Viraaliaiheiden hashtagia käyttäneiden twiittien lukumäärä',
          value: b => b.viralTweetCount,
          render: b => nowrap(integerFormat(b.viralTweetCount))
        },
        {
          label: 'Viraalitwiittien osuus',
          tooltipHtml: 'Viraaliaiheiden hashtagia käyttäneiden twiittien suhde päivän kaikkien twiittien lukumäärään',
          value: b => b.viralTweetCount / b.totalTweetCount,
          render: b => nowrap(decimalFormat(b.viralTweetCount / b.totalTweetCount * 100) + ' %')
        }
      ],
      days
    );

    pyppe.util.bindTooltips($table.find('> thead'));
    pyppe.util.bindTableSorting({$table, initialSortIndex: 4});
  }

  function createViralsTable(buckets) {
    const $container = $('#suomi-twitter-2017-virals');
    const $table = $('<table class="table table-striped compact-table" style="display: none;"></table>').appendTo($container);

    pyppe.util.createTableContent(
      $table,
      [
        {
          label: 'Sija',
          ascending: true,
          value: b => b.rank,
          render: b => b.rank + ".",
        },
        {
          label: 'Aihe',
          ascending: true,
          value: b => b.key,
          render: b => {
            const topTweetId = b.topTweetUrl && new RegExp(".*/(\\d+)$", "g").exec(b.topTweetUrl)[1];
            return (`
              <a href="${hashtagSearchUrlForDay(b.key, b.day)}" target="_blank">#${b.caseSensitiveKey}</a>
              ${topTweetId ? `<div data-twitter-id="${topTweetId}"></div>` : ''}
            `);
          }
        },
        {
          label: 'Päivä',
          ascending: true,
          value: b => b.day,
          render: b => nowrap(moment(b.day).format('dd D.M.YYYY'))
        },
        {
          label: 'Twiittejä',
          value: b => b.dayCount,
          render: b => nowrap(integerFormat(b.dayCount))
        },
        {
          label: 'Twiittaajia',
          value: b => b.userCardinality,
          render: b => nowrap(integerFormat(b.userCardinality))
        },
        {
          label: 'Tavoittavuus',
          value: b => b.reach,
          render: b => nowrap(integerFormat(b.reach))
        },
        {
          label: 'Viraaliaste',
          value: b => b.dayCount / b.backgroundCount,
          render: b => nowrap(decimalFormat(b.dayCount / b.backgroundCount * 100) + ' %')
        }
      ],
      buckets
    );
  }

  function bindViralsBubbleChart(tweetData) {
    const $container = $('#suomi-twitter-2017-virals');
    $(`
      <div class="row">
        <div class="col-sm-6">
          <b>Näytä:</b>
          <select class="custom-select" style="width: 100%;">
            <option value="5">TOP 5</option>
            <option value="10">TOP 10</option>
            <option value="30">TOP 30</option>
            <option value="50" selected>TOP 50</option>
            <option value="999">Kaikki</option>
          </select>
        </div>
        <div class="col-sm-6">
          <b>Asteikko:</b>
          <select class="custom-select" style="width: 100%;">
            <option value="logarithmic" selected>Logaritminen asteikko</option>
            <option value="linear">Lineaarinen asteikko</option>
          </select>
        </div>
      </div>
    `).appendTo($container);
    const $chart = $('<div></div>').appendTo($container);
    const $amountSelect = $container.find('select:eq(0)');
    const $scaleSelect = $container.find('select:eq(1)');

    $amountSelect.change(drawViralChart);
    $scaleSelect.change(drawViralChart);
    drawViralChart();

    function drawViralChart() {
      const tweetCountScale = (function() {
        if ($scaleSelect.val() === 'linear') {
          return _.identity;
        } else {
          const counts = _.map(tweetData, 'dayCount');
          return d3.scaleSqrt().domain([_.min(counts), _.max(counts)]).range([10, 40]);
        }
      })();

      const height = Math.max($(window).height()-250, 400);
      $chart.css({height: height+'px'}).highcharts({
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
          type: $scaleSelect.val(),
          gridLineWidth: 1,
          title: { text: 'Tavoittavuus' }
        },

        yAxis: {
          type: $scaleSelect.val(),
          title: { text: 'Uniikkeja twiittaajia' },
          maxPadding: 0.2
        },

        tooltip: {
          useHTML: true,
          headerFormat: '',
          footerFormat: '',
          formatter: function() {
            const t = this.point.options;
            const row = (label, number) => `<tr><th>${label}:</th><td>${integerFormat(number)}</td>`;
            return (`
              <h5>
                <span class="badge badge-primary">${t.rank}.</span>
                #${t.caseSensitiveKey}
                <small class="text-muted">${moment(t.day).format('dd D.M.YYYY')}</small>
              </h5>
              <table class="table table-striped">
                <tbody>
                  ${row('Tavoittavuus', t.reach)}
                  ${row('Uniikkeja twiittaajia', t.userCardinality)}
                  ${row('Twiittejä yhteensä', t.dayCount)}
                </tbody>
              </table>
            `);
          },
          //followPointer: true
        },

        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '{point.caseSensitiveKey}'
            }
          }
        },

        series: [{
          data: _.map(_.take(tweetData, parseInt($amountSelect.val())), function(t) {
            return _.assign(t, {
              x: t.reach,
              y: t.userCardinality,
              z: tweetCountScale(t.dayCount)
            });
          })
        }]

      });
    }
  }

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
    const x = d3.scaleLinear().domain([0, _.size(activity)-1]).range([0, width]);
    const y = d3.scalePow().exponent(4).domain(activityDomain).range([0, height]);

    const line = d3.line().
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

  function hashtagSearchUrlForDay(hashtag, day) {
    const until = moment(day).add(1,'days').format('YYYY-MM-DD');
    const q = `#${hashtag} since:${day} until:${until}`;
    return `https://twitter.com/search?q=${encodeURIComponent(q)}`;
  }

  function bindTableSortingAndOnScrollEmbeddedTweets({$table, $checkbox, $tweets, onCheck = _.noop, onUncheck = _.noop}) {
    $checkbox.change(function() {
      const $hashtagsHeader = $table.find('> thead th:eq(1)');
      if ($(this).is(':checked')) {
        $hashtagsHeader.css('width', '100%');
        onCheck();
        $table.removeClass('table-striped'); // Chrome seems to mess up graphics...
        $(window).scroll();
      } else {
        $hashtagsHeader.css('width', 'inherit');
        onUncheck();
        $table.addClass('table-striped');
        $tweets.children().remove();
      }
    });
    pyppe.util.bindTableSorting({
      $table,
      beforeSort: () => $tweets.children().remove(),
      afterSort: () => $(window).scroll()
    });
    $(window).on('scroll', _.debounce(() => {
      if ($table.is(':visible') && $checkbox.is(':checked')) {
        $tweets.each(function(i) {
          const $el = $(this);
          const isTimeToLoad = pyppe.util.isElementInViewport($el[0], {bottomThreshold: 500}) &&
            $el.parent().find('fa-spinner').length === 0 &&
            $el.children().length === 0;
          if (isTimeToLoad) {
            const id = $el.data('twitterId').toString();
            $el.css('max-width', $el.width());
            const $spinner = $('<i class="fa fa-spin fa-spinner"></i>').appendTo($el.parent());
            twttr.widgets.createTweet(id, $el[0], {
              id: id,
              lang: 'fi'
            }).then(function() {
              $spinner.remove();
            });
          }
        });
      }
    }, 100, {maxWait: 200}));
  }

});
