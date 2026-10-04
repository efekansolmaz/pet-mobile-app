import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/States';
import { theme } from '@/constants/theme';
import { endpoints, mediaUrl } from '@/services/api';
import type { HealthPassport } from '@/types/models';
import { petAge, prettyDate } from '@/utils/dates';

export default function HealthPassportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: passport,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['passport', id],
    queryFn: () => endpoints.passport(id!) as Promise<HealthPassport>,
    enabled: Boolean(id),
  });

  const handleShare = async () => {
    if (!passport) return;
    const pet = passport.pet;
    const vaccinesText =
      passport.vaccinations.length > 0
        ? passport.vaccinations.map((v) => `• ${v.vaccine_name} (${v.date_administered})`).join('\n')
        : 'None recorded';

    const medsText =
      passport.medications.length > 0
        ? passport.medications.map((m) => `• ${m.medication_name}: ${m.dosage} (${m.frequency})`).join('\n')
        : 'None recorded';

    const summary = `🐾 PET HEALTH PASSPORT
Name: ${pet.name}
Species: ${pet.species} (${pet.breed || 'Unknown breed'})
Gender: ${pet.gender || 'Not specified'}
Microchip: ${pet.microchip_id || 'None'}
Current Weight: ${pet.weight ? `${pet.weight} kg` : 'N/A'}

💉 VACCINATIONS:
${vaccinesText}

💊 ACTIVE MEDICATIONS:
${medsText}

🏥 LAST VISIT:
${passport.visits.length > 0 ? `${passport.visits[0].reason || 'Checkup'} - ${passport.visits[0].veterinarian_name} (${passport.visits[0].visit_date})` : 'No visits'}

Verified with PetCare Health Passport`;

    try {
      await Share.share({ message: summary, title: `${pet.name}'s Health Passport` });
    } catch {
      Alert.alert('Share', 'Summary copied to clipboard format.');
    }
  };

  if (isLoading || !passport) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Compiling Health Passport..." />
      </SafeAreaView>
    );
  }

  const { pet, vaccinations, medications, visits, weights, nutrition_plans } = passport;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }>
        {/* Passport Booklet Header */}
        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.emblemRow}>
              <View style={styles.emblemBadge}>
                <Text style={styles.emblemIcon}>🛡️</Text>
              </View>
              <View>
                <Text style={styles.emblemTitle}>INTERNATIONAL PET PASSPORT</Text>
                <Text style={styles.emblemSub}>Digital Health & Identification Certificate</Text>
              </View>
            </View>
            <View style={styles.passportIdBox}>
              <Text style={styles.passportIdLabel}>PASSPORT ID</Text>
              <Text style={styles.passportIdNum}>
                {pet.microchip_id ? `CHIP-${pet.microchip_id.slice(-6)}` : `PC-${pet.id.slice(0, 8).toUpperCase()}`}
              </Text>
            </View>
          </View>

          {/* Identity Section */}
          <View style={styles.identitySection}>
            {pet.photo_url ? (
              <Image source={{ uri: mediaUrl(pet.photo_url) }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>{pet.species === 'cat' ? '🐱' : '🐶'}</Text>
              </View>
            )}

            <View style={styles.identityFields}>
              <Text style={styles.identityName}>{pet.name}</Text>
              <Text style={styles.identityBreed}>
                {pet.breed || pet.species} · {pet.gender ? pet.gender.toUpperCase() : 'N/A'}
              </Text>

              <View style={styles.idGrid}>
                <View style={styles.idCell}>
                  <Text style={styles.idCellLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.idCellVal}>{prettyDate(pet.birth_date)}</Text>
                </View>
                <View style={styles.idCell}>
                  <Text style={styles.idCellLabel}>AGE</Text>
                  <Text style={styles.idCellVal}>{petAge(pet.birth_date)}</Text>
                </View>
                <View style={styles.idCell}>
                  <Text style={styles.idCellLabel}>WEIGHT</Text>
                  <Text style={styles.idCellVal}>{pet.weight ? `${pet.weight} kg` : 'N/A'}</Text>
                </View>
                <View style={styles.idCell}>
                  <Text style={styles.idCellLabel}>MICROCHIP</Text>
                  <Text style={styles.idCellVal}>{pet.microchip_id || 'Not chipped'}</Text>
                </View>
              </View>
            </View>
          </View>

          {pet.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>ALLERGIES & CRITICAL NOTES</Text>
              <Text style={styles.notesContent}>{pet.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Share Action CTA */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share / Export Passport Summary</Text>
        </TouchableOpacity>

        {/* Section 1: Vaccination Records */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>💉</Text>
            <Text style={styles.sectionHeading}>Official Vaccination History</Text>
          </View>

          {vaccinations.length === 0 ? (
            <Text style={styles.emptyNotice}>No vaccines logged in passport.</Text>
          ) : (
            vaccinations.map((vac) => (
              <View key={vac.id} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{vac.vaccine_name}</Text>
                  <Text style={styles.rowSub}>Administered: {prettyDate(vac.date_administered)}</Text>
                  {vac.veterinarian ? (
                    <Text style={styles.rowVet}>Vet: {vac.veterinarian}</Text>
                  ) : null}
                </View>
                {vac.next_due_date && (
                  <View style={styles.boosterBadge}>
                    <Text style={styles.boosterText}>Due: {prettyDate(vac.next_due_date)}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Section 2: Active & Historical Medications */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>💊</Text>
            <Text style={styles.sectionHeading}>Medication Schedule & History</Text>
          </View>

          {medications.length === 0 ? (
            <Text style={styles.emptyNotice}>No medications on record.</Text>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{med.medication_name}</Text>
                  <Text style={styles.rowSub}>
                    {med.dosage} · {med.frequency}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Start: {prettyDate(med.start_date)}
                    {med.end_date ? ` · End: ${prettyDate(med.end_date)}` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.medStatusBadge,
                    med.is_completed ? styles.medStatusDone : styles.medStatusActive,
                  ]}>
                  <Text
                    style={[
                      styles.medStatusText,
                      med.is_completed ? styles.medStatusTextDone : styles.medStatusTextActive,
                    ]}>
                    {med.is_completed ? 'Completed' : 'Active'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Section 3: Veterinary Visits & Diagnoses */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🏥</Text>
            <Text style={styles.sectionHeading}>Veterinary Consultations</Text>
          </View>

          {visits.length === 0 ? (
            <Text style={styles.emptyNotice}>No veterinary visits logged.</Text>
          ) : (
            visits.map((v) => (
              <View key={v.id} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{v.reason || 'Routine Checkup'}</Text>
                  <Text style={styles.rowSub}>
                    {prettyDate(v.visit_date)} · {v.clinic_name || 'Clinic'} · Dr. {v.veterinarian_name}
                  </Text>
                  {v.diagnosis ? (
                    <Text style={styles.diagText}>Diagnosis: {v.diagnosis}</Text>
                  ) : null}
                  {v.treatment ? (
                    <Text style={styles.treatText}>Treatment: {v.treatment}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Section 4: Nutrition Diet Plan */}
        {nutrition_plans.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>🥣</Text>
              <Text style={styles.sectionHeading}>Registered Nutrition Plans</Text>
            </View>
            {nutrition_plans.map((np) => (
              <View key={np.id} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{np.food_name}</Text>
                  <Text style={styles.rowSub}>
                    {np.brand ? `${np.brand} · ` : ''}
                    {np.feeding_amount} ({np.feeding_frequency})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Section 5: Weight Records */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>⚖️</Text>
            <Text style={styles.sectionHeading}>Weight History Log</Text>
          </View>

          {weights.length === 0 ? (
            <Text style={styles.emptyNotice}>No weight logs recorded.</Text>
          ) : (
            weights.slice(-5).reverse().map((w) => (
              <View key={w.id} style={styles.tableRow}>
                <Text style={styles.rowTitle}>{w.weight} kg</Text>
                <Text style={styles.rowSub}>{prettyDate(w.recorded_at)}</Text>
              </View>
            ))
          )}
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  passportCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 2,
    borderColor: '#D4AF37', // Gold trim for official certificate feel
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  passportHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD6',
    paddingBottom: 14,
    marginBottom: 14,
  },
  emblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemIcon: {
    fontSize: 20,
  },
  emblemTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: 0.8,
  },
  emblemSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  passportIdBox: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE8E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  passportIdLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  passportIdNum: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
  },
  identitySection: {
    flexDirection: 'row',
    gap: 14,
  },
  photo: {
    width: 80,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoPlaceholder: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoEmoji: {
    fontSize: 38,
  },
  identityFields: {
    flex: 1,
  },
  identityName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  identityBreed: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  idGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  idCell: {
    width: '45%',
  },
  idCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  idCellVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 1,
  },
  notesBox: {
    marginTop: 14,
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F57C00',
    letterSpacing: 0.5,
  },
  notesContent: {
    fontSize: 12,
    color: '#5D4037',
    marginTop: 2,
    lineHeight: 16,
  },
  shareBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyNotice: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowVet: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  diagText: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: 3,
  },
  treatText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 2,
  },
  boosterBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boosterText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  medStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  medStatusActive: {
    backgroundColor: '#E6F4EA',
  },
  medStatusDone: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  medStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  medStatusTextActive: {
    color: theme.colors.primary,
  },
  medStatusTextDone: {
    color: theme.colors.textMuted,
  },
});
