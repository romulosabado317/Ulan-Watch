import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, WATER_LEVELS } from '../theme';
import FreeMap from '../components/FreeMap';

export default function MapScreen({ reports }) {
  const [filter, setFilter] = useState('all');
  const active = reports.filter((r) => r.status === 'active' && r.tier && r.tier.id !== 'expired');
  const visible = active.filter((r) => filter === 'all' || r.waterLevel === filter);

  return (
    <View style={styles.container}>
      <FreeMap style={styles.map} reports={visible} />

      <View style={styles.chip}>
        <Ionicons name="pulse" size={14} color={COLORS.tealDark} />
        <Text style={styles.chipText}>{visible.length} active</Text>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterTitle}>Flood depth</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setFilter('all')} style={[styles.filter, filter === 'all' && styles.filterActive]}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {WATER_LEVELS.map((lvl) => (
            <TouchableOpacity key={lvl.id} accessibilityRole="button" onPress={() => setFilter(lvl.id)} style={[styles.filter, filter === lvl.id && { backgroundColor: lvl.color, borderColor: lvl.color }]}>
              <View style={[styles.filterDot, { backgroundColor: lvl.color }]} />
              <Text style={[styles.filterText, filter === lvl.id && styles.filterTextActive]}>{lvl.label.split('-')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Water level</Text>
        <View style={styles.legendRow}>
          {WATER_LEVELS.map((lvl) => (
            <View key={lvl.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: lvl.color }]} />
              <Text style={styles.legendLabel}>{lvl.label.split('-')[0]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  chip: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.paper,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  chipText: { fontSize: 11.5, color: COLORS.tealDark, fontWeight: '700' },
  attribution: { position: 'absolute', right: 8, bottom: 4, fontSize: 9, color: COLORS.muted, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 3 },
  filters: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line
  },
  filterTitle: { fontSize: 10.5, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  filterRow: { flexDirection: 'row', gap: 6, paddingRight: 2 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: COLORS.paper },
  filterActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  filterText: { fontSize: 10.5, color: COLORS.muted, fontWeight: '600' },
  filterTextActive: { color: COLORS.paper },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  legend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.paper,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line
  },
  legendTitle: { fontSize: 11, color: COLORS.muted, marginBottom: 6 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: COLORS.ink }
});
