import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.aboutHero}>
        <View style={styles.aboutHeroTop}>
          <View style={styles.aboutIcon}>
            <Ionicons name="water" size={20} color={COLORS.ink} />
          </View>
          <Text style={styles.version}>VERSION 1.0.0</Text>
        </View>
        <Text style={styles.aboutTitle}>Ulan Watch</Text>
        <Text style={styles.aboutDescription}>
          Community-powered flood updates to help you make safer decisions around Antipolo City.
        </Text>
      </View>

      <View style={styles.aboutFeatures}>
        {[
          { icon: 'map-outline', title: 'Live flood map', detail: 'View reports and community confidence at a glance.' },
          { icon: 'water-outline', title: 'Detailed reports', detail: 'Share a location, water level, note, and photo.' },
          { icon: 'notifications-outline', title: 'Saved-location alerts', detail: 'See active reports near places that matter to you.' },
          { icon: 'shield-checkmark-outline', title: 'Coordinator review', detail: 'Coordinators can resolve or flag reports.' }
        ].map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={17} color={COLORS.tealDark} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDetail}>{feature.detail}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.aboutFootnote}>
        Reports are community-submitted and should be used alongside official safety advisories.
      </Text>
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
  aboutHero: {
    backgroundColor: COLORS.ink,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10
  },
  aboutHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboutIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center'
  },
  version: {
    color: '#C7D8E5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  aboutTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 15 },
  aboutDescription: { color: '#D3E0EA', fontSize: 12.5, lineHeight: 19, marginTop: 5 },
  aboutFeatures: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 13
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11
  },
  featureCopy: { flex: 1 },
  featureTitle: { color: COLORS.ink, fontSize: 12.5, fontWeight: '700' },
  featureDetail: { color: COLORS.muted, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  aboutFootnote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 11, paddingHorizontal: 2 }
});
