(() => {

  moment.locale('fi');

  function drawBotChart() {
    const elastic = {"took":78,"timed_out":false,"_shards":{"total":1,"successful":1,"failed":0},"hits":{"total":68778,"max_score":0.0,"hits":[]},"aggregations":{"user_cardinality":{"value":19885},"tweet_time":{"buckets":[{"key_as_string":"2018-01-17T00:00:00.000Z","key":1516147200000,"doc_count":4871},{"key_as_string":"2018-01-18T00:00:00.000Z","key":1516233600000,"doc_count":3466},{"key_as_string":"2018-01-19T00:00:00.000Z","key":1516320000000,"doc_count":2360},{"key_as_string":"2018-01-20T00:00:00.000Z","key":1516406400000,"doc_count":3530},{"key_as_string":"2018-01-21T00:00:00.000Z","key":1516492800000,"doc_count":5200},{"key_as_string":"2018-01-22T00:00:00.000Z","key":1516579200000,"doc_count":4286},{"key_as_string":"2018-01-23T00:00:00.000Z","key":1516665600000,"doc_count":3678},{"key_as_string":"2018-01-24T00:00:00.000Z","key":1516752000000,"doc_count":2124},{"key_as_string":"2018-01-25T00:00:00.000Z","key":1516838400000,"doc_count":6697},{"key_as_string":"2018-01-26T00:00:00.000Z","key":1516924800000,"doc_count":3725},{"key_as_string":"2018-01-27T00:00:00.000Z","key":1517011200000,"doc_count":4029},{"key_as_string":"2018-01-28T00:00:00.000Z","key":1517097600000,"doc_count":17179},{"key_as_string":"2018-01-29T00:00:00.000Z","key":1517184000000,"doc_count":5314},{"key_as_string":"2018-01-30T00:00:00.000Z","key":1517270400000,"doc_count":2319}]}}};
    const {buckets} = elastic.aggregations.tweet_time;

    const data = _.map(buckets, ({key_as_string, doc_count}) => {
      const [year, month, day] = _.map(key_as_string.substr(0, 10).split('-'), str => parseInt(str, 10));
      return [Date.UTC(year, month-1, day), doc_count];
    });

    $('<div/>').appendTo($('#playground-dna')).highcharts({
       chart: {
            zoomType: 'x'
        },
        title: {
            //text: 'USD to EUR exchange rate over time'
            text: null
        },
        subtitle: {
            text: null
        },
      xAxis: {
        type: 'datetime',
        labels: {
          formatter: function() {
            const m = moment(this.value);
            console.log(m.date());
            if (m.date() === 1) {
              return m.format('MMMM');
            } else {
              return m.format('dd D.M.');
            }
          }
        }
      },
        yAxis: {
            title: {
                text: 'Twiittejä'
            }
        },
        legend: {
            enabled: false
        },
        colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
        credits: false,
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, '#008833'],
                        [1, Highcharts.Color('#008833').setOpacity(0.3).get('rgba')]
                    ]
                },
                marker: {
                    radius: 0
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
            }
        },
      tooltip: {
        shared: true,
        crosshairs: true,

        // These are essential where useHTML and custom tooltip
        // Issue was: http://stackoverflow.com/questions/13740200/highcharts-html-tooltip-datalabels-render-issue
        //borderWidth: 0,
        //borderRadius: 0,
        shadow: false,
        //backgroundColor: "rgba(255,255,255,0)",
        useHTML: true,

        positioner: function(boxWidth, boxHeight, point) {
            return {
                x: point.plotX - 90,
                y: point.plotY
            };
        },

        formatter: function() {
          const day = moment(this.x).format('LL');
          return (`
            <div class="pyppe-highcharts-tooltip" style="padding: 0px;">
              <h6>${day}</h6>
              <div>Twiittejä: <b>${this.y}</b></div>
            </div>
          `);
        }
      },
        series: [{
            type: 'areaspline',
            name: 'Twiittejä',
            data: data
        }]
    });
  }

  drawBotChart();

  return;


  $.get(`/dist/resources/4gstatus.json`, {h: pyppe.resourceHash}).then(res => {
    /*
    console.log('abort 4g status');
    return;
    */

    //moment.locale('en');

    const OneMinute = 60000;
    const GapLimit = OneMinute * 60;

    const data = _.chain(res).
      //filter(({time}) => time > Date.UTC(2017,4,1,13) && time < Date.UTC(2017,4,6,12)).
      filter(({time}) => time > Date.UTC(2017,5,1)).
      groupBy('status.Z_CELL_ID').
      toPairs().
      filter(kv => _.size(kv[1]) > 10).
      value();

    const $container = $('#playground-dna');

    $('<div/>').appendTo($container).highcharts({
      chart: {
        zoomType: 'x',
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      credits: false,
      title: { text: 'DNA 4G cellular base station speeds (Mbps)' },
      xAxis: { type: 'datetime' },
      yAxis: { title: { text: 'Mbps' } },
      plotOptions: {
        series: {
          turboThreshold: 0,
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1
            }
          }
        }
      },
      legend: { title: { text: 'CELL ID' } },
      tooltip: {
        formatter() {
          return `<em>${moment(this.x).format('LLL')}</em><br/><b>${this.y} Mbps</b>`
        }
      },
      series: _.map(data, ([cellId, dataPoints]) => {
        return {
          name: cellId,
          data: _.flatMap(dataPoints, (dp, idx) => {
            const isGap = idx > 0 && ((dp.time - dataPoints[idx-1].time) > GapLimit);
            return _.compact([
              isGap ? { x: dataPoints[idx-1].time, y: null } : null,
              { x: dp.time, y: dp.speed }
            ]);
          })
        }
      })
    });

    $('<div/>').appendTo($container).highcharts({
      chart: {
        zoomType: 'x',
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      credits: false,
      title: { text: 'DNA 4G cellular base station SINR' },
      xAxis: { type: 'datetime' },
      yAxis: { title: { text: 'dB' } },
      plotOptions: {
        series: {
          turboThreshold: 0,
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1
            }
          }
        }
      },
      legend: { title: { text: 'CELL ID' } },
      tooltip: {
        formatter() {
          return `<em>${moment(this.x).format('LLL')}</em><br/><b>${this.y} dB</b>`
        }
      },
      series: _.map(data, ([cellId, dataPoints]) => {
        return {
          name: cellId,
          data: _.flatMap(_.filter(dataPoints, dp => _.has(dp, 'status')), (dp, idx) => {
            const isGap = idx > 0 && ((dp.time - dataPoints[idx-1].time) > GapLimit);
            return _.compact([
              isGap ? { x: dataPoints[idx-1].time, y: null } : null,
              { x: dp.time, y: parseFloat(dp.status.lte_snr, 10) }
            ]);
          })
        }
      })
    });

  });

  $.get(`/dist/resources/trademark-playground.json`, {h: pyppe.resourceHash}).then(({topFilers, byYear, topRegistries}) => {
    drawTopFilers(topFilers);
    drawYearlyGraph(byYear);
    drawTopRegistries(topRegistries);
  });

  function drawTopRegistries(topRegistries) {
    const $container = $('body > .container');
    $('<h4>Most used trademark registries by Finnish companies <small class="text-muted">in past two years</small></h4>').appendTo($container);
    $('<div/>').appendTo($container).highcharts({
      chart: {
        type: 'bar',
        height: 600
      },
      title: null,
      xAxis: {
        categories: _.map(topRegistries, 'name'),
        title: null
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      credits: false,
      series: [
        {
          name: 'Year 1800',
          data: _.map(topRegistries, 'doc_count')
        }
      ]
    });
  }

  function drawYearlyGraph(buckets) {
    /*
    const cumulativeData = _.reduce(buckets, (acc, {key, doc_count}) => {
      const count = acc.previousSum + doc_count;
      return {
        previousSum: count,
        buckets: [{x: key, y: count}].concat(acc.buckets)
      }
    }, {previousSum: 0, buckets: []});
    console.log(cumulativeData);
    */

    const $container = $('body > .container');
    $('<h4>Trademark applications by Finnish filers</h4>').appendTo($container);
    $('<div/>').appendTo($container).highcharts({
      chart: {
        zoomType: 'x',
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      credits: false,
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
          name: 'Foo',
          data: _.map(buckets, ({key, doc_count}) => {
            return {
              x: key,
              y: doc_count
            };
          })
        }
      ]
    });
  }

  function drawTopFilers(topFilers) {
    $('<h4>Biggest Finnish trademark filers <small class="text-muted">in past two years</small></h4>').appendTo($('body > .container'));
    const $container = $('<div/>').appendTo($('body > .container'));

    const words = _.map(topFilers, ({name, doc_count}) => ({
      text: name,//.replace(/ /gi, '<br/>'),
      score: doc_count
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
        attr("width", width + 200).
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

})();
