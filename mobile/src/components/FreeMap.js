import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { DEFAULT_REGION } from '../theme';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

export default function FreeMap({ reports = [], pin, onPress, style }) {
  const webViewRef = useRef(null);
  const mapReady = useRef(false);
  const reportData = useMemo(() => reports.map((report) => ({
    lat: Number(report.lat),
    lng: Number(report.lng),
    street: escapeHtml(report.street),
    note: escapeHtml(report.note),
    level: escapeHtml(report.waterLevel),
    tier: escapeHtml(report.tier?.label || 'Unverified')
  })), [reports]);
  const pinData = useMemo(() => pin ? { lat: Number(pin.latitude), lng: Number(pin.longitude) } : null, [pin]);
  const mapDataScript = useMemo(() => {
    const reportsJson = JSON.stringify(reportData).replace(/</g, '\\u003c');
    const pinJson = JSON.stringify(pinData);
    return 'window.updateMapData(' + reportsJson + ',' + pinJson + '); true;';
  }, [reportData, pinData]);

  useEffect(() => {
    if (mapReady.current) webViewRef.current?.injectJavaScript(mapDataScript);
  }, [mapDataScript]);

  const html = useMemo(() => {
    const region = JSON.stringify({
      lat: DEFAULT_REGION.latitude,
      lng: DEFAULT_REGION.longitude,
      zoom: 13
    });

    return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html,body,#map{height:100%;margin:0}
.leaflet-control-attribution{font-size:9px}
.leaflet-top.leaflet-right{top:42px}
.leaflet-control-zoom a{color:#102A43!important}
.city-control{background:#fff;border:0;border-radius:7px;color:#102A43;font:600 12px system-ui;padding:8px 10px;box-shadow:0 1px 5px #102a4333}
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var region = ${region};
  var map = L.map('map', { zoomControl: false }).setView([region.lat, region.lng], region.zoom);
  L.control.zoom({ position: 'topright' }).addTo(map);
  var cityControl = L.control({ position: 'topright' });
  cityControl.onAdd = function () {
    var button = L.DomUtil.create('button', 'city-control');
    button.type = 'button';
    button.textContent = 'Antipolo City';
    button.title = 'Center map on Antipolo City';
    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.on(button, 'click', function () { map.setView([region.lat, region.lng], region.zoom); });
    return button;
  };
  cityControl.addTo(map);
  L.tileLayer('${TILE_URL}', { maxZoom: 19, detectRetina: true, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  var levelColors = { ankle: '#E3A83B', knee: '#D97A2E', waist: '#C1443C', chest: '#6B1F26' };
  var reportLayer = L.layerGroup().addTo(map);
  var pinMarker = null;
  window.updateMapData = function (reports, pin) {
    reportLayer.clearLayers();
    reports.forEach(function (report) {
      if (!Number.isFinite(report.lat) || !Number.isFinite(report.lng)) return;
      var marker = L.circleMarker([report.lat, report.lng], { radius: report.tier === 'Verified' ? 10 : 8, color: '#102A43', weight: 2, fillColor: levelColors[report.level] || '#D97A2E', fillOpacity: 0.9 }).addTo(reportLayer);
      marker.bindPopup('<strong>' + report.street + '</strong><br>' + report.tier + '<br>' + report.level + (report.note ? '<br>' + report.note : ''));
    });
    if (pinMarker) map.removeLayer(pinMarker);
    pinMarker = pin ? L.marker([pin.lat, pin.lng]).addTo(map) : null;
  };
  map.on('click', function (event) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
  });
})();
</script></body></html>`;
  }, []);

  return (
    <WebView
      ref={webViewRef}
      style={[styles.map, style]}
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      onLoadEnd={() => {
        mapReady.current = true;
        webViewRef.current?.injectJavaScript(mapDataScript);
      }}
      onMessage={(event) => {
        try {
          onPress?.(JSON.parse(event.nativeEvent.data));
        } catch {
          // Ignore malformed map messages.
        }
      }}
    />
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
