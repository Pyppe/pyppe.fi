---
layout: post
post_language: fi
disqus: 52dbcff8047ed29225ffac96
title: "Wat, missä juna?"
date: 2012-06-04T00:11:00+03:00
categories: general
excerpt: |
  <p>Heikunkeikun, pimpelipompeli!</p>
  
  <p>Scala-blogiprojekti tuli valmiiksi tuossa päälle kuukausi sitten. Nyt tuli sitten näköjään tutustuttua <a href="http://nodejs.org/">Node.js</a>:ään, <a href="http://jquerymobile.com/">jQuery Mobileen</a> ja <a href="http://www.heroku.com/">Herokuun</a>.</p>
  
  <p><strong>Lapsukaiset...</strong> oikein arvasitte! Tämä on epäeeppinen kertomus yhden koodisankarin koettelemuksista kohti käytettävää mobiilipalvelua.</p>
---
<p>Heikunkeikun, pimpelipompeli!</p>

<p>Scala-blogiprojekti tuli valmiiksi tuossa päälle kuukausi sitten. Nyt tuli sitten näköjään tutustuttua <a href="http://nodejs.org/">Node.js</a>:ään, <a href="http://jquerymobile.com/">jQuery Mobileen</a> ja <a href="http://www.heroku.com/">Herokuun</a>.</p>

<p><strong>Lapsukaiset...</strong> oikein arvasitte! Tämä on epäeeppinen kertomus yhden koodisankarin koettelemuksista kohti käytettävää mobiilipalvelua.</p>

@@IMAGE_COLLAGE()@@

<h2>Kivi ja kuokka</h2>

<p>Tarina alkaa, kun Jussi, hyvä ystäväni sekä sormikoukkuyhdistyksemme varapuheenjohtaja, oli väsyneenä matkalla kohti kotiaan. Aseenaan VR:n käytettävyyden riemujamboree <a href="http://m.vr.fi/">m.vr.fi</a> Jussi ei koskaan löytänyt kotiin...</p>

<p>Jotta Jussin kohtalo ei koituisi muille kohtaloksi, kohtalo ohjasi minut kohti projektia, jonka kohtaloksi muodostui tarjota mobiilisofta junien aikatauluhakua varten.</p>

<h2>Node.js</h2>

<p>Node.js:n non-blocking I/O -malli sopii kuin lerssi lehtoon proxy-tyyppiseksi kevyeksi palvelimeksi aikatauluhakuja varten. Käydäänpä lyhyesti läpi, minkälaiseksi node.js-moduulikasa loppujen lopuksi muodostui:</p>

<table class="table table-striped">
  <thead>
    <tr>
      <th>Moduuli</th>
      <th>Kuvaus</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="http://expressjs.com/">Express</a></td>
      <td>Pikaisen <a href="https://www.google.com/search?q=node.js+web+framework">Googletuksen</a> jälkeen päädyin rakentamaan palvelun Express-nimisen frameworkin päälle.</td>
    </tr>
    <tr>
      <td><a href="http://handlebarsjs.com/">handlebars</a></td>
      <td>Oletuksena Express käyttää <a href="https://github.com/visionmedia/jade">Jade</a> template-engineä. Minua Jaden lähestymistapa ei erityisesti viehättänyt, joten vaihdoin template-engineksi handlebarsin (Express ei suoraan osaa käyttää Handlebarsia, mutta onneksi Internetin Ihmeellisestä Maailmasta löytyy valmis <a href="https://github.com/donpark/hbs">hbs-moduuli</a> tätä varten).</td>
    </tr>
    <tr>
      <td><a href="http://tomg.co/gzippo">gzippo</a></td>
      <td>Olin hieman yllättynyt, kun en löytänyt mitään defacto-ratkaisua tekstipohjaisten HTTP-vastausten gzippaukseen. gzippo kuitenkin toimii Express-kehyksen kanssa erittäin hyvin yhteen, vaikka ei mitenkään kovin viralliselta tahi kypsältä moduulilta muuten vaikuttanutkaan.</td>
    </tr>
    <tr>
      <td><a href="https://github.com/Cowboy-coder/bundle-up">bundle-up</a></td>
      <td>Bundle-up on kirjasto assettien (JS/CSS) pakkaukseen ja organisointiin. Bundle-up toimii juuri siten kuten pitääkin. Kehitysaikana JS/CSS-tiedostoja ei pakata ja ne palvellaan yksitellen. Tuotannossa sen sijaan kaikki JS-tiedostot ja CSS-tiedostot pakataan ja minifioidaan yhdeksi tiiviiksi tiedostoksi.</td>
    </tr>
    <tr>
      <td><a href="https://github.com/tmpvar/jsdom">jsdom</a></td>
      <td>Jsdom on aivan loistava kirjasto datan parsimiseen jQueryn avulla palvelinpäässä.</td>
    </tr>
    <tr>
      <td><a href="https://github.com/danwrong/restler">restler</a></td>
      <td>Restler on HTTP-client kirjasto, joka tarjoaa sopivan abstraktiotason HTTP-kutsujen tekemiseen. Itse käytän sitä erityisesti HTTP-postien yhteydessä.</td>
    </tr>
    <tr>
      <td><a href="http://momentjs.com/">Moment.js</a></td>
      <td>Moment.js on kalenteri- ja aikamanipulointiin soveltuva kirjasto.</td>
    </tr>
  </tbody>
