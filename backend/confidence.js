const CLUSTER_METERS = 250;
const ACTIVE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isActive(report) {
  return report.status === 'active' && Date.now() - report.createdAt < ACTIVE_WINDOW_MS;
}

function tierFor(report, activePool) {
  const reporters = new Set([report.reporterId]);
  activePool.forEach((other) => {
    if (other.id === report.id) return;
    const d = haversine(report.lat, report.lng, other.lat, other.lng);
    if (d <= CLUSTER_METERS) reporters.add(other.reporterId);
  });
  const count = reporters.size;
  if (count >= 3) return { id: 'verified', label: 'Verified', count };
  if (count === 2) return { id: 'likely', label: 'Likely', count };
  return { id: 'unverified', label: 'Unverified', count };
}

function annotateReports(reports) {
  const active = reports.filter(isActive);
  return reports.map((r) => {
    if (r.status !== 'active') {
      return { ...r, tier: { id: r.status, label: r.status === 'resolved' ? 'Resolved' : 'Flagged', count: 0 } };
    }
    if (!isActive(r)) {
      return { ...r, tier: { id: 'expired', label: 'Expired', count: 0 } };
    }
    return { ...r, tier: tierFor(r, active) };
  });
}

module.exports = { haversine, isActive, tierFor, annotateReports, CLUSTER_METERS, ACTIVE_WINDOW_MS };
