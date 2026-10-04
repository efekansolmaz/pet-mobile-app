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
import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import type { FeedingLog, NutritionPlan } from '@/types/models';
import { prettyDateTime } from '@/utils/dates';

export default function NutritionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  // Plan Form State
  const [foodName, setFoodName] = useState('');
  const [brand, setBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [planNotes, setPlanNotes] = useState('');

  // Log Form State
  const [logFoodName, setLogFoodName] = useState('');
  const [logAmount, setLogAmount] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const {
    data: plans,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['nutrition', id],
    queryFn: () => endpoints.list(id!, 'nutrition') as Promise<NutritionPlan[]>,
    enabled: Boolean(id),
  });

  const {
    data: feedings,
    isLoading: feedingsLoading,
    refetch: refetchFeedings,
  } = useQuery({
    queryKey: ['feedings', id],
    queryFn: () => endpoints.list(id!, 'feedings') as Promise<FeedingLog[]>,
    enabled: Boolean(id),
  });

  const createPlanMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(id!, 'nutrition', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setPlanModalVisible(false);
      setFoodName('');
      setBrand('');
      setAmount('');
      setFrequency('');
      setPlanNotes('');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => endpoints.remove(id!, 'nutrition', planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
    },
  });

  const logFeedingMutation = useMutation({
    mutationFn: (body: object) => endpoints.create(id!, 'feedings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedings', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setLogModalVisible(false);
      setLogAmount('');
      setLogNotes('');
    },
  });

  const handleSavePlan = () => {
    if (!foodName.trim() || !amount.trim() || !frequency.trim()) {
      Alert.alert('Required', 'Please fill food name, amount, and frequency');
      return;
    }
    createPlanMutation.mutate({
      food_name: foodName,
      brand: brand || null,
      feeding_amount: amount,
      feeding_frequency: frequency,
      notes: planNotes || null,
      is_active: true,
    });
  };

  const openLogModalForPlan = (p?: NutritionPlan) => {
    setLogFoodName(p ? p.food_name : plans && plans[0] ? plans[0].food_name : 'Daily Meal');
    setLogAmount(p ? p.feeding_amount.split('/')[0].trim() : '1 portion');
    setLogNotes('');
    setLogModalVisible(true);
  };

  const handleSaveLog = () => {
    if (!logFoodName.trim() || !logAmount.trim()) {
      Alert.alert('Required', 'Please fill food name and amount');
      return;
    }
    logFeedingMutation.mutate({
      food_name: logFoodName,
      amount: logAmount,
      fed_at: new Date().toISOString(),
      notes: logNotes || null,
    });
  };

  const isLoading = plansLoading || feedingsLoading;

  if (isLoading && !plans) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading nutrition..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Nutrition & Feeding</Text>
          <Text style={styles.screenSub}>Manage diet plans, portions and daily meal logs</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openLogModalForPlan()}>
          <Text style={styles.addBtnText}>+ Log Meal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchPlans();
              refetchFeedings();
            }}
            tintColor={theme.colors.primary}
          />
        }>
        {/* Active Diet Plans Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Diet & Nutrition Plans</Text>
          <TouchableOpacity onPress={() => setPlanModalVisible(true)}>
            <Text style={styles.sectionAction}>+ Add Plan</Text>
          </TouchableOpacity>
        </View>

        {!plans || plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>No Diet Plan Set</Text>
            <Text style={styles.emptyCardSub}>
              Define daily food brand, recommended amounts, and schedules (e.g. 2 meals a day).
            </Text>
            <TouchableOpacity
              style={styles.inlineAddBtn}
              onPress={() => setPlanModalVisible(true)}>
              <Text style={styles.inlineAddBtnText}>+ Create Diet Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((p) => (
            <View key={p.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>🥣 {p.food_name}</Text>
                  {p.brand ? <Text style={styles.foodBrand}>Brand: {p.brand}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => deletePlanMutation.mutate(p.id)}
                  style={{ padding: 4 }}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.planDetailsGrid}>
                <View style={styles.planDetailItem}>
                  <Text style={styles.planDetailLabel}>AMOUNT</Text>
                  <Text style={styles.planDetailVal}>{p.feeding_amount}</Text>
                </View>
                <View style={styles.planDetailItem}>
                  <Text style={styles.planDetailLabel}>SCHEDULE</Text>
                  <Text style={styles.planDetailVal}>{p.feeding_frequency}</Text>
                </View>
              </View>

              {p.notes ? <Text style={styles.planNotes}>{p.notes}</Text> : null}

              <TouchableOpacity
                style={styles.quickFeedBtn}
                onPress={() => openLogModalForPlan(p)}>
                <Text style={styles.quickFeedBtnText}>⚡ Log Feeding with this Diet</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Feeding History Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Feeding Logs ({feedings?.length || 0})</Text>
        </View>

        {!feedings || feedings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardSub}>No meals logged yet. Tap '+ Log Meal' to record a feeding.</Text>
          </View>
        ) : (
          feedings.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logIcon}>
                <Text style={{ fontSize: 18 }}>🥣</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logFood}>{log.food_name}</Text>
                <Text style={styles.logTime}>{prettyDateTime(log.fed_at)}</Text>
                {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
              </View>
              <View style={styles.logAmountBadge}>
                <Text style={styles.logAmountText}>{log.amount}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.disclaimerText}>
          ℹ️ Nutrition guidance is for tracking owner feeding routines. Consult a licensed veterinarian for specialized therapeutic diets.
        </Text>
      </ScrollView>

      {/* Plan Modal */}
      <Modal visible={planModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Nutrition Plan</Text>
              <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Food Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Adult Salmon & Rice Dry Food"
                value={foodName}
                onChangeText={setFoodName}
              />

              <Text style={styles.inputLabel}>Brand (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Acana, Royal Canin, Hill's"
                value={brand}
                onChangeText={setBrand}
              />

              <Text style={styles.inputLabel}>Daily Amount / Portion *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 200 g / day, 1 pouch"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>Feeding Schedule / Frequency *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Twice daily at 08:00 and 19:00"
                value={frequency}
                onChangeText={setFrequency}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.modalArea]}
                multiline
                placeholder="e.g. Soak in warm water, keep fresh water available"
                value={planNotes}
                onChangeText={setPlanNotes}
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSavePlan}>
                <Text style={styles.modalSubmitText}>Save Diet Plan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Log Modal */}
      <Modal visible={logModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log a Feeding</Text>
              <TouchableOpacity onPress={() => setLogModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Food Given *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Dry Food, Chicken Treat"
                value={logFoodName}
                onChangeText={setLogFoodName}
              />

              <Text style={styles.inputLabel}>Amount Given *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 100 g, 1 pouch"
                value={logAmount}
                onChangeText={setLogAmount}
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ate eagerly, finished whole bowl"
                value={logNotes}
                onChangeText={setLogNotes}
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveLog}>
                <Text style={styles.modalSubmitText}>Save Feeding Log</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionAction: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyCardSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  inlineAddBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  inlineAddBtnText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  foodBrand: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteLink: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  planDetailsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 10,
    borderRadius: 8,
    gap: 12,
  },
  planDetailItem: {
    flex: 1,
  },
  planDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  planDetailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  planNotes: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  quickFeedBtn: {
    marginTop: 12,
    backgroundColor: '#E6F4EA',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickFeedBtnText: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    gap: 12,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logFood: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  logTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  logNotes: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  logAmountBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
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
    marginTop: 10,
    marginBottom: 4,
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
    marginBottom: 24,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
