import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={[styles.card, styles.errorCard]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  text: { color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 20,
    margin: 16,
  },
  errorCard: { borderWidth: 1, borderColor: theme.colors.danger },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  subtitle: { color: theme.colors.textMuted, lineHeight: 20 },
});
