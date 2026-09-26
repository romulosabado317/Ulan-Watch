import React, { useMemo } from 'react';
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
  const html = useMemo(() => {
    const reportData = reports.map((report) => ({
      lat: Number(report.lat),
      lng: Number(report.lng),
      street: escapeHtml(report.street),
      note: escapeHtml(report.note),
      level: escapeHtml(report.waterLevel),
      tier: escapeHtml(report.tier?.label || 'Unverified')
    }));
    const pinData = pin ? { lat: Number(pin.latitude), lng: Number(pin.longitude) } : null;
    const region = JSON.stringify({
      lat: DEFAULT_REGION.latitude,
      lng: DEFAULT_REGION.longitude,
      zoom: 13
    });
    const reportsJson = JSON.stringify(reportData).replace(/</g, '\\u003c');
    const pinJson = JSON.stringify(pinData);

    return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0} .leaflet-control-attribution{font-size:9px}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var region = ${region};
  var map = L.map('map', { zoomControl: true }).setView([region.lat, region.lng], region.zoom);
  L.tileLayer('${TILE_URL}', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  var reports = ${reportsJson};
  reports.forEach(function (report) {
    if (!Number.isFinite(report.lat) || !Number.isFinite(report.lng)) return;
    var marker = L.circleMarker([report.lat, report.lng], { radius: report.tier === 'Verified' ? 10 : 8, color: '#102A43', weight: 2, fillColor: '#D97A2E', fillOpacity: 0.9 }).addTo(map);
    marker.bindPopup('<strong>' + report.street + '</strong><br>' + report.tier + '<br>' + report.level + (report.note ? '<br>' + report.note : ''));
  });
  var pin = ${pinJson};
  if (pin) L.marker([pin.lat, pin.lng]).addTo(map);
  map.on('click', function (event) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
  });
})();
</script></body></html>`;
  }, [reports, pin]);

  return (
    <WebView
      style={[styles.map, style]}
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
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