</table>

<h2>Helppokäyttöisen API:n kautta asiaan</h2>

<p>Asia selvä. Backend-stack on siis kasassa. Ensimmäinen askel oli tutustua VR:n tarjoamaan moderniin haku-"API":iin. Kulahtaneista standardeista poiketen API ei ole JSON-pohjainen, vaan perustuu vieläkin varma- ja helppotoimisempaan HTML-standardiin. Otetaan esimerkki API:n tarjoamasta datasta:</p>

@@START_CODE(html)@@
&lt;div class="resultsep"&gt;
  &lt;span class="boldText"&gt;19:42&amp;nbsp;Siuntio&amp;nbsp;&lt;/span&gt;
  &amp;nbsp;-&amp;nbsp;20:23&amp;nbsp;Pasila,&amp;nbsp;Lähijuna&amp;nbsp;
  &lt;div class="trainchange"&gt;20:36&amp;nbsp;Pasila&amp;nbsp;&amp;nbsp;-&amp;nbsp;
    &lt;span class="boldText"&gt;21:02&amp;nbsp;Korso,&amp;nbsp;&lt;/span&gt;Lähijuna&amp;nbsp;
  &lt;/div&gt;
  &lt;div class="trainchange"&gt;Vaihtoja 1,&amp;nbsp;kesto&amp;nbsp;1:20.&lt;/div&gt;
&lt;/div&gt;
@@END_CODE()@@

<p>Noniin, eli hommahan olikin jo käytännössä tehty. Karkea esimerkki Node.js-koodista, joka toimii proxynä ja muokkaa HTML-pohjaisesta vastauksesta rakenteisen JSON-vastauksen client-kirjastoa (jQuery Mobile) varten:</p>

@@START_CODE(javascript)@@
// app.js
app.post('/schedule', function(request, response) {
  try {
    schedule.find(request, response);
  } catch (err) {
    utils.log('Caught exception: %s\nGiving error response...', err.stack);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({}), "utf8");
  }
});

