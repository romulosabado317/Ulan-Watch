import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { levelInfo, COLORS } from '../theme';

export function LevelBadge({ waterLevel }) {
  const lvl = levelInfo(waterLevel);
  return (
    <View style={[styles.badge, { backgroundColor: lvl.color + '22' }]}>
      <Text style={[styles.badgeText, { color: lvl.color }]}>{lvl.label}</Text>
    </View>
  );
}

export function TierBadge({ tier }) {
  if (!tier) return null;
  let bg = COLORS.mist;
  let fg = COLORS.muted;
  if (tier.id === 'likely') {
    bg = '#FCEADB';
    fg = '#7C4218';
  } else if (tier.id === 'verified') {
    bg = '#DCEBEA';
    fg = '#0A4F4C';
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderWidth: 1, borderColor: COLORS.line }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{tier.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  badgeText: { fontSize: 11, fontWeight: '600' }
});
