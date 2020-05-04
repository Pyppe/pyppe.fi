pyppe.fi
========

https://jekyllrb.com/docs/installation/macos/

```shell
gem install --user-install bundler compass jekyll jekyll-paginate
```

- `jekyll serve -w`
- `jekyll serve --host=0.0.0.0 --watch`
- `date -u +"%Y-%m-%dT%H:%M:%SZ"`

### TODO
- Maybe utilize https://github.com/pixelcog/parallax.js

### package.json
- graceful-fs https://github.com/nodejs/node/issues/20285#issuecomment-385299321

### Get twitter profile image
```javascript
_.flatMap(window.users, u => {
  const {screenName} = u.user;
  return [
    `rm ${screenName}.jpg`,
    `curl -L 'https://twitter.com/${screenName}/profile_image?size=bigger'| convert - ${screenName}.jpg`
  ];
}).join('\n');
```
```bash
curl -L 'https://twitter.com/PinnallaFI/profile_image?size=bigger'| convert - PinnallaFI.jpg
```

## Country stuff
- See https://gist.github.com/Pyppe/1b7e0a9536b9568b80c7d5099316a0e2

```
wget "http://kartat.kapsi.fi/files/kuntajako/kuntajako_4500k/etrs89/shp/TietoaKuntajaosta_2017_4500k.zip"
unzip TietoaKuntajaosta_2017_4500k.zip
ogr2ogr -f GeoJSON -t_srs crs:84 SuomenKuntajako_2017_4500k.geo.json SuomenKuntajako_2017_4500k.shp

# https://fi.wikipedia.org/wiki/Luettelo_Suomen_kunnista
// Kunta -> Maakunta
const mapping = _.reduce($('.wikitable.sortable.jquery-tablesorter tbody tr').toArray(), (acc, el) => {
  acc[$(el).find('td:eq(2)').text()] = $(el).find('td:eq(5)').text();
  return acc;
}, {});

// Update orginal GeoJSON
_.forEach(geoJson.features, f => {
  const name = f.properties.NAMEFIN;
  const parent = mapping[name];
  if (!parent) {
    throw `No parent found for ${name}`;
  }
  f.properties = { name, parent };
});
geoJson.features = _.sortBy(geoJson.features, f => f.properties.name);
```
