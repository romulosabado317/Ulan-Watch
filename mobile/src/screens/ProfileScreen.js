import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, levelInfo } from '../theme';
import { initials, timeAgo } from '../utils/haversine';
import { updateReportStatus } from '../api';

export default function ProfileScreen({ profile, reports, onLogout, onReportsChanged }) {
  const [busyId, setBusyId] = useState(null);
  const active = reports.filter((r) => r.status === 'active' && r.tier && r.tier.id !== 'expired');

  async function handleUpdate(id, status) {
    setBusyId(id);
    try {
      await updateReportStatus(id, status);
      onReportsChanged();
    } catch (e) {
      Alert.alert('Could not update report', 'Check your connection to the backend server.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(profile.name)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role === 'coordinator' ? 'Coordinator' : 'Resident'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={styles.row} onPress={onLogout}>
        <View>
          <Text style={styles.rowTitle}>Switch account</Text>
          <Text style={styles.rowSub}>Sign in as someone else on this device</Text>
        </View>
      </TouchableOpacity>

      {profile.role === 'coordinator' && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Moderation</Text>
          {active.length === 0 ? (
            <Text style={styles.empty}>No active reports to review.</Text>
          ) : (
            active.map((r) => {
              const lvl = levelInfo(r.waterLevel);
              return (
                <View key={r.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{r.street}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: lvl.color + '22' }]}>
                    <Text style={{ color: lvl.color, fontSize: 11, fontWeight: '600' }}>{lvl.label}</Text>
                  </View>
                  <Text style={styles.cardSub}>
                    {r.reporter} · {timeAgo(r.createdAt)}
                  </Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      disabled={busyId === r.id}
                      onPress={() => handleUpdate(r.id, 'resolved')}
                    >
                      <Text style={styles.actionText}>Mark resolved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      disabled={busyId === r.id}
                      onPress={() => handleUpdate(r.id, 'flagged')}
                    >
                      <Text style={[styles.actionText, { color: COLORS.danger }]}>Flag as false</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 22 }]}>About this build</Text>
      <View style={styles.card}>
        <Text style={styles.aboutText}>
          This React Native app covers the core scope of the Ulan Watch proposal: report submission with photo and
          water level, a live crowd-verified map, confidence scoring, flood history, saved-location alerts, and
          coordinator moderation. It talks to the included Node/Express API. Swap the JSON file store for
          PostgreSQL with PostGIS to match the proposal's production data layer.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mist },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  role: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  sectionTitle: { fontSize: 13, color: COLORS.muted, marginBottom: 10 },
  row: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 13,
    marginBottom: 8
  },
  rowTitle: { fontSize: 13.5, color: COLORS.ink, fontWeight: '600' },
  rowSub: { fontSize: 11.5, color: COLORS.muted, marginTop: 2 },
  empty: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: 20 },
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  cardSub: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 11,
    alignItems: 'center'
  },
  actionText: { fontSize: 12.5, color: COLORS.ink },
  aboutText: { fontSize: 12.5, color: COLORS.muted, lineHeight: 19 }
});
