import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { API_PREFIX, API_URL } from '@/constants/api';
import { useAuthStore } from '@/stores/auth';
import { prettyDate } from '@/utils/dates';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { data: healthStatus, isSuccess } = useQuery({
    queryKey: ['healthcheck'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/health`);
      return res.json();
    },
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Pet Owner'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@petcare.app'}</Text>
          {user?.created_at && (
            <Text style={styles.memberSince}>
              Member since {prettyDate(user.created_at)}
            </Text>
          )}
        </View>

        {/* System & Connectivity Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Backend Connection</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Server Health</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isSuccess ? theme.colors.success : theme.colors.accent },
                ]}
              />
              <Text style={styles.statusText}>
                {isSuccess ? 'Online (HTTP 200)' : 'Connecting...'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Endpoint</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {API_PREFIX}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Production Build)</Text>
          </View>
        </View>

        {/* Features Checklist */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Product Features</Text>

          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Pet Profiles & Identity Management</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Digital Health Passport & Export</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Vaccination Tracking & Booster Reminders</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Prescription & Medication Schedules</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Weight Trend Visualizer (SVG Graphs)</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>Daily Nutrition & Feeding Log</Text>
          </View>
          <View style={styles.featureLine}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureDesc}>AI Pet Health Assistant with Tool Calling</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out of PetCare</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    maxWidth: '60%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  featureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.text,
  },
  logoutBtn: {
    backgroundColor: '#FDF0ED',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
