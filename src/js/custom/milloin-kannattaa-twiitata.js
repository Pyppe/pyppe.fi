$(function() {

  const {decimalFormat, integerFormat} = pyppe.util;
  const commonGraphConfig = {
    colors: ['#008833','#0054bc','#d84449','#ffce12','#0e365a','#17a794','#7d57c2','#605956'],
    title: { text: null },
    xAxis: {
      categories: _.map(_.range(24), hour => `${_.padStart(hour, 2, '0')}`),
      title: { text: null }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Retwiittejä / kellonaika'
      }
    },
    tooltip: {
      shared: true,
      headerFormat: '<b style="font-size: 120%">Kello {point.key}</b><br/>'
    },
    credits: {
      enabled: false
    }
  };

  const isWeekEnd = ({day}) => day === 'la' || day === 'su';
  const isWeekDay = bucket => !isWeekEnd(bucket);

  $.get(`/dist/resources/milloin-kannattaa-twiitata.json`, {h: pyppe.resourceHash}).then(buckets => {
    drawTotalsGraph($('#milloin-kannattaa-twiitata-totals-rt'), buckets, 'rtCount');
    drawDailyGraph($('#milloin-kannattaa-twiitata-daily-rt'), buckets, 'rtCount');

    drawTotalsGraph($('#milloin-kannattaa-twiitata-totals-original'), buckets, 'originalCount');
    drawDailyGraph($('#milloin-kannattaa-twiitata-daily-original'), buckets, 'originalCount');
  });

  function drawDailyGraph($container, buckets, countKey) {
    const days = _.uniq(_.map(buckets, 'day'));
    $container.highcharts({
      ...commonGraphConfig,
      chart: { type: 'line' },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      series: _.map(days, day => ({
        name: day,
        data: _.map(_.filter(buckets, {day}), countKey)
      }))
    });
  }

  function drawTotalsGraph($container, buckets, countKey) {
    function aggregateHours(items) {
      return _.map(_.range(24), hour => {
        const count = _.sumBy(_.filter(items, {hour}), countKey);
        return {hour, count};
      });
    }

    const [week, weekend] = _.map(
      _.partition(buckets, isWeekDay),
      aggregateHours
    );

    $container.highcharts({
      ...commonGraphConfig,
      chart: { type: 'column' },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      series: [
        {
          name: 'Arkipäivän retwiitit',
          data: _.map(week, 'count')
        },
        {
          name: 'Viikonlopun retwiitit',
          data: _.map(weekend, 'count')
        },
      ]
    });
  }

});
