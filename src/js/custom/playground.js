(() => {

  moment.locale('fi');

  function formatDuration(ms) {
    const secs = ms / 1000;
    if (secs < 60) {
      return `${Math.round(secs)} s`;
    }
    const minutes = secs / 60;
    if (minutes < 120) {
      return `${Math.round(minutes)} min`;
    }
    const hours = minutes / 60;
    if (hours < 24) {
      return `${Math.round(hours * 10) / 10} h`.replace('.', ',');
    }
    const days = hours / 24;
    return `${Math.round(days * 10) / 10} days`.replace('.', ',');
  }

  function drawRetweetDurationChart() {
    //const quotedRts = [[0,4000],[1,73000],[2,109000],[3,144000],[4,180000],[5,217000],[6,257000],[7,300000],[8,347000],[9,397000],[10,453000],[11,512000],[12,580000],[13,652000],[14,731000],[15,816000],[16,906000],[17,1010000],[18,1121000],[19,1242000],[20,1377000],[21,1521000],[22,1678000],[23,1851000],[24,2034000],[25,2233000],[26,2439000],[27,2665000],[28,2900000],[29,3157000],[30,3431000],[31,3719000],[32,4024000],[33,4345000],[34,4699000],[35,5067000],[36,5445000],[37,5859000],[38,6302000],[39,6756000],[40,7236000],[41,7762000],[42,8312000],[43,8896000],[44,9516000],[45,10184000],[46,10878000],[47,11635000],[48,12459000],[49,13318000],[50,14242000],[51,15204000],[52,16271000],[53,17443000],[54,18676000],[55,19951000],[56,21383000],[57,22888000],[58,24475000],[59,26204000],[60,28041000],[61,29933000],[62,31957000],[63,34054000],[64,36320000],[65,38635000],[66,41069000],[67,43661000],[68,46490000],[69,49382000],[70,52527000],[71,55699000],[72,59010000],[73,62350000],[74,65612000],[75,68825000],[76,71781000],[77,74797000],[78,77866000],[79,80805000],[80,83712000],[81,86569000],[82,89893000],[83,94072000],[84,99030000],[85,105757000],[86,114446000],[87,125763000],[88,139044000],[89,155460000],[90,170058000],[91,188572000],[92,228699000],[93,268828000],[94,343815000],[95,447374000],[96,638645000],[97,1104149000],[98,2522653000],[99,11779931000],[100,369568838000]];
    //const normalRts = [[0,0],[1,27000],[2,43000],[3,61000],[4,81000],[5,105000],[6,131000],[7,161000],[8,194000],[9,231000],[10,273000],[11,319000],[12,370000],[13,426000],[14,488000],[15,557000],[16,633000],[17,716000],[18,807000],[19,907000],[20,1015000],[21,1133000],[22,1264000],[23,1405000],[24,1555000],[25,1716000],[26,1891000],[27,2080000],[28,2278000],[29,2491000],[30,2717000],[31,2960000],[32,3219000],[33,3486000],[34,3774000],[35,4082000],[36,4405000],[37,4745000],[38,5099000],[39,5479000],[40,5877000],[41,6298000],[42,6744000],[43,7209000],[44,7707000],[45,8230000],[46,8788000],[47,9377000],[48,9999000],[49,10662000],[50,11376000],[51,12144000],[52,12944000],[53,13792000],[54,14699000],[55,15674000],[56,16704000],[57,17806000],[58,18986000],[59,20251000],[60,21579000],[61,23026000],[62,24532000],[63,26140000],[64,27809000],[65,29572000],[66,31396000],[67,33314000],[68,35302000],[69,37381000],[70,39601000],[71,41924000],[72,44419000],[73,47046000],[74,49887000],[75,53016000],[76,56330000],[77,59755000],[78,63180000],[79,66567000],[80,69837000],[81,73112000],[82,76394000],[83,79673000],[84,82855000],[85,86134000],[86,90297000],[87,95800000],[88,103012000],[89,112847000],[90,125923000],[91,144082000],[92,163619000],[93,188739000],[94,248222000],[95,337024000],[96,517867000],[97,1112065000],[98,4865251000],[99,36765439000],[100,338289712000]];
    const retweets = [[0,0],[1,30000],[2,49000],[3,69000],[4,93000],[5,119000],[6,148000],[7,181000],[8,216000],[9,256000],[10,300000],[11,349000],[12,402000],[13,461000],[14,526000],[15,598000],[16,677000],[17,764000],[18,857000],[19,960000],[20,1072000],[21,1195000],[22,1329000],[23,1474000],[24,1628000],[25,1796000],[26,1978000],[27,2170000],[28,2375000],[29,2594000],[30,2827000],[31,3080000],[32,3344000],[33,3619000],[34,3918000],[35,4233000],[36,4566000],[37,4917000],[38,5283000],[39,5674000],[40,6084000],[41,6519000],[42,6979000],[43,7464000],[44,7979000],[45,8524000],[46,9101000],[47,9714000],[48,10362000],[49,11053000],[50,11807000],[51,12601000],[52,13435000],[53,14322000],[54,15277000],[55,16290000],[56,17380000],[57,18533000],[58,19775000],[59,21106000],[60,22526000],[61,24014000],[62,25611000],[63,27282000],[64,29037000],[65,30865000],[66,32784000],[67,34777000],[68,36888000],[69,39090000],[70,41416000],[71,43879000],[72,46526000],[73,49356000],[74,52430000],[75,55699000],[76,59102000],[77,62498000],[78,65867000],[79,69141000],[80,72378000],[81,75584000],[82,78839000],[83,81985000],[84,85165000],[85,88774000],[86,93600000],[87,99729000],[88,108029000],[89,119146000],[90,133896000],[91,152844000],[92,171043000],[93,202485000],[94,261111000],[95,354750000],[96,540742000],[97,1110264000],[98,4185670000],[99,31529303000],[100,369568838000]];
    const percentiles = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

    const pickPercentiles = (data) =>_.map(percentiles, p => data[p][1]);

    $('<div/>').appendTo($('#playground-dna')).highcharts({
      chart: {
        type: 'column'
      },
      colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
      title: {
        text: null
      },
      xAxis: {
        categories: _.map(percentiles, p => `${p}%`),
        title: {
          text: 'Percentile',
          //enabled: false
        }
      },
      yAxis: {
        type: 'logarithmic',
        title: {
          text: 'Time since original tweet'
        },
        labels: {
          style: {
            fontSize: '14px',
            fontWeight: '400',
          },
          formatter() {
            return formatDuration(this.value);
          }
        }
      },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y:,.0f} millions)<br/>',
        split: true
      },
      plotOptions: {
        series: {
          dataLabels: {
            style: {
              fontSize: '14px',
              fontWeight: '400',
            },
            enabled: true,
            formatter() {
              return formatDuration(this.y);
            }
          }
        }
      },
      series: [
        {
          name: 'Retweets',
          data: pickPercentiles(retweets)
        }
      ]
    });
  }

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

  //drawBotChart();
  drawRetweetDurationChart();

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
