import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { mediaUrl } from '@/services/api';
import type { Pet } from '@/types/models';
import { petAge } from '@/utils/dates';

export function PetCard({ pet, onPress, selected }: { pet: Pet; onPress?: () => void; selected?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      {pet.photo_url ? (
        <Image source={{ uri: mediaUrl(pet.photo_url) }} style={styles.photo} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.emoji}>{pet.species === 'cat' ? '🐱' : '🐶'}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.meta}>
          {pet.breed || pet.species} · {petAge(pet.birth_date)}
        </Text>
        <Text style={styles.weight}>{pet.weight ? `${pet.weight} kg` : 'No weight yet'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selected: { borderColor: theme.colors.primary, borderWidth: 2 },
  photo: { width: 64, height: 64, borderRadius: 32 },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  body: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  meta: { color: theme.colors.textMuted, marginTop: 2 },
  weight: { marginTop: 6, color: theme.colors.primary, fontWeight: '600' },
});
