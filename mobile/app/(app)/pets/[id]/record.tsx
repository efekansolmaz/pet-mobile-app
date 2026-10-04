import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';

type RecordType = 'vaccination' | 'medication' | 'visit';

export default function RecordHealthScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [type, setType] = useState<RecordType>('vaccination');

  // Vaccination fields
  const [vacName, setVacName] = useState('');
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacNextDue, setVacNextDue] = useState('');
  const [vacVet, setVacVet] = useState('');
  const [vacNotes, setVacNotes] = useState('');

  // Medication fields
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medStartDate, setMedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [medEndDate, setMedEndDate] = useState('');
  const [medNotes, setMedNotes] = useState('');

  // Visit fields
  const [visitVet, setVisitVet] = useState('');
  const [visitClinic, setVisitClinic] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitReason, setVisitReason] = useState('');
  const [visitDiag, setVisitDiag] = useState('');
  const [visitTreat, setVisitTreat] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (type === 'vaccination') {
        if (!vacName.trim()) throw new Error('Vaccine name is required');
        return endpoints.create(id!, 'vaccinations', {
          vaccine_name: vacName,
          date_administered: vacDate,
          next_due_date: vacNextDue || null,
          veterinarian: vacVet || null,
          notes: vacNotes || null,
        });
      }
      if (type === 'medication') {
        if (!medName.trim() || !medDosage.trim() || !medFrequency.trim()) {
          throw new Error('Medication name, dosage and frequency are required');
        }
        return endpoints.create(id!, 'medications', {
          medication_name: medName,
          dosage: medDosage,
          frequency: medFrequency,
          start_date: medStartDate,
          end_date: medEndDate || null,
          notes: medNotes || null,
        });
      }
      if (!visitVet.trim()) throw new Error('Veterinarian name is required');
      return endpoints.create(id!, 'visits', {
        veterinarian_name: visitVet,
        clinic_name: visitClinic || null,
        visit_date: visitDate,
        reason: visitReason || null,
        diagnosis: visitDiag || null,
        treatment: visitTreat || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type === 'vaccination' ? 'vaccinations' : type === 'medication' ? 'medications' : 'visits', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      queryClient.invalidateQueries({ queryKey: ['passport', id] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to save health record');
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Record Health Event</Text>
          <Text style={styles.subheading}>
            Log a new vaccine, prescription, or clinical visit for your pet.
          </Text>

          {/* Type Switcher */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'vaccination' && styles.typeBtnActive]}
              onPress={() => setType('vaccination')}>
              <Text style={[styles.typeBtnText, type === 'vaccination' && styles.typeBtnTextActive]}>
                💉 Vaccine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === 'medication' && styles.typeBtnActive]}
              onPress={() => setType('medication')}>
              <Text style={[styles.typeBtnText, type === 'medication' && styles.typeBtnTextActive]}>
                💊 Medication
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === 'visit' && styles.typeBtnActive]}
              onPress={() => setType('visit')}>
              <Text style={[styles.typeBtnText, type === 'visit' && styles.typeBtnTextActive]}>
                🏥 Vet Visit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {type === 'vaccination' && (
              <>
                <Text style={styles.label}>Vaccine Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rabies, DHPP"
                  value={vacName}
                  onChangeText={setVacName}
                />

                <Text style={styles.label}>Date Administered (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  value={vacDate}
                  onChangeText={setVacDate}
                />

                <Text style={styles.label}>Next Booster Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={vacNextDue}
                  onChangeText={setVacNextDue}
                />

                <Text style={styles.label}>Veterinarian (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dr. Ayşe Kaya"
                  value={vacVet}
                  onChangeText={setVacVet}
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  multiline
                  placeholder="e.g. Annual booster dose"
                  value={vacNotes}
                  onChangeText={setVacNotes}
                />
              </>
            )}

            {type === 'medication' && (
              <>
                <Text style={styles.label}>Medication Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Apoquel, Amoxicillin"
                  value={medName}
                  onChangeText={setMedName}
                />

                <Text style={styles.label}>Dosage *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 16 mg"
                  value={medDosage}
                  onChangeText={setMedDosage}
                />

                <Text style={styles.label}>Frequency *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Once daily at 20:00"
                  value={medFrequency}
                  onChangeText={setMedFrequency}
                />

                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={medStartDate}
                  onChangeText={setMedStartDate}
                />

                <Text style={styles.label}>End Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={medEndDate}
                  onChangeText={setMedEndDate}
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  multiline
                  placeholder="e.g. Give with food"
                  value={medNotes}
                  onChangeText={setMedNotes}
                />
              </>
            )}

            {type === 'visit' && (
              <>
                <Text style={styles.label}>Veterinarian Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dr. Ayşe Kaya"
                  value={visitVet}
                  onChangeText={setVisitVet}
                />

                <Text style={styles.label}>Clinic / Hospital Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Vet Clinic"
                  value={visitClinic}
                  onChangeText={setVisitClinic}
                />

                <Text style={styles.label}>Visit Date *</Text>
                <TextInput
                  style={styles.input}
                  value={visitDate}
                  onChangeText={setVisitDate}
                />

                <Text style={styles.label}>Reason for Visit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Annual checkup"
                  value={visitReason}
                  onChangeText={setVisitReason}
                />

                <Text style={styles.label}>Diagnosis</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Healthy, clear lungs"
                  value={visitDiag}
                  onChangeText={setVisitDiag}
                />

                <Text style={styles.label}>Treatment</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Routine vaccination"
                  value={visitTreat}
                  onChangeText={setVisitTreat}
                />
              </>
            )}

            <View style={{ marginTop: 12 }}>
              <PrimaryButton
                label={createMutation.isPending ? 'Saving...' : 'Save Health Record'}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
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
  },
  subheading: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: '#fff',
  },
  area: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