// schedule.js
exports.find = function(request, apiResponse) {
  var params = request.body;
  var searchData = {
    dateDay: params.date.substring(0,2),
    dateMonth: params.date.substring(3,5),
    dateYear: params.date.substring(6),
    from: params.fromCity,
    timeHours: params.time.substring(0,2),
    timeMinutes: params.time.substring(3,5),
    timeType: 1, // VR tarjoaa valinnan lähtö-/tuloajalle, mutta todellisuudessa tämä valinta ei tee yhtään mitään
    to: params.toCity
  };
  utils.log("Searching from %s to %s", searchData.from, searchData.to);
  // Eli tässä käytämme restler-kirjastoa, ja teemme varsinaisen kutsun, jolla saamme ehdotukset junayhteyksistä määritellyillä hakuehdoilla
  rest.post(postUrl, {
    data: searchData
  }).on('complete', function(data, response) {
      // Parsimme hellokäyttöisestä HTML-"API":sta vastauksen ja teemme siitä JSON-vastauksen
      jsdom.env(data, ['http://code.jquery.com/jquery-1.7.2.min.js'], function(errors, window) {
        var $ = window.$;
        var jsonResponse = parseSuggestionsUsingJQuery($);
        apiResponse.writeHead(200, { 'Content-Type': 'application/json' });
        apiResponse.end(jsonResponse, "utf8");
      });
    });
};
@@END_CODE()@@

<h2>jQuery Mobile</h2>

<p>Kun Node.js-palvelin oli saatu pystyyn, olikin aika siirtyä client-pään koodiin. Itse asiassa aluksi harkitsin tekeväni Android-sovelluksen aikatauluhausta, mutta hetken aikaa pähkäiltyäni päätinkin tehdä HTML5-pohjaisen ratkaisun, koska se toimisi periaatteessa kaikissa puhelimissa. Varsin lyhyen tutkailun jälkeen valitsin <a href="http://jquerymobile.com/">jQuery Mobilen</a> lähinnä mutu-tuntumalla (tutkin pikaisesti myös <a href="http://www.jqtouch.com/">jQTouchia</a> ja <a href="http://www.sencha.com/products/touch">Sensa Touchia</a>). Suurin syy valmiin frameworkin käyttöön oli se, että en jaksanut ruveta säätämään sovellukseni tyylin, ulkoasun tai skaalauksen (näytölle) kanssa.</p>

<p>Kaiken kaikkiaan olen ihan tyytyväinen valintaan. Sain melko pienellä vaivalla tehtyä ulkonäöltään varsin siistin pikku sovelluksen. Olennaisimpina parannuksina VR:n omaan hakuun näkisin seuraavat seikat:</p>

<p>
<ul>
  <li>Se näyttää siltä, että se on tehty tällä vuosituhannella.</li>
  <li>Ensimmäinen sivulataus on isompi/hitaampi, mutta tämän jälkeen kaikki toimii huomattavasti nopeammin, koska koko sivua ei haeta uudestaan (ainoastaan hakudata JSON-muodossa).</li>
  <li>Palvelu muistaa käyttäjän tekemät haut, ja niiden valinta uudestaan on nopeaa.</li>
  <li>Datepicker helpottaa oikean päivän valintaa.</li>
  <li>Palvelu tukee haun jatkamista seuraavalle päivälle vuorokauden vaihtuessa.</li>
</ul>
</p>


<h2>Ihana Heroku</h2>

<p>Jäljellä oli enää palvelu hostaus. Valinta oli helppo: pikainen <a href="https://www.google.com/search?q=node.js+heroku">Googletus</a>, jonka jälkeen palvelu pyörikin jo <a href="http://www.heroku.com/">Herokun</a> pilvessä. Ilmaiseksi. On se helppoa. :)</p>

<h2>Palvelun laillisuus?</h2>

<p>Yritin metsästää tietoa siitä, kuinka laillinen tällainen proxy-tyyppinen palvelu on. Tekemäni sivustohan ei siis tallenna tietoa mitenkään. Se ainoastaan lukee sitä julkiselta sivustolta, ja muokkaa sitä eri (lue: parempaan) muotoon. Ainoa syy sen olemassaoloon on se, että en koe VR:n oman palvelun erityisesti palvelevan käyttötarpeitani. Arvon VR, jos näette tässä jotain väärää, niin ottakaa toki yhteyttä... junankäyttäjien yhteisellä asiallahan tässä ollaan. :)</p>

<h2>Sanavagan, missä se on?!</h2>

<p>No härregud, sehän löytyy osoitteesta <a style="font-size: 30px;" href="http://www.junat.info/">www.junat.info</a>.