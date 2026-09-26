import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import FreeMap from '../components/FreeMap';
import { COLORS, levelInfo } from '../theme';
import { haversine, timeAgo, uid } from '../utils/haversine';

export default function AlertsScreen({ reports, profile, onProfileChange }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const nearby = useMemo(() => {
    const active = reports.filter((r) => r.status === 'active');
    const alerts = [];
    active.forEach((r) => {
      (profile.savedLocations || []).forEach((loc) => {
        const d = haversine(r.lat, r.lng, loc.lat, loc.lng);
        if (d <= loc.radius) alerts.push({ report: r, location: loc, distance: Math.round(d) });
      });
    });
    alerts.sort((a, b) => b.report.createdAt - a.report.createdAt);
    return alerts;
  }, [reports, profile.savedLocations]);

  function removeLocation(id) {
    const updated = { ...profile, savedLocations: profile.savedLocations.filter((l) => l.id !== id) };
    onProfileChange(updated);
  }

  function saveLocation() {
    if (!label.trim() || !pin) {
      setError('Set a point on the map and give it a label.');
      return;
    }
    const updated = {
      ...profile,
      savedLocations: [
        ...(profile.savedLocations || []),
        { id: uid(), label: label.trim(), lat: pin.latitude, lng: pin.longitude, radius: 500 }
      ]
    };
    onProfileChange(updated);
    setModalVisible(false);
    setPin(null);
    setLabel('');
    setError('');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Text style={styles.sectionTitle}>Saved locations</Text>
      {(profile.savedLocations || []).length === 0 ? (
        <Text style={styles.empty}>No saved locations yet. Add your home or usual route to get nearby alerts.</Text>
      ) : (
        profile.savedLocations.map((loc) => (
          <View key={loc.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{loc.label}</Text>
              <Text style={styles.rowSub}>Alerts within {loc.radius}m</Text>
            </View>
            <TouchableOpacity onPress={() => removeLocation(loc.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add a saved location</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Recent alerts near you</Text>
      {nearby.length === 0 ? (
        <Text style={styles.empty}>No active flood reports near your saved locations right now.</Text>
      ) : (
        nearby.map((a, idx) => {
          const lvl = levelInfo(a.report.waterLevel);
          return (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{a.report.street}</Text>
              <Text style={styles.cardSub}>
                {a.distance}m from "{a.location.label}" · {timeAgo(a.report.createdAt)}
              </Text>
              <View style={[styles.levelBadge, { backgroundColor: lvl.color + '22' }]}>
                <Text style={{ color: lvl.color, fontSize: 11, fontWeight: '600' }}>{lvl.label}</Text>
              </View>
            </View>
          );
        })
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add saved location</Text>
            <Text style={styles.modalHint}>Tap the map to set the point, then name it.</Text>
            <FreeMap style={styles.modalMap} pin={pin} onPress={setPin} />
            <Text style={styles.label}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Home, Mom's house"
              placeholderTextColor={COLORS.muted}
              value={label}
              onChangeText={setLabel}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setPin(null);
                  setLabel('');
                  setError('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveLocation}>
                <Text style={styles.saveText}>Save location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mist },
  sectionTitle: { fontSize: 13, color: COLORS.muted, marginBottom: 10 },
  empty: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  rowTitle: { fontSize: 13.5, color: COLORS.ink, fontWeight: '600' },
  rowSub: { fontSize: 11.5, color: COLORS.muted, marginTop: 2 },
  removeText: { color: COLORS.danger, fontSize: 12 },
  addBtn: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.paper
  },
  addBtnText: { color: COLORS.tealDark, fontWeight: '600', fontSize: 13.5 },
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.ink },
  cardSub: { fontSize: 12, color: COLORS.muted, marginTop: 2, marginBottom: 8 },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14,42,61,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 4 },
  modalHint: { fontSize: 12, color: COLORS.muted, marginBottom: 14 },
  modalMap: { width: '100%', height: 180, borderRadius: 8, marginBottom: 14 },
  label: { fontSize: 12.5, color: COLORS.muted, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 11,
    fontSize: 14,
    color: COLORS.ink
  },
  error: { color: COLORS.danger, fontSize: 12, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 13,
    alignItems: 'center'
  },
  cancelText: { color: COLORS.ink, fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: COLORS.teal, borderRadius: 8, padding: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
