$(() => {
  const {decimalFormat} = pyppe.util;
  const $container = $('#saunakallio-trains');

  const minutesDiff = (start, end) => moment.duration(start.diff(end)).asMinutes();
  const hoursDiff = (start, end) => moment.duration(start.diff(end)).asHours();
  const optionalMoment = (obj, field) => obj[field] ? moment(obj[field]) : undefined;
  const saunakallioCoords = [25.0677394, 60.4856386];

  const statusIcon = (color, icon, text) => (`
    <span style="color: ${color}">
      <i class="fa fa-lg fa-${icon}"></i> ${_.escape(text)}</span>
  `);

  function getDistanceFromLatLonInKm(coords1, coords2) {
    const deg2rad = deg => deg * (Math.PI/180);
    const R = 6371; // Radius of the earth in km
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;
    const dLat = deg2rad(lat2-lat1); // deg2rad below
    const dLon = deg2rad(lon2-lon1);
    var a = (
      Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    );
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  }

  function estimatedDistanceFromSaunakallio({timestamp, location, speed}) {
    const sinceTravelledDistance = Math.abs(
      hoursDiff(moment(timestamp), moment())
    ) * speed;

    return [getDistanceFromLatLonInKm(location.coordinates, saunakallioCoords), sinceTravelledDistance];
  }

  fetchAndShowTrains();

  function fetchAndShowTrains() {
    if ($container.find('> *:first').toArray().length === 0) {
      $('<i class="fa fa-spin fa-spinner fa-lg"></i>').appendTo($container);
    }
    $.get('https://rata.digitraffic.fi/api/v1/live-trains/station/RI?departed_trains=30').then(allTrains => {
      $container.html('');
      const trains = _.orderBy(
        _.flatMap(allTrains, ({commuterLineID, trainNumber, runningCurrently, timeTableRows}) => {
          if (commuterLineID === 'R') {
            const station = _.find(timeTableRows, {stationShortCode: 'SAU', type: 'DEPARTURE'});
            if (station && station.trainStopping) {
              const sau = _.findIndex(timeTableRows, {stationShortCode: 'SAU'});
              const jp = _.findIndex(timeTableRows, {stationShortCode: 'JP'});
              const isValidDirection = (sau >= 0 && jp >= 0 && sau < jp);
              const minutesAgo = minutesDiff(
                moment(),
                optionalMoment(station, 'actualTime') ||
                  optionalMoment(station, 'liveEstimateTime') ||
                  moment(station.scheduledTime)
              );
              return (isValidDirection && minutesAgo > -35 /*&& minutes < 90*/) ?
                [{...station, minutesAgo, commuterLineID, trainNumber, runningCurrently}]
                :
                [];
            } else {
              return [];
            }
          } else {
            return [];
          }
        }),
        ['scheduledTime'], ['desc']
      );
  
      const $table = $(`
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Aika</th>
              <th>Juna</th>
              <th style="white-space: nowrap">Etäisyys <small class="text-muted">Saunakalliosta</th>
              <th>Tilanne</th>
              <th>Lisätiedot</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `).appendTo($container)
  
      const $tbody = $table.find('tbody');
  
      _.forEach(trains, train => {
  
        if (train.notFound) {
          $('<tr><td>NOT FOUND</td></tr>').appendTo($tbody);
        } else {
          const scheduled = moment(train.scheduledTime);
          const accurate = optionalMoment(train, 'actualTime') || optionalMoment(train, 'liveEstimateTime');
          const time = (() => {
            if (accurate && Math.abs(minutesDiff(scheduled, accurate)) > 2) {
              return (`
                <span style="text-decoration: line-through;">${scheduled.format('HH:mm')}</span>
                &nbsp;&nbsp;
                <span style="color: red;">${accurate.format('HH:mm')}</span>
              `);
            } else {
              return scheduled.format('HH:mm');
            }
          })();
          const {commuterLineID, trainNumber, runningCurrently} = train;
          const tdStyle = `style="white-space: nowrap; opacity: ${_.has(train, 'actualTime') ? '0.5' : '1'};"`;
          $(`
            <tr>
              <td ${tdStyle}>${time}</td>
              <td ${tdStyle}>
                <div style="position: relative; display: inline-block;">
                  <i class="fa fa-circle fa-lg" style="color: #2A8EBF"></i>
                  <span style="position: absolute; color: white; left: 5px; top: 3px; font-size: 12px;">${commuterLineID}</span>
                </div>
              </td>
              <td ${tdStyle} ${runningCurrently ? `data-train-number=${trainNumber}` : ''}></td>
              <td style="white-space: nowrap">${
                train.cancelled ?
                  statusIcon('red', 'exclamation-circle', 'PERUTTU')
                  :
                  _.has(train, 'actualTime') ?
                  statusIcon('#f60', 'clock-o', 'Meni jo')
                    :
                    statusIcon('#083', 'check-circle', 'Matkalla')
              }</td>
              <td style="width: 75%"><pre>${_.escape(JSON.stringify(train.causes, null, 2))}</pre></td>
            </tr>
          `).appendTo($tbody);
        }
      });
  
      _.forEach($tbody.find('[data-train-number]').toArray(), el => {
        const $td = $(el);
        const trainNumber = $td.data('trainNumber');
        $.get(`https://rata.digitraffic.fi/api/v1/train-locations/latest/${trainNumber}`).then(res => {
          if (_.size(res) === 1) {
            const [distance, distanceDiff] = estimatedDistanceFromSaunakallio(_.head(res));
            $(`
              <div>
                ${decimalFormat(distance)}
                ${distanceDiff > 0.2 ? `<small class="text-muted">(±${decimalFormat(distanceDiff)})</small>` : ''}
                km
                <a href="https://junatkartalla.vr.fi/?train=${trainNumber}" target="_blank">
                  <small style="font-weight: 300">(kartta)</small>
                </a>
              </div>
            `).appendTo($td);
          }
        });
      });

      setTimeout(fetchAndShowTrains, 15 * 1000);
    });
  }

});