import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/States';
import { theme } from '@/constants/theme';
import { endpoints, mediaUrl } from '@/services/api';
import { usePetStore } from '@/stores/pets';
import type { Pet } from '@/types/models';
import { petAge, prettyDate } from '@/utils/dates';

export default function PetDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const setSelectedPetId = usePetStore((state) => state.setSelectedPetId);

  const {
    data: pet,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => endpoints.getPet(id!) as Promise<Pet>,
    enabled: Boolean(id),
  });

  const deletePetMutation = useMutation({
    mutationFn: () => endpoints.deletePet(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      if (selectedPetId === id) setSelectedPetId(null);
      router.replace('/(app)/(tabs)');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet Profile',
      `Are you sure you want to delete ${pet?.name}? All associated health records, vaccinations, and weight history will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePetMutation.mutate(),
        },
      ]
    );
  };

  const handleMakeActive = () => {
    if (id) {
      setSelectedPetId(id);
      Alert.alert('Active Pet', `${pet?.name} is now your active pet.`);
    }
  };

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading pet details..." />
      </SafeAreaView>
    );
  }

  const isActive = selectedPetId === pet.id;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {pet.photo_url ? (
            <Image source={{ uri: mediaUrl(pet.photo_url) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>{pet.species === 'cat' ? '🐱' : '🐶'}</Text>
            </View>
          )}

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>
            {pet.breed || pet.species} · {petAge(pet.birth_date)}
          </Text>

          {isActive ? (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>✓ CURRENT ACTIVE PET</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.makeActiveBtn} onPress={handleMakeActive}>
              <Text style={styles.makeActiveText}>Set as Active Pet</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feature Hub Grid */}
        <View style={styles.featureGrid}>
          <TouchableOpacity
            style={styles.featureBox}
            onPress={() => router.push(`/(app)/pets/${pet.id}/passport`)}>
            <Text style={styles.featureIcon}>🛂</Text>
            <Text style={styles.featureTitle}>Health Passport</Text>
            <Text style={styles.featureSub}>Full official medical records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureBox}
            onPress={() => router.push(`/(app)/pets/${pet.id}/weight`)}>
            <Text style={styles.featureIcon}>⚖️</Text>
            <Text style={styles.featureTitle}>Weight Tracking</Text>
            <Text style={styles.featureSub}>
              {pet.weight ? `${pet.weight} kg current` : 'Log measurements'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureBox}
            onPress={() => router.push(`/(app)/pets/${pet.id}/nutrition`)}>
            <Text style={styles.featureIcon}>🥣</Text>
            <Text style={styles.featureTitle}>Nutrition & Feeding</Text>
            <Text style={styles.featureSub}>Diet plan & feeding logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureBox}
            onPress={() => router.push(`/(app)/pets/${pet.id}/edit`)}>
            <Text style={styles.featureIcon}>✏️</Text>
            <Text style={styles.featureTitle}>Edit Profile</Text>
            <Text style={styles.featureSub}>Update name, breed, specs</Text>
          </TouchableOpacity>
        </View>

        {/* Specifications List */}
        <View style={styles.specsCard}>
          <Text style={styles.specsHeading}>Pet Identity & Specs</Text>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Species</Text>
            <Text style={styles.specValue}>{pet.species}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Gender</Text>
            <Text style={styles.specValue}>{pet.gender || 'Not specified'}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Birth Date</Text>
            <Text style={styles.specValue}>{prettyDate(pet.birth_date)}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Color / Coat</Text>
            <Text style={styles.specValue}>{pet.color || 'Not specified'}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Microchip ID</Text>
            <Text style={styles.specValue}>{pet.microchip_id || 'Not registered'}</Text>
          </View>

          {pet.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.specLabel}>Notes & Allergies</Text>
              <Text style={styles.notesText}>{pet.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑️ Delete Pet Profile</Text>
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
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  petBreed: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  activePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  makeActiveBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  makeActiveText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureBox: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  featureSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  specsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  specsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  specLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  notesSection: {
    marginTop: 12,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  deleteBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#FDF0ED',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  deleteBtnText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});
