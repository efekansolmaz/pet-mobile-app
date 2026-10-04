import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      setError(null);
      const res = (await endpoints.login({
        email: 'demo@petcare.app',
        password: 'Demo1234!',
      })) as { access_token: string; refresh_token: string; user?: any };
      await setSession(res.access_token, res.refresh_token, res.user);
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      setError(err?.message || 'Failed to login with demo account. Ensure backend is running.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🐶</Text>
            </View>
            <View style={[styles.badge, styles.badgeAccent]}>
              <Text style={styles.badgeIcon}>🐱</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>✨</Text>
            </View>
          </View>
          <Text style={styles.title}>PetCare</Text>
          <Text style={styles.tagline}>Smart health & care companion for your beloved pets</Text>
        </View>

        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📋</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Digital Health Passport</Text>
              <Text style={styles.featureDesc}>All vaccines, medications, visits & records in one place</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📈</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Weight & Nutrition</Text>
              <Text style={styles.featureDesc}>Track growth trends, daily feeding schedules and diets</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI Pet Assistant</Text>
              <Text style={styles.featureDesc}>Ask questions about vaccination dates, medications & care</Text>
            </View>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actions}>
          <PrimaryButton
            label="Sign In"
            onPress={() => router.push('/(auth)/login')}
          />

          <PrimaryButton
            label="Create an Account"
            variant="ghost"
            onPress={() => router.push('/(auth)/register')}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or quick test</Text>
            <View style={styles.divider} />
          </View>

          <PrimaryButton
            label={demoLoading ? 'Logging in...' : '⚡ Try Demo Account (Max & Luna)'}
            variant="secondary"
            loading={demoLoading}
            onPress={handleDemoLogin}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeAccent: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  badgeIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 4,
  },
  actions: {
    gap: 10,
    marginBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
});
