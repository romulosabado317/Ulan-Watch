import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS } from '../theme';
import { loginAccount, registerAccount } from '../api';

export default function AuthScreen({ onAuthenticated, guestPrompt = false }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid email address, such as name@yourdomain.com.');
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    if (!isLogin && password.length < 8) {
      setError('Create a password with at least 8 characters.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Enter your full name to create an account.');
      return;
    }
    setSubmitting(true);
    try {
      const session = mode === 'login'
        ? await loginAccount({ email: normalizedEmail, password })
        : await registerAccount({ name: name.trim(), email: normalizedEmail, password });
      onAuthenticated(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === 'login';
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><View style={styles.brandDot} /><Text style={styles.brandText}>Ulan Watch</Text></View>
        <Text style={styles.h1}>{guestPrompt ? 'Post a flood report.' : isLogin ? 'Welcome back.' : 'Create a resident account.'}</Text>
        <Text style={styles.lede}>
          {guestPrompt ? 'You can view current flood locations without an account. Sign in or create a resident account to post a location, photo, or report.' : isLogin ? 'Sign in to submit reports and manage your saved flood-alert locations.' : 'Registered resident accounts can submit flood reports.'}
        </Text>

        {!isLogin ? <><Text style={styles.label}>Full name</Text><TextInput style={styles.input} placeholder="e.g. Marco Reyes" placeholderTextColor="#7890A5" value={name} onChangeText={setName} /></> : null}
        <Text style={[styles.label, !isLogin && styles.spaced]}>Email address</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#7890A5" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Text style={styles.spacedLabel}>Password</Text>
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#7890A5" value={password} onChangeText={setPassword} secureTextEntry autoComplete={isLogin ? 'current-password' : 'new-password'} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.primaryBtn, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.primaryBtnText}>{submitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.switchBtn} onPress={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }} disabled={submitting}>
          <Text style={styles.switchText}>{isLogin ? 'No account yet? Create one' : 'Already have an account? Sign in'}</Text>
        </TouchableOpacity>
        {!isLogin ? <Text style={styles.note}>All self-registered accounts are residents. Coordinator access must be assigned by an administrator.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink }, scroll: { padding: 28, paddingTop: 48, flexGrow: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 }, brandDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.sky }, brandText: { color: COLORS.paper, fontSize: 19, fontWeight: '700' },
  h1: { color: COLORS.paper, fontSize: 25, fontWeight: '700', lineHeight: 33, marginBottom: 10 }, lede: { color: '#C2D1E0', fontSize: 14, lineHeight: 21, marginBottom: 30 },
  label: { color: '#C2D1E0', fontSize: 12, marginBottom: 6 }, spaced: { marginTop: 18 }, spacedLabel: { color: '#C2D1E0', fontSize: 12, marginTop: 18, marginBottom: 6 },
  input: { backgroundColor: '#173B5C', borderWidth: 1, borderColor: '#356184', borderRadius: 8, padding: 12, color: COLORS.paper, fontSize: 15 },
  error: { color: '#FFB4AE', fontSize: 12, lineHeight: 17, marginTop: 14 }, primaryBtn: { backgroundColor: COLORS.sky, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 26 }, disabled: { opacity: 0.6 }, primaryBtnText: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  switchBtn: { alignItems: 'center', padding: 16 }, switchText: { color: '#C2D1E0', fontSize: 13, fontWeight: '600' }, note: { color: '#9EB4C8', fontSize: 11, lineHeight: 16, textAlign: 'center' }
});
