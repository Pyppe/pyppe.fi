---
layout: post
language: fi
disqus: 52dbcff7047ed29225ffac93
title: "Android skodausta"
date: 2010-11-26T20:40:00+02:00
categories: general
excerpt: |
  <p>Hiiohoi, kullannuput!</p>
  
  <p>Allekirjoittanut on koodaillut salaa timantin tiukkaa Android-looppia. Aiight!</p>
  
  <p>Pari kuukautta sitten näpräilin <a href="http://code.google.com/p/pyppegps/">PyppeGPS</a> -mokkulan. Ohjelma käyttää puhelimen paikannustietoja (network/gps) ja tallentaa niitä KML-formaatin mukaiseen muotoon. Tallennettuja reittejä voi katsoa puhelimella kartasta ja lähettää niitä palvelimelle katseltavaksi Google Mapsista.</p>
  
  <p>Tänään koodasin <a href="http://www.kuntokanta.net/">Kuntokantaan</a> Android-sovelluksen, jolla voi tallentaa treenejä/muuta dataa helposti suoraan puhelimesta. Ohjelma on ladattavista <a href="http://www.kuntokanta.net/files/android_kuntokanta.apk">täältä</a> (koko 71 Kt).</p>
---
<p>Hiiohoi, kullannuput!</p>

<p>Allekirjoittanut on koodaillut salaa timantin tiukkaa Android-looppia. Aiight!</p>

<p>Pari kuukautta sitten näpräilin <a href="http://code.google.com/p/pyppegps/">PyppeGPS</a> -mokkulan. Ohjelma käyttää puhelimen paikannustietoja (network/gps) ja tallentaa niitä KML-formaatin mukaiseen muotoon. Tallennettuja reittejä voi katsoa puhelimella kartasta ja lähettää niitä palvelimelle katseltavaksi Google Mapsista.</p>

@@YOUTUBE(lziQ0V19BfA|style:right)@@

<p>Ohessa video, jolla osallistuin em. tekeleellä työnantajani järjestämään ohjelmointikilpaan.</p>

<p>Tänään koodasin <a href="http://www.kuntokanta.net/">Kuntokantaan</a> Android-sovelluksen, jolla voi tallentaa treenejä/muuta dataa helposti suoraan puhelimesta. Ohjelma on ladattavista <a href="http://www.kuntokanta.net/files/android_kuntokanta.apk">täältä</a> (koko 71 Kt).</p>

<p>Täytyy sanoa, että Java-ohjelmoijalle <a href="http://developer.android.com/sdk/index.html">Android SDK:n</a> <acronym title="Application Programming Interface">API</acronym>:t ovat erittäin intuitiivisia, ja alkuun pääsee todella nopeasti. Esimerkiksi HTTP-kutsuihin <acronym title="Software Development Kit">SDK</acronym>:ssa on mukana Apachen tuttu ja turvallinen <a href="http://hc.apache.org/httpcomponents-client-ga/index.html">HttpClient</a>, jolla kommunikointi taustapalvelimen kanssa on erittäin helppoa. Tässä lyhyt esimerkki:</p>

<div style="clear:both;"></div>
@@START_CODE(java)@@
public static BackendResponse addWeight(String date, String weight) {
  HttpPost post = new HttpPost(ADD_WEIGHT_URL);
  List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>(2);
  nameValuePairs.add(new BasicNameValuePair("date", date));
  nameValuePairs.add(new BasicNameValuePair("weight", weight));

  try {
    post.setEntity(new UrlEncodedFormEntity(nameValuePairs, HTTP.UTF_8));
    HttpResponse response = HTTPManager.execute(post);
    int httpResponseCode = response.getStatusLine().getStatusCode();
    if (httpResponseCode != 200) {
      return new BackendResponse(BackendResponseType.ERROR, INVALID_RESPONSE + httpResponseCode);
    }
    String content = CommonUtilities.convertStreamToString(response.getEntity().getContent());
    response.getEntity().consumeContent();
    return getBackendResponse(content);
  } catch (Exception e) {
    return new BackendResponse(BackendResponseType.ERROR, INTERNAL_ERROR);
  }
}

private static BackendResponse getBackendResponse(String jsonContent) throws JSONException {
  JSONObject json = new JSONObject(jsonContent);
  if (!json.isNull("ok")) {
    return new BackendResponse(BackendResponseType.OK, json.getString("ok"));
  } else {
    if (!json.isNull("error")) {
      return new BackendResponse(BackendResponseType.ERROR, json.getString("error"));
    } else {
      return new BackendResponse(BackendResponseType.ERROR, "");
    }
  }
}@@END_CODE()@@

<p>Java-lähdekoodia sovellus sisältää 1700 riviä, ja XML-"lähdekoodia" 370 riviä (Android-sovelluksessa monet UI-näkymät voidaan konfiguroida XML:llä). Eipä tule ikävä J2ME- / Symbian-koodausta. o_O</p>

<p>Tässäpä vielä muutama kuva Kuntokanta-sovelluksesta:</p>

@@IMAGE_COLLAGE()@@