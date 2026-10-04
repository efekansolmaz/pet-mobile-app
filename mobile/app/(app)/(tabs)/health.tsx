import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/States';
import { theme } from '@/constants/theme';
import { usePets, useSelectedPet } from '@/hooks/usePets';
import { endpoints } from '@/services/api';
import type { Medication, Vaccination, Visit } from '@/types/models';
import { prettyDate } from '@/utils/dates';

type HealthTab = 'vaccinations' | 'medications' | 'visits';

export default function HealthScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: pets } = usePets();
  const { pet: activePet } = useSelectedPet();
  const [activeTab, setActiveTab] = useState<HealthTab>('vaccinations');

  // Modal states for creating new records
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields for new vaccination
  const [vacName, setVacName] = useState('');
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacNextDue, setVacNextDue] = useState('');
  const [vacVet, setVacVet] = useState('');
  const [vacNotes, setVacNotes] = useState('');

  // Form fields for new medication
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medStartDate, setMedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [medEndDate, setMedEndDate] = useState('');
  const [medNotes, setMedNotes] = useState('');

  // Form fields for new visit
  const [visitVet, setVisitVet] = useState('');
  const [visitClinic, setVisitClinic] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitReason, setVisitReason] = useState('');
  const [visitDiag, setVisitDiag] = useState('');
  const [visitTreat, setVisitTreat] = useState('');
  const [visitNextDate, setVisitNextDate] = useState('');

  // Queries
  const {
    data: vaccinations,
    isLoading: vacLoading,
    refetch: refetchVac,
  } = useQuery({
    queryKey: ['vaccinations', activePet?.id],
    queryFn: () => endpoints.list(activePet!.id, 'vaccinations') as Promise<Vaccination[]>,
    enabled: Boolean(activePet?.id),
  });

  const {
    data: medications,
    isLoading: medLoading,
    refetch: refetchMed,
  } = useQuery({
    queryKey: ['medications', activePet?.id],
    queryFn: () => endpoints.list(activePet!.id, 'medications') as Promise<Medication[]>,
    enabled: Boolean(activePet?.id),
  });

  const {
    data: visits,
    isLoading: visitLoading,
    refetch: refetchVisits,
  } = useQuery({
    queryKey: ['visits', activePet?.id],
    queryFn: () => endpoints.list(activePet!.id, 'visits') as Promise<Visit[]>,
    enabled: Boolean(activePet?.id),
  });

  // Mutations
  const createVacMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(activePet!.id, 'vaccinations', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', activePet?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activePet?.id] });
      setModalVisible(false);
      resetForms();
    },
  });

  const createMedMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(activePet!.id, 'medications', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', activePet?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activePet?.id] });
      setModalVisible(false);
      resetForms();
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(activePet!.id, 'visits', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', activePet?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activePet?.id] });
      setModalVisible(false);
      resetForms();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ resource, id }: { resource: string; id: string }) =>
      endpoints.remove(activePet!.id, resource, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.resource, activePet?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activePet?.id] });
    },
  });

  const toggleMedCompleted = useMutation({
    mutationFn: (med: Medication) =>
      endpoints.update(activePet!.id, 'medications', med.id, {
        is_completed: !med.is_completed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', activePet?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activePet?.id] });
    },
  });

  const resetForms = () => {
    setVacName('');
    setVacNextDue('');
    setVacVet('');
    setVacNotes('');
    setMedName('');
    setMedDosage('');
    setMedFrequency('');
    setMedEndDate('');
    setMedNotes('');
    setVisitVet('');
    setVisitClinic('');
    setVisitReason('');
    setVisitDiag('');
    setVisitTreat('');
    setVisitNextDate('');
  };

  const handleSave = () => {
    if (activeTab === 'vaccinations') {
      if (!vacName.trim()) {
        Alert.alert('Required', 'Please enter a vaccine name');
        return;
      }
      createVacMutation.mutate({
        vaccine_name: vacName,
        date_administered: vacDate,
        next_due_date: vacNextDue || null,
        veterinarian: vacVet || null,
        notes: vacNotes || null,
      });
    } else if (activeTab === 'medications') {
      if (!medName.trim() || !medDosage.trim() || !medFrequency.trim()) {
        Alert.alert('Required', 'Please enter medication name, dosage and frequency');
        return;
      }
      createMedMutation.mutate({
        medication_name: medName,
        dosage: medDosage,
        frequency: medFrequency,
        start_date: medStartDate,
        end_date: medEndDate || null,
        notes: medNotes || null,
      });
    } else {
      if (!visitVet.trim()) {
        Alert.alert('Required', 'Please enter the veterinarian name');
        return;
      }
      createVisitMutation.mutate({
        veterinarian_name: visitVet,
        clinic_name: visitClinic || null,
        visit_date: visitDate,
        reason: visitReason || null,
        diagnosis: visitDiag || null,
        treatment: visitTreat || null,
        next_visit_date: visitNextDate || null,
      });
    }
  };

  const handleDelete = (resource: string, id: string, name: string) => {
    Alert.alert('Delete record', `Are you sure you want to remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteItemMutation.mutate({ resource, id }),
      },
    ]);
  };

  if (!activePet) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          title="No Pet Selected"
          subtitle="Please add or select a pet first to view health records."
        />
      </SafeAreaView>
    );
  }

  const isLoadingCurrent =
    (activeTab === 'vaccinations' && vacLoading) ||
    (activeTab === 'medications' && medLoading) ||
    (activeTab === 'visits' && visitLoading);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.petNameKicker}>{activePet.name}'s</Text>
          <Text style={styles.title}>Health Records</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Controls */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'vaccinations' && styles.tabItemActive]}
          onPress={() => setActiveTab('vaccinations')}>
          <Text style={[styles.tabText, activeTab === 'vaccinations' && styles.tabTextActive]}>
            Vaccines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'medications' && styles.tabItemActive]}
          onPress={() => setActiveTab('medications')}>
          <Text style={[styles.tabText, activeTab === 'medications' && styles.tabTextActive]}>
            Medications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'visits' && styles.tabItemActive]}
          onPress={() => setActiveTab('visits')}>
          <Text style={[styles.tabText, activeTab === 'visits' && styles.tabTextActive]}>
            Vet Visits
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List Area */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCurrent}
            onRefresh={() => {
              refetchVac();
              refetchMed();
              refetchVisits();
            }}
            tintColor={theme.colors.primary}
          />
        }>
        {/* VACCINATIONS TAB */}
        {activeTab === 'vaccinations' && (
          <View>
            {!vaccinations || vaccinations.length === 0 ? (
              <EmptyState
                title="No Vaccinations Logged"
                subtitle="Record Rabies, DHPP, FVRCP or other shots with administering dates and upcoming boosters."
              />
            ) : (
              vaccinations.map((vac) => (
                <View key={vac.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordTitle}>💉 {vac.vaccine_name}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete('vaccinations', vac.id, vac.vaccine_name)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.recordDate}>
                    Administered: {prettyDate(vac.date_administered)}
                  </Text>
                  {vac.next_due_date && (
                    <View style={styles.dueBox}>
                      <Text style={styles.dueText}>
                        Booster Due: {prettyDate(vac.next_due_date)}
                      </Text>
                    </View>
                  )}
                  {vac.veterinarian ? (
                    <Text style={styles.recordMeta}>Vet: {vac.veterinarian}</Text>
                  ) : null}
                  {vac.notes ? <Text style={styles.recordNotes}>{vac.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === 'medications' && (
          <View>
            {!medications || medications.length === 0 ? (
              <EmptyState
                title="No Medications Logged"
                subtitle="Keep track of ongoing prescriptions, dosages, schedules, and completion dates."
              />
            ) : (
              medications.map((med) => (
                <View key={med.id} style={[styles.recordCard, med.is_completed && styles.cardDimmed]}>
                  <View style={styles.recordHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle}>💊 {med.medication_name}</Text>
                      <Text style={styles.dosageText}>
                        {med.dosage} · {med.frequency}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete('medications', med.id, med.medication_name)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.medPeriodRow}>
                    <Text style={styles.recordDate}>
                      Period: {prettyDate(med.start_date)}
                      {med.end_date ? ` to ${prettyDate(med.end_date)}` : ' (Ongoing)'}
                    </Text>
                  </View>

                  {med.notes ? <Text style={styles.recordNotes}>{med.notes}</Text> : null}

                  <TouchableOpacity
                    style={[styles.statusToggle, med.is_completed && styles.statusToggleDone]}
                    onPress={() => toggleMedCompleted.mutate(med)}>
                    <Text style={[styles.statusToggleText, med.is_completed && styles.statusToggleTextDone]}>
                      {med.is_completed ? '✓ Completed Course' : 'Mark as Completed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* VET VISITS TAB */}
        {activeTab === 'visits' && (
          <View>
            {!visits || visits.length === 0 ? (
              <EmptyState
                title="No Veterinary Visits Logged"
                subtitle="Record checkups, diagnoses, treatments, and future visit reminders."
              />
            ) : (
              visits.map((v) => (
                <View key={v.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle}>
                        🏥 {v.reason || 'Veterinary Checkup'}
                      </Text>
                      <Text style={styles.clinicSub}>
                        {v.clinic_name ? `${v.clinic_name} · ` : ''}Dr. {v.veterinarian_name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete('visits', v.id, v.reason || 'Visit')}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.recordDate}>Date: {prettyDate(v.visit_date)}</Text>

                  {v.diagnosis ? (
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldLabel}>DIAGNOSIS</Text>
                      <Text style={styles.fieldVal}>{v.diagnosis}</Text>
                    </View>
                  ) : null}

                  {v.treatment ? (
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldLabel}>TREATMENT</Text>
                      <Text style={styles.fieldVal}>{v.treatment}</Text>
                    </View>
                  ) : null}

                  {v.next_visit_date && (
                    <View style={styles.dueBox}>
                      <Text style={styles.dueText}>
                        Next Appointment: {prettyDate(v.next_visit_date)}
                      </Text>
                    </View>
                  )}

                  {v.notes ? <Text style={styles.recordNotes}>{v.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'vaccinations'
                  ? 'Add Vaccination'
                  : activeTab === 'medications'
                    ? 'Add Medication'
                    : 'Add Veterinary Visit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {activeTab === 'vaccinations' && (
                <>
                  <Text style={styles.inputLabel}>Vaccine Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Rabies, DHPP, Bordetella"
                    value={vacName}
                    onChangeText={setVacName}
                  />

                  <Text style={styles.inputLabel}>Date Administered (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={vacDate}
                    onChangeText={setVacDate}
                  />

                  <Text style={styles.inputLabel}>Next Due / Booster Date (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    value={vacNextDue}
                    onChangeText={setVacNextDue}
                  />

                  <Text style={styles.inputLabel}>Veterinarian (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Dr. Ayşe Kaya"
                    value={vacVet}
                    onChangeText={setVacVet}
                  />

                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalArea]}
                    multiline
                    placeholder="e.g. 3-year dose, no adverse reaction"
                    value={vacNotes}
                    onChangeText={setVacNotes}
                  />
                </>
              )}

              {activeTab === 'medications' && (
                <>
                  <Text style={styles.inputLabel}>Medication Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Apoquel, Amoxicillin"
                    value={medName}
                    onChangeText={setMedName}
                  />

                  <Text style={styles.inputLabel}>Dosage *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 16 mg, 1 tablet"
                    value={medDosage}
                    onChangeText={setMedDosage}
                  />

                  <Text style={styles.inputLabel}>Frequency *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Once daily at 20:00, Every 12 hours"
                    value={medFrequency}
                    onChangeText={setMedFrequency}
                  />

                  <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={medStartDate}
                    onChangeText={setMedStartDate}
                  />

                  <Text style={styles.inputLabel}>End Date (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    value={medEndDate}
                    onChangeText={setMedEndDate}
                  />

                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalArea]}
                    multiline
                    placeholder="e.g. Give with meals"
                    value={medNotes}
                    onChangeText={setMedNotes}
                  />
                </>
              )}

              {activeTab === 'visits' && (
                <>
                  <Text style={styles.inputLabel}>Veterinarian Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Dr. Ayşe Kaya"
                    value={visitVet}
                    onChangeText={setVisitVet}
                  />

                  <Text style={styles.inputLabel}>Clinic / Hospital Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Paws & Care Clinic"
                    value={visitClinic}
                    onChangeText={setVisitClinic}
                  />

                  <Text style={styles.inputLabel}>Visit Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={visitDate}
                    onChangeText={setVisitDate}
                  />

                  <Text style={styles.inputLabel}>Reason for Visit</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Annual checkup, limp on left paw"
                    value={visitReason}
                    onChangeText={setVisitReason}
                  />

                  <Text style={styles.inputLabel}>Diagnosis</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Mild strain, dermatitis"
                    value={visitDiag}
                    onChangeText={setVisitDiag}
                  />

                  <Text style={styles.inputLabel}>Treatment Plan</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 5-day anti-inflammatory, rest"
                    value={visitTreat}
                    onChangeText={setVisitTreat}
                  />

                  <Text style={styles.inputLabel}>Next Visit Date (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    value={visitNextDate}
                    onChangeText={setVisitNextDate}
                  />
                </>
              )}

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSave}>
                <Text style={styles.modalSubmitText}>Save Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  petNameKicker: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  cardDimmed: {
    opacity: 0.65,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recordTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dosageText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  clinicSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteLink: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  medPeriodRow: {
    marginTop: 4,
  },
  recordDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  dueBox: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  recordMeta: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
  },
  recordNotes: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  fieldBox: {
    marginTop: 8,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 8,
    borderRadius: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  fieldVal: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 2,
  },
  statusToggle: {
    marginTop: 12,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusToggleDone: {
    backgroundColor: '#E6F4EA',
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusToggleTextDone: {
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color: theme.colors.textMuted,
    padding: 4,
  },
  modalForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: '#fff',
  },
  modalArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
