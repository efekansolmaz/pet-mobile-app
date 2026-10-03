import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function PrimaryButton({ label, onPress, loading, variant = 'primary' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.label, variant !== 'primary' && variant !== 'danger' && styles.darkLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surfaceMuted },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.7 },
  label: { color: '#fff', fontWeight: '700', fontSize: 16 },
  darkLabel: { color: theme.colors.text },
});
