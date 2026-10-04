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
import { registerSchema } from '@/utils/validation';

type FormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      // Register new user
      await endpoints.register(values);
      // Automatically login
      const res = (await endpoints.login({
        email: values.email,
        password: values.password,
      })) as { access_token: string; refresh_token: string; user?: any };
      await setSession(res.access_token, res.refresh_token, res.user);
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your pets' health, vaccines & diets</Text>
          </View>

          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <FormField
              control={control}
              name="name"
              label="Full Name"
              placeholder="Alex Smith"
            />

            <FormField
              control={control}
              name="email"
              label="Email Address"
              placeholder="alex@example.com"
              keyboardType="email-address"
            />

            <FormField
              control={control}
              name="password"
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
            />

            <View style={{ marginTop: 12 }}>
              <PrimaryButton
                label={loading ? 'Creating account...' : 'Create Account'}
                loading={loading}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  loginLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
