import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { z } from 'zod';

import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState } from '@/components/States';
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import type { Pet } from '@/types/models';
import { petSchema } from '@/utils/validation';

type FormData = z.infer<typeof petSchema>;

const SPECIES_OPTIONS = [
  { id: 'dog', label: 'Dog 🐶' },
  { id: 'cat', label: 'Cat 🐱' },
  { id: 'bird', label: 'Bird 🦜' },
  { id: 'rabbit', label: 'Rabbit 🐰' },
  { id: 'other', label: 'Other 🐾' },
];

const GENDER_OPTIONS = [
  { id: 'male', label: '♂ Male' },
  { id: 'female', label: '♀ Female' },
];

export default function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [species, setSpecies] = useState('dog');
  const [gender, setGender] = useState('male');
  const [microchipId, setMicrochipId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => endpoints.getPet(id!) as Promise<Pet>,
    enabled: Boolean(id),
  });

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: '',
      species: 'dog',
      breed: '',
      birth_date: '',
      weight: '',
      color: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (pet) {
      reset({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        birth_date: pet.birth_date || '',
        weight: pet.weight ? String(pet.weight) : '',
        color: pet.color || '',
        notes: pet.notes || '',
      });
      setSpecies(pet.species);
      if (pet.gender) setGender(pet.gender);
      if (pet.microchip_id) setMicrochipId(pet.microchip_id);
    }
  }, [pet, reset]);

  const updatePetMutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload: any = {
        name: values.name,
        species,
        breed: values.breed || null,
        gender,
        birth_date: values.birth_date || null,
        weight: values.weight ? parseFloat(values.weight) : null,
        color: values.color || null,
        notes: values.notes || null,
        microchip_id: microchipId || null,
      };
      return (await endpoints.updatePet(id!, payload)) as Pet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || 'Failed to update pet.');
    },
  });

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading pet..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Edit {pet.name}'s Profile</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <FormField
              control={control}
              name="name"
              label="Pet Name *"
              placeholder="e.g. Max"
            />

            <Text style={styles.label}>Species *</Text>
            <View style={styles.pillsRow}>
              {SPECIES_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pill, species === item.id && styles.pillActive]}
                  onPress={() => setSpecies(item.id)}>
                  <Text style={[styles.pillText, species === item.id && styles.pillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField
              control={control}
              name="breed"
              label="Breed (Optional)"
              placeholder="e.g. Golden Retriever"
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pillsRow}>
              {GENDER_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pill, gender === item.id && styles.pillActive]}
                  onPress={() => setGender(item.id)}>
                  <Text style={[styles.pillText, gender === item.id && styles.pillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField
              control={control}
              name="birth_date"
              label="Birth Date (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
            />

            <FormField
              control={control}
              name="weight"
              label="Current Weight (kg)"
              placeholder="e.g. 12.4"
              keyboardType="decimal-pad"
            />

            <FormField
              control={control}
              name="color"
              label="Color / Markings"
              placeholder="e.g. Golden, Blue-gray"
            />

            <FormField
              control={control}
              name="notes"
              label="Special Notes or Allergies"
              multiline
            />

            <View style={{ marginTop: 8 }}>
              <PrimaryButton
                label={updatePetMutation.isPending ? 'Updating...' : 'Save Changes'}
                loading={updatePetMutation.isPending}
                onPress={handleSubmit((vals) => updatePetMutation.mutate(vals))}
              />
            </View>
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
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
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
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
});
