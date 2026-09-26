import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../theme';
import { LevelBadge, TierBadge } from '../components/Badges';
import { timeAgo } from '../utils/haversine';

const FILTERS = [
  { id: 'all', label: 'All reports' },
  { id: 'mine', label: 'My reports' },
  { id: 'resolved', label: 'Resolved' }
];

export default function HistoryScreen({ reports, profile }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const sorted = [...reports].sort((a, b) => b.createdAt - a.createdAt);
    return sorted.filter((r) => {
      if (filter === 'mine') return r.reporterId === profile.id;
      if (filter === 'resolved') return r.status === 'resolved';
      return r.status !== 'flagged';
    });
  }, [reports, filter, profile.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Flood history</Text>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, filter === f.id && styles.chipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No reports here yet. Submit one from the Report tab.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.street}</Text>
              <TierBadge tier={item.tier} />
            </View>
            <LevelBadge waterLevel={item.waterLevel} />
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            {item.photo ? <Image source={{ uri: item.photo }} style={styles.photo} /> : null}
            <Text style={styles.who}>
              {item.reporter} · {timeAgo(item.createdAt)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mist, padding: 18 },
  sectionTitle: { fontSize: 13, color: COLORS.muted, marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipText: { fontSize: 11.5, color: COLORS.muted },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.ink, flexShrink: 1 },
  note: { fontSize: 12.5, color: COLORS.muted, marginTop: 8 },
  photo: { width: '100%', height: 120, borderRadius: 8, marginTop: 8, backgroundColor: '#DDE7E7' },
  who: { fontSize: 11.5, color: COLORS.muted, marginTop: 8 },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: 40 }
});
