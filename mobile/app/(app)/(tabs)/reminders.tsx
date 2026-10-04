import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
import type { Reminder } from '@/types/models';
import { prettyDateTime } from '@/utils/dates';
import { scheduleReminderNotification } from '@/utils/notifications';

const REMINDER_TYPES = [
  { id: 'vaccination', label: 'Vaccination', icon: '💉' },
  { id: 'medication', label: 'Medication', icon: '💊' },
  { id: 'veterinary_visit', label: 'Vet Visit', icon: '🏥' },
  { id: 'parasite_treatment', label: 'Parasite Treatment', icon: '🐛' },
  { id: 'grooming', label: 'Grooming', icon: '✂️' },
  { id: 'feeding', label: 'Feeding', icon: '🥣' },
  { id: 'custom', label: 'Custom', icon: '⏰' },
];

const REPEAT_RULES = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function RemindersScreen() {
  const queryClient = useQueryClient();
  const { data: pets } = usePets();
  const { pet: activePet } = useSelectedPet();

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [targetPetId, setTargetPetId] = useState<string>('');
  const [remType, setRemType] = useState('medication');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 16));
  const [repeatRule, setRepeatRule] = useState('none');

  const {
    data: allReminders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['allReminders'],
    queryFn: () => endpoints.allReminders() as Promise<Reminder[]>,
  });

  const createReminderMutation = useMutation({
    mutationFn: async (payload: { petId: string; data: object }) => {
      const created = (await endpoints.create(
        payload.petId,
        'reminders',
        payload.data
      )) as Reminder;
      await scheduleReminderNotification(created).catch(() => {});
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalVisible(false);
      resetForm();
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: (reminder: Reminder) =>
      endpoints.update(reminder.pet_id, 'reminders', reminder.id, {
        completed: !reminder.completed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (reminder: Reminder) =>
      endpoints.remove(reminder.pet_id, 'reminders', reminder.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().slice(0, 16));
    setRepeatRule('none');
    setRemType('medication');
  };

  const openCreateModal = () => {
    setTargetPetId(activePet?.id || (pets && pets[0]?.id) || '');
    resetForm();
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a reminder title');
      return;
    }
    if (!targetPetId) {
      Alert.alert('Required', 'Please select a pet');
      return;
    }
    // format due_at iso
    let isoDate = dueDate;
    if (!isoDate.includes('Z') && !isoDate.includes('+')) {
      isoDate = new Date(dueDate).toISOString();
    }
    createReminderMutation.mutate({
      petId: targetPetId,
      data: {
        type: remType,
        title,
        description: description || null,
        due_at: isoDate,
        repeat_rule: repeatRule,
      },
    });
  };

  const handleDelete = (rem: Reminder) => {
    Alert.alert('Delete Reminder', `Delete "${rem.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReminderMutation.mutate(rem),
      },
    ]);
  };

  const filteredReminders = useMemo(() => {
    if (!allReminders) return [];
    if (filter === 'upcoming') return allReminders.filter((r) => !r.completed);
    if (filter === 'completed') return allReminders.filter((r) => r.completed);
    return allReminders;
  }, [allReminders, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Care Reminders</Text>
          <Text style={styles.subtitle}>Scheduled treatments, medications & alerts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['upcoming', 'completed', 'all'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}>
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reminders List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }>
        {isLoading && !allReminders ? (
          <LoadingState label="Loading reminders..." />
        ) : filteredReminders.length === 0 ? (
          <EmptyState
            title={filter === 'completed' ? 'No Completed Tasks' : 'All Clear!'}
            subtitle={
              filter === 'completed'
                ? 'Tasks marked done will be shown here.'
                : 'No pending reminders for your pets right now. Tap "+ New" to set one.'
            }
          />
        ) : (
          filteredReminders.map((rem) => {
            const petObj = pets?.find((p) => p.id === rem.pet_id);
            const typeInfo = REMINDER_TYPES.find((t) => t.id === rem.type);
            return (
              <View key={rem.id} style={[styles.reminderCard, rem.completed && styles.cardCompleted]}>
                <TouchableOpacity
                  style={[styles.checkbox, rem.completed && styles.checkboxChecked]}
                  onPress={() => toggleCompleteMutation.mutate(rem)}>
                  {rem.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                <View style={styles.reminderBody}>
                  <View style={styles.topInfo}>
                    <Text style={styles.typeTag}>
                      {typeInfo?.icon || '⏰'} {typeInfo?.label || rem.type}
                    </Text>
                    {petObj && <Text style={styles.petTag}>🐾 {petObj.name}</Text>}
                  </View>

                  <Text style={[styles.remTitle, rem.completed && styles.titleCrossed]}>
                    {rem.title}
                  </Text>
                  {rem.description ? (
                    <Text style={styles.remDesc}>{rem.description}</Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Text style={styles.dueText}>⏰ {prettyDateTime(rem.due_at)}</Text>
                    {rem.repeat_rule !== 'none' && (
                      <Text style={styles.repeatBadge}>🔁 {rem.repeat_rule}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDelete(rem)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Care Reminder</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Pet Selection */}
              {pets && pets.length > 1 && (
                <>
                  <Text style={styles.inputLabel}>Select Pet</Text>
                  <View style={styles.pillRow}>
                    {pets.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.pill, targetPetId === p.id && styles.pillActive]}
                        onPress={() => setTargetPetId(p.id)}>
                        <Text style={[styles.pillText, targetPetId === p.id && styles.pillTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Type Selection */}
              <Text style={styles.inputLabel}>Reminder Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                {REMINDER_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeChip, remType === t.id && styles.typeChipActive]}
                    onPress={() => setRemType(t.id)}>
                    <Text style={styles.typeChipIcon}>{t.icon}</Text>
                    <Text style={[styles.typeChipLabel, remType === t.id && styles.typeChipLabelActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Give flea treatment, Rabies vaccine"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 1 pipette after dinner"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Due Date & Time (YYYY-MM-DDTHH:MM)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2026-10-04T18:00"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <Text style={styles.inputLabel}>Repeat Frequency</Text>
              <View style={styles.pillRow}>
                {REPEAT_RULES.map((rule) => (
                  <TouchableOpacity
                    key={rule.id}
                    style={[styles.pill, repeatRule === rule.id && styles.pillActive]}
                    onPress={() => setRepeatRule(rule.id)}>
                    <Text style={[styles.pillText, repeatRule === rule.id && styles.pillTextActive]}>
                      {rule.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSave}>
                <Text style={styles.modalSubmitText}>Set Reminder</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  filterTextActive: {
    color: '#fff',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    gap: 12,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  reminderBody: {
    flex: 1,
  },
  topInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  typeTag: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  petTag: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  remTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  titleCrossed: {
    textDecorationLine: 'line-through',
  },
  remDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  repeatBadge: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
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
    marginBottom: 6,
    marginTop: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  typeScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
    marginRight: 8,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: theme.colors.primary,
  },
  typeChipIcon: {
    fontSize: 16,
  },
  typeChipLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  typeChipLabelActive: {
    color: '#fff',
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
