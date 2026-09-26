import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const TABS = [
  { id: 'map', label: 'Map', icon: 'map-outline' },
  { id: 'report', label: 'Report', icon: 'add-circle-outline' },
  { id: 'history', label: 'History', icon: 'time-outline' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' }
];

export default function BottomTabBar({ activeTab, onChange, hasAlertDot, role }) {
  const tabs = role === 'resident'
    ? TABS
    : !role || role === 'guest'
      ? TABS.filter((tab) => tab.id === 'map' || tab.id === 'report')
      : TABS.filter((tab) => tab.id !== 'report');
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <TouchableOpacity key={tab.id} style={styles.btn} onPress={() => onChange(tab.id)} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={tab.label}>
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons name={tab.icon} size={20} color={active ? COLORS.tealDark : COLORS.muted} />
              {tab.id === 'alerts' && hasAlertDot ? <View style={styles.dot} /> : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 9,
    paddingBottom: 12
  },
  btn: { flex: 1, alignItems: 'center', gap: 3, minHeight: 48 },
  iconWrap: { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: COLORS.sky },
  label: { fontSize: 10.5, color: COLORS.muted, marginTop: 1, fontWeight: '600' },
  labelActive: { color: COLORS.tealDark, fontWeight: '800' },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.danger
  }
});
