import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
};

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType = 'default',
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.wrap}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            style={[styles.input, multiline && styles.multiline, error && styles.invalid]}
          />
          {error ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 6, fontWeight: '600', color: theme.colors.text },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  invalid: { borderColor: theme.colors.danger },
  error: { color: theme.colors.danger, marginTop: 4, fontSize: 13 },
});
