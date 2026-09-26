import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, WATER_LEVELS } from '../theme';
import { createReport } from '../api';
import FreeMap from '../components/FreeMap';

export default function ReportScreen({ onSubmitted }) {
  const [pin, setPin] = useState(null);
  const [street, setStreet] = useState('');
  const [level, setLevel] = useState(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to attach a picture to your report.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto('data:image/jpeg;base64,' + asset.base64);
    }
  }

  async function handleSubmit() {
    if (!street.trim() || !level || !pin) {
      setError('Pin a location, choose a water level, and enter a street name first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createReport({
        lat: pin.latitude,
        lng: pin.longitude,
        street: street.trim(),
        waterLevel: level,
        note: note.trim(),
        photo,
      });
      setPin(null);
      setStreet('');
      setLevel(null);
      setNote('');
      setPhoto(null);
      onSubmitted();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <View style={styles.intro}>
        <View style={styles.introIcon}><Ionicons name="megaphone-outline" size={20} color={COLORS.ink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Report flooding</Text>
          <Text style={styles.subtitle}>Help neighbors make safer decisions with a precise, timely report.</Text>
        </View>
      </View>

      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
        <View><Text style={styles.stepTitle}>Where is it?</Text><Text style={styles.stepSub}>Drop a pin at the flooded spot</Text></View>
      </View>
      <FreeMap style={styles.pickMap} pin={pin} onPress={setPin} />
      <Text style={styles.hint}>
        {pin ? 'Pin set. Tap elsewhere on the map to move it.' : 'Tap the map to drop a pin at the flooded spot.'}
      </Text>

      <Text style={[styles.label, { marginTop: 18 }]}>Street or landmark</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Alabang-Zapote Rd near market"
        placeholderTextColor={COLORS.muted}
        value={street}
        onChangeText={setStreet}
      />

      <View style={[styles.stepHeader, { marginTop: 24 }]}>
        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
        <View><Text style={styles.stepTitle}>How deep is the water?</Text><Text style={styles.stepSub}>Choose the closest level</Text></View>
      </View>
      <View style={styles.levelGrid}>
        {WATER_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.levelOption, level === lvl.id && styles.levelOptionSelected]}
            onPress={() => setLevel(lvl.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: level === lvl.id }}
          >
            <View style={[styles.swatch, { backgroundColor: lvl.color }]} />
            {level === lvl.id ? <Ionicons name="checkmark-circle" size={18} color={COLORS.teal} style={styles.levelCheck} /> : null}
            <Text style={styles.levelTitle}>{lvl.label}</Text>
            <Text style={styles.levelSub}>{lvl.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 22 }]}>Photo (optional)</Text>
      <TouchableOpacity style={styles.photoDrop} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.hint}>Tap to add a photo</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 18 }]}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Any other detail, e.g. rising fast, vehicles stalled"
        placeholderTextColor={COLORS.muted}
        value={note}
        onChangeText={setNote}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.submitBtn, (!pin || !level || !street.trim()) && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting} accessibilityRole="button">
        <Ionicons name={submitting ? 'sync-outline' : 'send-outline'} size={18} color="#fff" />
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit report'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mist },
  intro: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 24 },
  introIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, color: COLORS.ink, fontWeight: '800' },
  subtitle: { fontSize: 12, color: COLORS.muted, lineHeight: 17, marginTop: 3 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: COLORS.paper, fontWeight: '800', fontSize: 12 },
  stepTitle: { fontSize: 14, color: COLORS.ink, fontWeight: '800' },
  stepSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  label: { fontSize: 12.5, color: COLORS.muted, marginBottom: 6 },
  hint: { fontSize: 11, color: COLORS.muted, marginTop: 6 },
  pickMap: { width: '100%', height: 220, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line },
  input: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: COLORS.ink
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelOption: {
    width: '48%',
    borderWidth: 2,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.paper
  },
  levelOptionSelected: { borderColor: COLORS.ink },
  swatch: { width: '100%', height: 6, borderRadius: 3, marginBottom: 8 },
  levelCheck: { position: 'absolute', top: 9, right: 9 },
  levelTitle: { fontSize: 12.5, fontWeight: '700', color: COLORS.ink },
  levelSub: { fontSize: 10.5, color: COLORS.muted, marginTop: 2 },
  photoDrop: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.paper
  },
  photoPreview: { width: '100%', height: 140, borderRadius: 6 },
  error: { color: COLORS.danger, fontSize: 12, marginTop: 14 },
  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  submitBtnDisabled: { backgroundColor: '#9EB7B4' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});
