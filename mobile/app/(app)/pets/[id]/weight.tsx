import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
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

import { LoadingState } from '@/components/States';
import { WeightChart } from '@/components/WeightChart';
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import type { WeightRecord, WeightStats } from '@/types/models';
import { prettyDate } from '@/utils/dates';

export default function WeightTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState('');

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['weights', id],
    queryFn: () => endpoints.list(id!, 'weights') as Promise<WeightStats>,
    enabled: Boolean(id),
  });

  const addWeightMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(id!, 'weights', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights', id] });
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setModalVisible(false);
      setWeightInput('');
      setNotesInput('');
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: (weightId: string) => endpoints.remove(id!, 'weights', weightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights', id] });
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
    },
  });

  const handleSaveWeight = () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (e.g. 12.4)');
      return;
    }
    addWeightMutation.mutate({
      weight: val,
      recorded_at: new Date(dateInput).toISOString(),
      notes: notesInput || null,
    });
  };

  const handleDelete = (item: WeightRecord) => {
    Alert.alert('Delete Measurement', `Delete weigh-in of ${item.weight} kg?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWeightMutation.mutate(item.id),
      },
    ]);
  };

  if (isLoading || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading weight history..." />
      </SafeAreaView>
    );
  }

  const records = stats.records || [];
  const current = stats.current;
  const min = stats.minimum;
  const max = stats.maximum;
  const delta = stats.change_from_previous;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header action */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Weight Tracking</Text>
          <Text style={styles.screenSub}>Monitor physical growth & body condition trends</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Log Weight</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }>
        {/* KPI Stats Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>CURRENT</Text>
            <Text style={styles.kpiValue}>{current ? `${current} kg` : '—'}</Text>
            {delta !== null && delta !== undefined && (
              <Text
                style={[
                  styles.kpiDelta,
                  delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaNeutral,
                ]}>
                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} kg
              </Text>
            )}
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>MINIMUM</Text>
            <Text style={styles.kpiValue}>{min ? `${min} kg` : '—'}</Text>
            <Text style={styles.kpiSub}>Lowest recorded</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>MAXIMUM</Text>
            <Text style={styles.kpiValue}>{max ? `${max} kg` : '—'}</Text>
            <Text style={styles.kpiSub}>Peak recorded</Text>
          </View>
        </View>

        {/* Visual Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartHeading}>Weight Trend Chart</Text>
          <WeightChart records={records} />
          <Text style={styles.chartDisclaimer}>
            💡 Chart displays recorded trend line. Not intended for automated medical diagnoses.
          </Text>
        </View>

        {/* Measurement History Log */}
        <View style={styles.historyCard}>
          <Text style={styles.historyHeading}>Historical Measurements ({records.length})</Text>

          {records.length === 0 ? (
            <Text style={styles.emptyText}>
              No weigh-in records found. Tap '+ Log Weight' to record your pet's current weight.
            </Text>
          ) : (
            records.slice().reverse().map((rec) => (
              <View key={rec.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.rowWeight}>{rec.weight} kg</Text>
                  <Text style={styles.rowDate}>{prettyDate(rec.recorded_at)}</Text>
                  {rec.notes ? <Text style={styles.rowNotes}>{rec.notes}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(rec)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Weight Measurement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Weight (in kg) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 12.4"
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
                autoFocus
              />

              <Text style={styles.inputLabel}>Measurement Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={dateInput}
                onChangeText={setDateInput}
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Weighed before breakfast at vet"
                value={notesInput}
                onChangeText={setNotesInput}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                disabled={addWeightMutation.isPending}
                onPress={handleSaveWeight}>
                <Text style={styles.modalSubmitText}>
                  {addWeightMutation.isPending ? 'Saving...' : 'Save Weigh-In'}
                </Text>
              </TouchableOpacity>
            </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  screenSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 4,
  },
  kpiDelta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  deltaUp: { color: theme.colors.primary },
  deltaDown: { color: theme.colors.accent },
  deltaNeutral: { color: theme.colors.textMuted },
  kpiSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  chartHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  chartDisclaimer: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    paddingVertical: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
  },
  rowWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowNotes: {
    fontSize: 12,
    color: theme.colors.text,
    fontStyle: 'italic',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
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
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
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
    marginBottom: 20,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
