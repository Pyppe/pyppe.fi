// http://www.highcharts.com/docs/chart-design-and-style/design-and-style
Highcharts.theme = {
  chart: {
    //backgroundColor: null,
    backgroundColor: {
        linearGradient: {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 1
        },
        stops: [
            [0, '#5ebd9a'],
            [1, '#234639']
        ]
    },
    spacingLeft: 10,
    spacingRight: 1,
    plotBorderWidth: 0,
    plotBorderColor: 'transparent',
    //plotBackgroundColor: 'transparent',
    style: {
      fontFamily: "Raleway, sans-serif"
    }
  },
  xAxis: {
    labels: {
      style: {
        color: 'transparent'
      }
    },
    gridLineColor: 'transparent',
    lineColor: 'transparent',
    minorGridLineColor: 'transparent',
    tickColor: 'transparent'
  },
  yAxis: {
    labels: {
      style: {
        color: 'transparent'
      }
    },
    gridLineColor: 'transparent',
    lineColor: 'transparent',
    minorGridLineColor: 'transparent',
    tickColor: 'transparent'
  }
};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);
