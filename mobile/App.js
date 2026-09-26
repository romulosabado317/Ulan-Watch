import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './src/theme';
import { fetchReports, fetchCurrentUser, setAuthToken } from './src/api';
import { haversine, initials } from './src/utils/haversine';

import AuthScreen from './src/screens/AuthScreen';
import MapScreen from './src/screens/MapScreen';
import ReportScreen from './src/screens/ReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar from './src/components/BottomTabBar';

const SESSION_KEY = '@ulanwatch/session';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('map');
  const [bannerText, setBannerText] = useState(null);
  const seenAlertIds = useRef({});
  const hasAlertBaseline = useRef(false);
  const [hasAlertDot, setHasAlertDot] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then(async (raw) => {
      if (!raw) {
        setLoadingProfile(false);
        return;
      }
      try {
        const session = JSON.parse(raw);
        setAuthToken(session.token);
        const user = await fetchCurrentUser();
        setProfile({ ...user, savedLocations: session.user?.savedLocations || [] });
      } catch (error) {
        setAuthToken(null);
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setLoadingProfile(false);
      }
    }).catch(() => setLoadingProfile(false));
  }, []);

  const refreshReports = useCallback(() => {
    fetchReports()
      .then((list) => setReports(list))
      .catch(() => {
        // Backend not reachable yet; keep last known list.
      });
  }, []);

  useEffect(() => {
    refreshReports();
    const interval = setInterval(refreshReports, 15000);
    return () => clearInterval(interval);
  }, [refreshReports]);

  useEffect(() => {
    if (!profile) return;
    const active = reports.filter((r) => r.status === 'active');
    const alerts = [];
    active.forEach((r) => {
      (profile.savedLocations || []).forEach((loc) => {
        const d = haversine(r.lat, r.lng, loc.lat, loc.lng);
        if (d <= loc.radius) alerts.push({ report: r, location: loc });
      });
    });
    if (!hasAlertBaseline.current) {
      alerts.forEach((a) => {
        seenAlertIds.current[a.report.id] = true;
      });
      hasAlertBaseline.current = true;
      return;
    }
    const fresh = alerts.filter((a) => !seenAlertIds.current[a.report.id]);
    if (fresh.length) {
      setBannerText('New report near "' + fresh[0].location.label + '": ' + fresh[0].report.street);
      setHasAlertDot(true);
      fresh.forEach((a) => {
        seenAlertIds.current[a.report.id] = true;
      });
    }
  }, [reports, profile]);

  function handleAuthenticated(session) {
    setAuthToken(session.token);
    setReports([]);
    seenAlertIds.current = {};
    hasAlertBaseline.current = false;
    const profileWithLocalData = { ...session.user, savedLocations: [] };
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: profileWithLocalData })).then(() => setProfile(profileWithLocalData));
  }

  function handleProfileChange(updated) {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) return;
      const session = JSON.parse(raw);
      return AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: updated }));
    }).finally(() => setProfile(updated));
  }

  function handleLogout() {
    setAuthToken(null);
    setReports([]);
    setTab('map');
    seenAlertIds.current = {};
    hasAlertBaseline.current = false;
    AsyncStorage.removeItem(SESSION_KEY).then(() => setProfile(null));
  }

  function handleTabChange(nextTab) {
    setTab(nextTab);
    if (nextTab === 'alerts') setHasAlertDot(false);
  }

  if (loadingProfile) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.ink} />
      <View style={styles.topbar}>
        <View style={styles.topbarRow}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="water" size={15} color={COLORS.ink} />
              </View>
              <Text style={styles.topbarTitle}>Ulan Watch</Text>
            </View>
            <Text style={styles.topbarSub}>{profile ? 'Community flood intelligence · Las Piñas' : 'Live flood map · Las Piñas'}</Text>
          </View>
          {profile ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile.name)}</Text>
            </View>
          ) : (
            <View style={styles.guestBadge}>
              <Ionicons name="eye-outline" size={14} color={COLORS.ink} />
              <Text style={styles.guestBadgeText}>Guest</Text>
            </View>
          )}
        </View>
      </View>

      {bannerText ? (
        <View style={styles.banner}>
          <Ionicons name="warning" size={18} color="#5C3B00" />
          <Text style={styles.bannerText} numberOfLines={2}>
            {bannerText}
          </Text>
          <TouchableOpacity onPress={() => setBannerText(null)}>
            <Ionicons name="close" size={20} color="#5C3B00" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        {tab === 'map' && <MapScreen reports={reports} />}
        {tab === 'report' && profile?.role === 'resident' && <ReportScreen onSubmitted={() => { refreshReports(); setTab('map'); }} />}
        {tab === 'report' && !profile && <AuthScreen onAuthenticated={handleAuthenticated} guestPrompt />}
        {tab === 'history' && profile && <HistoryScreen reports={reports} profile={profile} />}
        {tab === 'alerts' && profile && <AlertsScreen reports={reports} profile={profile} onProfileChange={handleProfileChange} />}
        {tab === 'profile' && profile && (
          <ProfileScreen
            profile={profile}
            reports={reports}
            onLogout={handleLogout}
            onReportsChanged={refreshReports}
          />
        )}
      </View>

      <BottomTabBar activeTab={tab} onChange={handleTabChange} hasAlertDot={hasAlertDot} role={profile?.role || 'guest'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.ink },
  appContainer: { flex: 1, backgroundColor: COLORS.mist },
  topbar: { backgroundColor: COLORS.ink, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 15 },
  topbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  topbarSub: { color: '#A9C4C6', fontSize: 11, marginTop: 5 },
  avatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  guestBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.lime, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  guestBadgeText: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  banner: {
    backgroundColor: '#E3A83B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9
  },
  bannerText: { color: '#3E2A08', fontSize: 12.5, flex: 1 },
  bannerClose: { color: '#3E2A08', fontSize: 18 }
});
