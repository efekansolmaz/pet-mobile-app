import { useRouter } from 'expo-router';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/States';
import { theme } from '@/constants/theme';
import { usePets } from '@/hooks/usePets';
import { mediaUrl } from '@/services/api';
import { usePetStore } from '@/stores/pets';
import { petAge } from '@/utils/dates';

export default function PetsScreen() {
  const router = useRouter();
  const { data: pets, isLoading, refetch } = usePets();
  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const setSelectedPetId = usePetStore((state) => state.setSelectedPetId);

  const handleSelectPet = (id: string) => {
    setSelectedPetId(id);
    router.push(`/(app)/pets/${id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Pets</Text>
          <Text style={styles.subtitle}>Manage profiles, health records & passports</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/pets/new')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }>
        {isLoading && !pets ? (
          <LoadingState label="Loading pets..." />
        ) : !pets || pets.length === 0 ? (
          <EmptyState
            title="No Pets Registered"
            subtitle="Tap the '+ Add' button above to register your first companion."
          />
        ) : (
          pets.map((pet) => {
            const isSelected = pet.id === selectedPetId;
            return (
              <View key={pet.id} style={[styles.petCard, isSelected && styles.selectedPetCard]}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => handleSelectPet(pet.id)}>
                  {pet.photo_url ? (
                    <Image source={{ uri: mediaUrl(pet.photo_url) }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarEmoji}>{pet.species === 'cat' ? '🐱' : '🐶'}</Text>
                    </View>
                  )}

                  <View style={styles.petInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      {isSelected && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.petMeta}>
                      {pet.breed || pet.species} · {petAge(pet.birth_date)}
                    </Text>
                    <View style={styles.specsRow}>
                      <Text style={styles.specText}>
                        ⚖️ {pet.weight ? `${pet.weight} kg` : 'No weight'}
                      </Text>
                      {pet.gender && (
                        <Text style={styles.specText}>
                          {pet.gender === 'male' ? '♂ Male' : '♀ Female'}
                        </Text>
                      )}
                      {pet.microchip_id && (
                        <Text style={styles.specText}>🏷️ Chipped</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Pet Quick Action Links */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => router.push(`/(app)/pets/${pet.id}/passport`)}>
                    <Text style={styles.cardActionText}>🛂 Passport</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => router.push(`/(app)/pets/${pet.id}/weight`)}>
                    <Text style={styles.cardActionText}>⚖️ Weight</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => router.push(`/(app)/pets/${pet.id}/nutrition`)}>
                    <Text style={styles.cardActionText}>🥣 Diet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => router.push(`/(app)/pets/${pet.id}`)}>
                    <Text style={styles.cardActionText}>⚙️ Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  petCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedPetCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  cardMain: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  petInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  activeBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  petMeta: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  specText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 14,
    paddingTop: 10,
    gap: 8,
  },
  cardActionBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
