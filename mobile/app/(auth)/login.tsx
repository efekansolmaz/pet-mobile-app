import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { z } from 'zod';

import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { loginSchema } from '@/utils/validation';

type FormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = (await endpoints.login(values)) as {
        access_token: string;
        refresh_token: string;
        user?: any;
      };
      await setSession(res.access_token, res.refresh_token, res.user);
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setValue('email', 'demo@petcare.app');
    setValue('password', 'Demo1234!');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your pets' health & reminders</Text>
          </View>

          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <FormField
              control={control}
              name="email"
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <FormField
              control={control}
              name="password"
              label="Password"
              placeholder="••••••••"
              secureTextEntry
            />

            <TouchableOpacity onPress={fillDemo} style={styles.demoLink}>
              <Text style={styles.demoLinkText}>⚡ Fill demo credentials</Text>
            </TouchableOpacity>

            <PrimaryButton
              label={loading ? 'Signing in...' : 'Sign In'}
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorBox: {
    backgroundColor: '#FDF0ED',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  demoLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  demoLinkText: {
    color: theme.colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
