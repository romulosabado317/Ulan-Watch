import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS } from '../theme';
import { uid } from '../utils/haversine';

export default function OnboardingScreen({ onDone }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('resident');
  const [error, setError] = useState(false);

  function handleContinue() {
    if (!name.trim()) {
      setError(true);
      return;
    }
    onDone({ id: uid(), name: name.trim(), role, savedLocations: [] });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Ulan Watch</Text>
        </View>

        <Text style={styles.h1}>Know which streets are flooded before you leave.</Text>
        <Text style={styles.lede}>
          Residents report waterlogged streets in real time. Reports from multiple people in the same spot get
          marked verified, so you know what to trust.
        </Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={[styles.input, error && !name.trim() && styles.inputError]}
          placeholder="e.g. Marco Reyes"
          placeholderTextColor="#7890A5"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(false);
          }}
        />

        <Text style={[styles.label, { marginTop: 20 }]}>You are joining as</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'resident' && styles.roleBtnSelected]}
            onPress={() => setRole('resident')}
          >
            <Text style={styles.roleTitle}>Resident</Text>
            <Text style={styles.roleSub}>Report and view flood conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'coordinator' && styles.roleBtnSelected]}
            onPress={() => setRole('coordinator')}
          >
            <Text style={styles.roleTitle}>Coordinator</Text>
            <Text style={styles.roleSub}>Also moderate reports</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Demo build: coordinator access is self-selected here. In a barangay deployment this role would be granted
          after verification by an admin.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  scroll: { padding: 28, paddingTop: 48 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  brandDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.sky },
  brandText: { color: '#fff', fontSize: 19, fontWeight: '700' },
  h1: { color: '#fff', fontSize: 25, fontWeight: '700', lineHeight: 33, marginBottom: 10 },
  lede: { color: '#C2D1E0', fontSize: 14, lineHeight: 21, marginBottom: 30 },
  label: { color: '#C2D1E0', fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#173B5C',
    borderWidth: 1,
    borderColor: '#356184',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15
  },
  inputError: { borderColor: COLORS.danger },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    backgroundColor: '#173B5C',
    borderWidth: 1,
    borderColor: '#356184',
    borderRadius: 8,
    padding: 14
  },
  roleBtnSelected: { borderColor: COLORS.sky, backgroundColor: '#1D4B70' },
  roleTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  roleSub: { color: '#AFC5D8', fontSize: 11 },
  primaryBtn: {
    backgroundColor: COLORS.sky,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 26
  },
  primaryBtnText: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  note: { color: '#9EB4C8', fontSize: 11, lineHeight: 16, marginTop: 16 }
});
