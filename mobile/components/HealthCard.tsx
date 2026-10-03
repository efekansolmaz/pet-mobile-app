import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function HealthCard({
  title,
  subtitle,
  meta,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

export function ReminderCard({
  title,
  due,
  type,
  completed,
  onPress,
}: {
  title: string;
  due: string;
  type: string;
  completed?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, completed && styles.done]}>
      <View style={[styles.bar, { backgroundColor: completed ? theme.colors.textMuted : theme.colors.accent }]} />
      <View style={styles.body}>
        <Text style={styles.kicker}>{type.replace('_', ' ')}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{due}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
  },
  done: { opacity: 0.6 },
  bar: { width: 6, backgroundColor: theme.colors.primary },
  body: { padding: 14, flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  subtitle: { marginTop: 4, color: theme.colors.text },
  meta: { marginTop: 6, color: theme.colors.textMuted },
  kicker: { textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6, color: theme.colors.accent, marginBottom: 4 },
});
