$(() => {

  const {abbreviatedNumberFormat, decimalFormat, integerFormat} = pyppe.util;

  const COLOR_OPTIONS = _.reverse(['#111', '#234d20', '#36802d', '#77ab59', '#c9df8a']);

  const tr = (title, value) => `<tr><th>${title}</th><td>${value}</td></tr>`;

  const flag = cc => {
    const OFFSET = 127397;

    const flagFromCodePoint = cc => String.fromCodePoint(...[...cc].map(c => c.charCodeAt() + OFFSET));

    if (cc === 'BX') {
      return _.map(['BE', 'NE', 'LU'], flagFromCodePoint).join(' ');
    } else {
      return (/^[A-Z]{2}$/.test(cc))
        ? String.fromCodePoint(...[...cc].map(c => c.charCodeAt() + OFFSET))
        : null;
    }
  };

  function transformGain(gain) {
    if (gain === 1) return 0;
    return gain > 1.0 ? (100 * (gain-1)) : (1 - gain) * -100;
  }

  //const asyncGeoJson = $.get('http://enjalot.github.io/wwsd/data/world/world-110m.geojson');
  const asyncGeoJson = $.get('/dist/resources/world.geo.json', {h: pyppe.resourceHash});

  //drawMap($('#trademarknow-blog-post'));

  $.get(`/dist/resources/trademark-blog-post.json`, {h: pyppe.resourceHash}).then(countries => {
    const $container = $('#trademarknow-blog-post');

    $('<h4>Select country</h4>').appendTo($container);
    const $countries = $('<div class="countries"></div>').appendTo($container);

    const muted = text => `<small class="text-muted">${text}</small>`;
    const $tabs = $(`
      <ul class="nav nav-tabs" style="display: none;">
        <li class="nav-item">
          <a class="nav-link" href="#trademarks-by-year">Trademark applications ${muted('(by year)')}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#registries">TOP registries ${muted('(bar chart)')}</a>
        </li>
        <!--
        <li class="nav-item">
          <a class="nav-link" href="#companies-cloud">TOP companies <small class="text-muted">(word cloud)</small></a>
        </li>
        -->
        <li class="nav-item">
          <a class="nav-link" href="#companies-bubble">TOP companies ${muted('(bubble chart)')}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#countries">Countries ${muted('(map)')}</a>
        </li>
      </ul>
    `).appendTo($container);

    const availableTabs = $tabs.find('a').map((i, el) => $(el).attr('href').replace('#', ''));

    $tabs.find('a').click(function(e) {
      e.preventDefault();
      $tabs.find('a').removeClass('active');
      const id = $(this).addClass('active').attr('href').replace('#', '');
      pyppe.util.replaceUrlSearch({view: id === availableTabs[0] ? null : id});

      drawActiveVisualization($countries.find('.btn-primary').attr('country-code'));
    });

    const $visualizations = $('<div class="visualizations" />').appendTo($container);

    function showCountryData(el) {
      $tabs.show();
      const $btn = $(el.target);
      $countries.find('.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
      $btn.removeClass('btn-secondary').addClass('btn-primary').blur();
      const cc = $btn.attr('country-code');

      pyppe.util.replaceUrlSearch({country: cc});
      drawActiveVisualization(cc);
    }

    function drawActiveVisualization(countryCode) {
      const scrollTop = $(window).scrollTop();

      const tab = ($tabs.find('a.active').attr('href') || availableTabs[0]).replace('#', '');
      $visualizations.html('');
      const country = _.find(countries, {country: countryCode});
      switch (tab) {
        case 'trademarks-by-year':
          drawYearlyGraph(country, $visualizations);
          break;
        case 'registries':
          drawTopRegistries(country, $visualizations);
          break;
        case 'companies-cloud':
          drawTopFilers(country, $visualizations);
          break;
        case 'companies-bubble':
          drawCompanyBubbleChart(country, $visualizations);
          break;
        case 'countries':
          drawMap(country, $visualizations);
          break;
      }

      $(window).scrollTop(scrollTop);
    }

    _.forEach(countries, c => {
      $(`
        <span class="has-tooltip bare" title="${c.name} (${c.country})">
          <button class="btn btn-secondary btn-sm" country-code="${c.country}">
            ${c.name} <span class="flag">${flag(c.country)}</span>
          </button>
        </span>
      `).click(showCountryData).appendTo($countries);
    });
    pyppe.util.bindTooltips($countries);

    const {country, view} = pyppe.util.parseQueryParams(location.search);
    if (country) {
      $countries.find(`[country-code=${country}]`).click();
    }

    const initialTab = _.includes(availableTabs, view) ? view : availableTabs[0];
    $tabs.find(`a[href="#${initialTab}"]`).click();
  });

  function drawCompanyBubbleChart({name, topFilers}, $container) {
    const scaleType = 'logarithmic';

    const data = _.map(topFilers, (f, i) => {
      return _.assign({}, f, {
        x: f.count,
        y: f.applicationGain,
        z: f.portfolioSize,
        gainPercentage: transformGain(f.applicationGain)
      });
    });

    const [negative, positive] = _.partition(data, obj => obj.applicationGain < 1);

    $('<div/>').appendTo($container).highcharts({
      chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy',
        panning: true,
        panKey: 'shift',
        height: 600
      },

      legend: { enabled: false },
      title: { text: '' },
      credits: false,
      colors: ['#008833'],

      xAxis: {
        type: scaleType,
        gridLineWidth: 1,
        title: { text: 'New trademark applications in 2015-2016' }
      },

      yAxis: {
        type: scaleType,
        title: { text: 'Filing activity' },
        maxPadding: 0.2,
        /*
        labels: {
          formatter() {
            const num = transformGain(this.value);
            return num > 0 ? `+${integerFormat(num)}%` : `${integerFormat(num)}%`;
          }
        }
        */
        labels: false
      },

      tooltip: {
        useHTML: true,
        headerFormat: '',
        footerFormat: '',
        formatter() {
          const x = this.point.options;
          // /img/twitter/profile_images/${user.screenName}.jpg
          const gainText = (
            x.gainPercentage >= 0 ?
              `<span style="color: green">+${decimalFormat(x.gainPercentage)}%</span>`
            :
              `<span style="color: red">${decimalFormat(x.gainPercentage)}%</span>`
          );
          return [
            `<h5>${x.name}</h5>`,
            '<table class="table table-striped" style="line-height: 1"><tbody>',
            tr('New trademark applications', `${integerFormat(x.count)}`),
            tr('Portfolio size', `${integerFormat(x.portfolioSize)}`),
            tr('Filing activity', gainText),
            '</tbody></table>',
          ].join('');
        }
        //followPointer: true
      },

      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            format: '{point.name}'
          }
        },
        bubble: {
          minSize: 10,
          maxSize: 70
        }
      },

      series: [
        {
          color: '#008833',
          data: positive
        },
        {
          color: '#ff0000',
          data: negative
        }
      ]

    });
  }

  function drawMap({name, totalApplications, topJurisdictions}, $container) {
    //window.topJurisdictions = topJurisdictions;

    const jurisdictions = _.mapValues(_.groupBy(topJurisdictions, 'country'), _.head);
    const counts = _.map(topJurisdictions, 'count');

    const color = d3.scaleSqrt().
      domain([_.min(counts), _.max(counts)]).
      range([0, _.size(COLOR_OPTIONS) - 1]);

    asyncGeoJson.then(geoJson => {
      $(`<h4>Most targeted countries by companies from ${name} <small class="text-muted">in past two years</small></h4>`).appendTo($container);

      //window.geoJson = geoJson;
      const [width, height] = (() => {
        const width = $container.width();
        return [width, width / 1.9];
      })();
      const svg = d3.select($container[0]).
        append("svg").
        attr("width", width).
        attr("height", height);
      const projection = d3.geoMercator().
        scale(width / 2.2 / Math.PI).
        //scale(100).
        translate([width / 2, height / 2])
      const path = d3.geoPath().projection(projection);

      const tooltip = d3.select("body").append("div").
        attr("class", "d3-tooltip").
        style("opacity", 0);


      svg.
        selectAll(".country").
        data(geoJson.features).
        enter().
        append("path").
        attr("class", ({id}) => `country ${id}`).
        attr("d", path).
        style('fill', d => {
          const {name, count} = jurisdictions[d.id] || {};
          if (count > 0) {
            const index = Math.round(color(count));
            return COLOR_OPTIONS[index];
          } else {
            return '#eee';
          }
        }).
        on('mouseover', function(d, i) {
          d3.select(this).
            transition().duration(100).
            attr('stroke-width', 1).
            attr('stroke', 'white');

          const jurisdiction = jurisdictions[d.id];

          if (jurisdiction) {
            const percentage = Math.max(
              (jurisdiction.count / totalApplications * 100).toFixed(1),
              0.1
            );
            tooltip.
              transition().duration(200).
              style("opacity", 0.9);
            tooltip.
              html(`
                <b>${percentage}%</b> of trademarks covered <b>${jurisdiction.name}</b>.<br/>
                <small>(by companies from <em>${name}</em> in past two years)</small>
              `).
              style("left", (d3.event.pageX) + "px").
              style("top", (d3.event.pageY - 28) + "px");
          }
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
    });
  }

  function drawTopRegistries({name, topRegistries}, $container) {
    $(`<h4>Most used trademark registries by companies from ${name} <small class="text-muted">in past two years</small></h4>`).appendTo($container);
    $('<div/>').appendTo($container).highcharts({
      chart: {
        type: 'bar',
        height: 600
      },
      title: null,
      legend: false,
      credits: false,
      xAxis: {
        categories: _.map(topRegistries, ({name, registry}) => `${name} ${flag(registry.toUpperCase()) || ''}`),
        title: null
      },
      yAxis: {
        title: null
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            formatter() {
              return abbreviatedNumberFormat(this.y);
            }
          }
        }
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      series: [
        {
          name: 'Applications',
          data: _.map(topRegistries, 'count')
        }
      ]
    });
  }

  function drawYearlyGraph({name, yearlyApplications}, $container) {
    $(`<h4>Trademark applications by companies from ${name}</h4>`).appendTo($container);
    $('<div/>').appendTo($container).highcharts({
      chart: { zoomType: 'x' },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      credits: false,
      legend: false,
      title: null,
      xAxis: { type: 'datetime' },
      yAxis: { title: { text: 'Trademark applications / year' } },
      plotOptions: {
        series: {
          turboThreshold: 0,
          lineWidth: 2,
          marker: {
            radius: 0
          },
          states: {
            hover: {
              lineWidth: 1
            }
          }
        }
      },
      series: [
        {
          name: 'Applications per year',
          data: _.map(yearlyApplications, ({key, count}) => {
            const [year, month, day] = _.map(key.split('-'), n => parseInt(n, 10));
            return {
              x: Date.UTC(year, month - 1, day),
              y: count
            };
          })
        }
      ]
    });
  }

  function drawTopFilers({name, topFilers}, $container) {
    $(`<h4>Biggest trademark filers from ${name} <small class="text-muted">in past two years</small></h4>`).appendTo($container);

    const words = _.map(topFilers, ({name, count}) => ({
      text: name,//.replace(/ /gi, '<br/>'),
      score: count
    }));

    const scores = _.map(words, 'score');
    const color = d3.scaleSqrt().
      domain([_.min(scores), _.max(scores)]).
      range([0, _.size(COLOR_OPTIONS) - 1]);

    const fontSize = d3.scaleSqrt().
      domain([_.min(scores), _.max(scores)]).
      range([10, 30]);

    const [width, height] = (() => {
      //const windowHeight = $(window).height();
      return [$container.width(), 600];
    })();

    d3.layout.cloud().
      size([width, height]).
      words(words).
      padding(1).
      //spiral('archimedean').
      //rotate(function() { return (~~(Math.random() * 6) - 3) * 30; }).
      rotate(0).
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
        attr("transform", `translate(${width / 3}, ${height / 2.7})`).
        selectAll("text").
        data(words).
        enter().append("text").
        style("font-size", ({score}) => `${fontSize(score)}px`).
        style("fill", ({score}) => {
          const index = Math.round(color(score));
          console.log('color for score %s is %s', score, index);
          return COLOR_OPTIONS[index];
        }).
        attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        }).
        text(function(d) { return d.text; });
    }
  }

});
