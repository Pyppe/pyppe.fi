$(() => {
  const $postContainer = $('#twitterin-kaytto-suomessa-container');
  const {abbreviatedNumberFormat, decimalFormat, integerFormat} = pyppe.util;
  const COLOR_OPTIONS = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
  const asyncResource = name => $.get(`/dist/resources/${name}`, {h: pyppe.resourceHash});
  const muted = text => `<small class="text-muted">(${text})</small>`;
  const createAreaColorFunction = (analysis, cityValueExtractor) => {
    const counts = _.map(_.keys(analysis.cities), cityValueExtractor);
    const color = d3.scalePow().exponent(0.5).
      domain([_.min(counts), _.max(counts)]).
      interpolate(d3.interpolateHcl).
      range([d3.rgb('#ffeda0'), d3.rgb('#e31a1c')]);

    return num => color(num);
  };

  function createColorGiver(sortedNumbers, colors) {
    const groups = _.map(
      _.chunk(sortedNumbers, Math.ceil(_.size(sortedNumbers) / _.size(colors))),
      (numbers, i) => {
        const min = _.head(numbers);
        const max = _.last(numbers);

        return num => num >= min && num <= max;
      }
    );

    return number => {
      const idx = _.findIndex(groups, g => g(number));
      return colors[idx >= 0 ? idx : 0];
    };
  }

  $.when(
    asyncResource('finnish_tweet_analysis.json'),
    asyncResource('finland_2017_2.geo.json'),
    asyncResource('suomen-kuntien-vakiluvut.json')
  ).done((a, b, c) => {
    const [analysis, geoJson, habitants] = [a[0], b[0], c[0]];
    (() => {

      /*
      function inhabitantF(users, inhabitantCount) {
        return users / Math.pow(inhabitantCount, 0.7) / 3;
      }
      
      '\n' + _.map([[109, 940], [5000, 4000], [410, 6368], [41206,639222], [50000, 40000]], ([users, inhabitantCount]) => {
         const percentage = users / inhabitantCount * 100;
        return `Users: ${users}, inhabitants = ${inhabitantCount}, percentage = ${percentage.toFixed(1)}, score = ${inhabitantF(users, inhabitantCount)}`;
      }).join('\n') + '\n';
      */

      const {cityUsers, cityTweets} = analysis;
      _.forEach(analysis.cities, (city, name) => {
        city.name = name;
        city.habitantCount = habitants[name];
        city.score = (
          (city.tweets / cityTweets) + (city.users / cityUsers) + (city.users / Math.pow(city.habitantCount, 0.7) / 3)
        ) * 100;
      });
    })();

    analysis.scoredCities = (() => {
      const {cities, cityTweets, cityUsers} = analysis;
      const scored = _.sortBy(
        _.map(_.keys(cities), name =>
          cities[name]
        ),
        ({score}) => -score
      );
      return _.map(scored, (obj, idx) => ({...obj, rank: idx + 1}));
    })();
    window.analysis = analysis;
    window.habitants = habitants;
    drawMonthlyUsersChart(analysis);
    drawMap(analysis, (() => {
      const cityValueExtractor = name => _.get(analysis.cities[name], 'tweets');
      const areaColorF = createAreaColorFunction(analysis, cityValueExtractor);
      const topTweetCities = _.take(_.sortBy(analysis.scoredCities, ({tweets}) => -tweets), 15);
      $(`
        <h4>TOP kaupungit ${muted("twiittien lukumäärän suhteen")}</h4>
        <table class="table table-striped table-sm city-numbers">
          <thead>
            <tr>
              <th>Kaupunki ${muted("twiitejä")}</th>
              <th>Osuus</th>
            </tr>
          </thead>
          <tbody>
          ${_.map(topTweetCities, city => {
            const count = city.tweets;
            const percentage = count / analysis.cityTweets * 100;
            return (`
              <tr>
                <td>${city.name} ${muted(integerFormat(count))}</td>
                <td>
                  <div class="bar-wrapper">
                    <div class="bar" style="width: ${percentage}%; background-color: ${areaColorF(count)};">
                      <span class="number">${decimalFormat(percentage)}&nbsp;%</span>
                    </div>
                  </div>
                </td>
              </tr>
            `);
          }).join('')}
          </tbody>
        </table>
      `).appendTo($postContainer.find('>[data-tweet-map] [data-stats]'));

      return {
        $mapContainer: $postContainer.find('>[data-tweet-map] [data-map]'),
        geoJson,
        cityValueExtractor,
        areaColorF,
        tooltipHtmlF: ({name, parent}) => {
          const count = cityValueExtractor(name);
          const percentage = count / analysis.cityTweets * 100;
          return (`
            <dl>
              <dt>Twiittejä yhteensä</dt>
              <dd style="font-size: 130%">
                ${integerFormat(count)}
                <span style="color: ${areaColorF(count)}">(${decimalFormat(percentage)}&nbsp;%)</span>
              </dd>
            </dl>
          `);
        }
      };
    })());

    // Scored map
    drawMap(analysis, (() => {
      const cityValueExtractor = name => _.get(analysis.cities[name], 'score');
      const areaColorF = createAreaColorFunction(analysis, cityValueExtractor);
      const maxScore = analysis.scoredCities[0].score;
      const scoredTooltipContent = city => (`
        <div class="row scored-tooltip">
          <div class="col-sm-6">
            <dl>
              <dt>Pisteitä</dt>
              <dd style="font-size: 130%">
                <span style="color: ${areaColorF(city.score)}">${decimalFormat(city.score)}</span>
              </dd>

              <dt>Twiittejä</dt>
              <dd>${integerFormat(city.tweets)}</dd>
            </dl>
          </div>
          <div class="col-sm-6">
            <dl>
              <dt>Twiittaajia</dt>
              <dd>${integerFormat(city.users)}</dd>

              <dt>Asukasluku</dt>
              <dd>${integerFormat(city.habitantCount)}</dd>
            </dl>
          </div>
        </div>
      `);
      const $statsTable = $(`
        <h4>TOP kaupungit ${muted("Stetson-Harrison -pisteytys")}</h4>
        <table class="table table-striped table-sm city-numbers">
          <thead>
            <tr>
              <th>Kaupunki</th>
              <th>Pisteet</th>
            </tr>
          </thead>
          <tbody>
          ${_.map(_.take(analysis.scoredCities, 15), city => {
            const percentage = city.score / maxScore * 100;
            return (`
              <tr>
                <td><span data-city="${city.name}">${city.name}</span></td>
                <td>
                  <div class="bar-wrapper">
                    <div class="bar" style="width: ${percentage}%; background-color: ${areaColorF(city.score)};">
                      <span class="number">${decimalFormat(city.score)}</span>
                    </div>
                  </div>
                </td>
              </tr>
            `);
          }).join('')}
          </tbody>
        </table>
      `).appendTo($postContainer.find('>[data-scored-map] [data-stats]'));
      $statsTable.find('[data-city]').each((i, el) => {
        const $el = $(el);
        const city = analysis.cities[$el.data('city')];
        $el.popover({
          title: city.name,
          html: true,
          trigger: 'hover focus',
          content: scoredTooltipContent(city)
        });
      });

      return {
        $mapContainer: $postContainer.find('>[data-scored-map] [data-map]'),
        geoJson,
        cityValueExtractor,
        areaColorF,
        tooltipHtmlF: ({name, parent}) => scoredTooltipContent(analysis.cities[name])
      };
    })());

    populateMasterTable(analysis, habitants);
  });


  // https://gist.github.com/Fil/f2381f767944d368a73b53a2243d9f5b
  // https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
  // http://colorbrewer2.org/


  // http://techslides.com/responsive-d3-map-with-zoom-and-pan-limits
  // http://techslides.com/d3-map-starter-kit
  // http://techslides.com/demos/d3/worldmap-template-d3v4.html
  function drawMap(analysis, options) {
    const {cities, totalTweets} = analysis;
    const {geoJson, cityValueExtractor, $mapContainer, areaColorF, tooltipHtmlF} = options;

    const [width, height] = (() => {
      const width = $mapContainer.width();
      return [width, 600];
    })();

    const svg = d3.select($mapContainer[0]).
      attr('class', 'd3-map').
      append("svg").
      attr("width", width).
      attr("height", height);

    const cityG = svg.append("g");

    const projection = d3.geoMercator().
      center([27, 65.3]).
      translate([width / 2, height / 2]).
      scale(height * 2.05);
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom().
      scaleExtent([1, 5]). // Limit zoom
      on("zoom", () => {
        $mapContainer.addClass('zoomed');

        const {x, y, k} = d3.event.transform;
        const h = height/1.5;

        const newX = Math.min(
          (width/height)  * (k - 1),
          Math.max(width * (1 - k), x)
        );
        const newY = Math.min(
          h * (k - 1) + h * k,
          Math.max(height  * (1 - k) - h * k, y)
        );

        console.log(`ZOOM translate(${newX},${newY}) scale(${k})`);

        //zoom.translateBy(t);
        cityG.attr("transform", `translate(${newX},${newY}) scale(${k})`);

        //adjust the country hover stroke width based on zoom level
        d3.selectAll(".country").style("stroke-width", 1.5 / k);

      });

    $(`
      <button class="btn btn-sm btn-secondary">
        Reset
      </button>
    `).appendTo($mapContainer).click(() => {
      cityG.call(zoom.transform, d3.zoomIdentity);
      $mapContainer.removeClass('zoomed');
    });

    const tooltip = d3.select("body").append("div").
      attr("class", "d3-tooltip").
      style("opacity", 0);

     cityG.
      call(zoom).
      selectAll(".country").
      data(geoJson.features).
      enter().
      append("path").
      attr("class", ({id}) => `country ${id}`).
      attr("d", path).
      style('fill', d => {
        const count = cityValueExtractor(d.properties.name);
        return count ? areaColorF(count) : 'transparent';
      }).
      on('mouseover', function(d, i) {
        d3.select(this).
          transition().duration(100).
          attr('stroke-width', 2).
          attr('stroke', 'white');

        const {name, parent} = d.properties;
        const count = cities[name];
        const percentage = count / totalTweets * 100;

        //const habitantCount = habitants[name];
        const habitantCount = 999;

        tooltip.
          transition().duration(200).
          style("opacity", 0.9);
        tooltip.
          html(`
            <h5>${name} ${muted(parent)}</h5>
            ${tooltipHtmlF(d.properties)}
          `).
          style("left", (d3.event.pageX + 20) + "px").
          style("top", (d3.event.pageY - 28) + "px");
      }).
      on('mouseout', function() {
        d3.select(this).
          transition().duration(400).
          attr('stroke-width', 0).
          attr('stroke', 'transparent');

        tooltip.
          transition().duration(400).
          style("opacity", 0);
      });
  }

  function drawMonthlyUsersChart({months}) {
    $postContainer.find('> [data-monthly-chart]').highcharts({
      title: null,
      credits: false,
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      xAxis: {
        categories: _.keys(months),
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Suomalaisia twiittaajia'
        }
      },
      tooltip: {
        headerFormat: `<b style="font-size: 14px; font-weight: 700;">{point.key}</b><br/>`,
        //pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        //'<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
        //footerFormat: '</table>',
        shared: true,
        //useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [
        {
          type: 'column',
          name: 'Suomalaiset twiittaajat / kk',
          data: _.map(_.keys(months), o => months[o].users)
        },
        {
          type: 'line',
          name: 'Suomalaiset twiittaajat yhteensä (kumulatiivinen)',
          data: _.map(_.keys(months), o => months[o].cumulativeUsers)
        },
        /*
        {
          name: 'Suomalaiset twiitit',
          data: _.map(_.keys(months), o => months[o].tweets)
        },
        */
      ]
    });
  }

  function populateMasterTable({scoredCities, cityUsers, cityTweets}, habitants) {
    const finnishInhabitants = _.sum(_.values(habitants));

    const $table = $(`
      <table class="table table-striped compact-table">
        <thead>
          <tr>
            <th data-asc="true">Sija</th>
            <th data-asc="true">Kunta ${muted("ja TOP hashtagit")}</th>
            <th>Twiittejä</th>
            <th>Twiittaajia</th>
            <th>Asukasluku</th>
            <th>Twiittajaosuus</th>
          </tr>
        </thead>
        <tbody>
          ${_.map(scoredCities, ({name, rank, score, tweets, users, hashtags, habitantCount}) => {
            const cityUserPercentage = users / habitantCount * 100;
            const topHashtags = _.flatMap(_.keys(hashtags), hashtag => {
              const count = hashtags[hashtag];
              return count > 1 ? [{count, hashtag}] : [];
            });
            return (`
              <tr>
                <td data-value="${rank}">
                  <span class="has-tooltip" title="${decimalFormat(score)} pistettä">${rank}.</span>
                </td>
                <td data-value="${name}">
                  <b>${name}</b>
                  ${
                    _.size(topHashtags) > 0 ?
                      (`
                        <br/>
                        ${_.map(topHashtags, ({hashtag, count}) => {
                          const q = `#${hashtag} since:2016-07-01 until:2017-07-01`;
                          return (`
                            <a href="https://twitter.com/search?q=${encodeURIComponent(q)}" target="_blank">
                              <span class="label label-default">#${hashtag} <em>(${abbreviatedNumberFormat(count)})</em></span>
                            </a>
                          `);
                        }).join(' ')}
                      `)
                    :
                      ''
                  }
                </td>
                <td data-value="${tweets}" class="text-nowrap">
                  ${integerFormat(tweets)}<br/>
                  ${muted(decimalFormat(tweets / cityTweets * 100) + '%')}
                </td>
                <td data-value="${users}" class="text-nowrap">
                  ${integerFormat(users)}<br/>
                  ${muted(decimalFormat(users / cityUsers * 100) + '%')}
                </td>
                <td data-value="${habitantCount}" class="text-nowrap">
                  ${integerFormat(habitantCount)}<br/>
                  ${muted(decimalFormat(habitantCount / finnishInhabitants * 100) + '%')}
                </td>
                <td data-value="${cityUserPercentage}" class="text-nowrap">${decimalFormat(cityUserPercentage)}%</td>
              </tr>
            `);
          }).join('')}
        </tbody>
      </table>
    `).appendTo($postContainer.find('> [data-master-table]'));

    pyppe.util.bindTableSorting({$table});
    pyppe.util.bindTooltips($table);
  }


});