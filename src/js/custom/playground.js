(() => {
  $.get(`/dist/resources/4gstatus.json`, {h: pyppe.resourceHash}).then(res => {

    //moment.locale('en');

    const OneMinute = 60000;
    const GapLimit = OneMinute * 60;

    const data = _.chain(res).
      //filter(({time}) => time > Date.UTC(2017,4,1,13) && time < Date.UTC(2017,4,6,12)).
      filter(({time}) => time > Date.UTC(2017,4,14)).
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

})();
