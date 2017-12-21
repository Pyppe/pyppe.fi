$(() => {
  // http://bl.ocks.org/enjalot/0d87f32a1ccb9a720d29ba74142ba365
  // http://bl.ocks.org/zross/6a31f4ef9e778d94c204
  // https://www.mapbox.com/mapbox-gl-js/example/animate-point-along-line/
  const $container = $('#finnish-train-traffic-visualization');
  const mapId = 'finnish-train-traffic-visualization-map';
  //$container.css({height: 500 + 'px'});
  mapboxgl.accessToken = 'pk.eyJ1IjoicHlwcGUiLCJhIjoiY2piZ2doYzhwMDc4NTMzb2I4dzRqbDR5OCJ9.3IYE10bOwV66-XhxHbFo-Q';
  const map = new mapboxgl.Map({
    container: mapId,
    style: 'mapbox://styles/pyppe/cjbgh1kqubwla2slk170tj9p1',
    center: [25, 62.5],
    zoom: 5.5,
    pitch: 60
  });
  window.map = map;
  $('body').css('overflow', 'hidden');



  const createColorPalette = palette => {
    let runningIndex = 0;
    const cache = {};
    return term => {
      const idx = _.has(cache, term) ? cache[term] : (() => {
        cache[term] = runningIndex++;
        return cache[term];
      })();
      return palette[idx % palette.length];
    };
  };

  const trainColor = createColorPalette(d3.schemeCategory20);

  d3.csv(`/dist/resources/finnish-trains.csv?h=${pyppe.resourceHash}`, data => {
    animateTrains(data);
  });

  const trainData = ({lon, lat}) => ({ type: 'Point', coordinates: [lon, lat] });

  function animateTrains(rows) {
    //window.rows = rows;

    const $time = $('<div class="time" />').appendTo($('#' + mapId));

    map.on('load', function () {
      // {id, time, kmh, lon, lat}

      let previousTime = 0;
      const updateThreshold = 60 * 15;
      const maxSpeed = 224;
      const scaledOpacity = d3.scalePow().domain([0, maxSpeed]).range([0.3, 0.8]);

      function animate(index) {
        const train = _.get(rows, index);
        if (train) {
          const {id, kmh, time} = train;
          $time.text(time);
          const speed = Math.min(parseInt(kmh, 10), maxSpeed);
          const circleRadius = Math.max(speed/20, 1);
          const circleOpacity = scaledOpacity(speed);
          if (!map.getSource(id)) {
            map.addSource(id, {
              type: 'geojson', data: trainData(train)
            });
            map.addLayer({
              id,
              source: id,
              type: 'circle',
              paint: {
                'circle-radius'  : circleRadius,
                'circle-color'   : trainColor(id),
                'circle-opacity' : circleOpacity,
              }
            });
          } else {
            map.getSource(id).setData(trainData(train));
            map.setPaintProperty(id, 'circle-radius', circleRadius);
            map.setPaintProperty(id, 'circle-opacity', circleOpacity);
          }
          if (train.time !== previousTime) {
            previousTime = train.time;
            requestAnimationFrame(() => animate(index + 1));
          } else {
            previousTime = train.time;
            animate(index + 1);
          }
        }
      }
      animate(0);
    });
  }


});