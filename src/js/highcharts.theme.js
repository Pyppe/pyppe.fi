// http://www.highcharts.com/docs/chart-design-and-style/design-and-style
Highcharts.theme = {
  chart: {
    backgroundColor: null,
    spacingLeft: 1,
    spacingRight: 1,
    style: {
      fontFamily: "Raleway, sans-serif"
    }
  },
  tooltip: {
    backgroundColor: "rgba(255,255,255,1)",
  }
};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);