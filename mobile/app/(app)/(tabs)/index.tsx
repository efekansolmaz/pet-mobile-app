import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
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
import { endpoints, mediaUrl } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { usePetStore } from '@/stores/pets';
import type { Dashboard, Pet, Reminder } from '@/types/models';
import { greeting, petAge, prettyDate, prettyDateTime, relative } from '@/utils/dates';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: pets, isLoading: petsLoading, refetch: refetchPets } = usePets();

  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const setSelectedPetId = usePetStore((state) => state.setSelectedPetId);

  const activePet = useMemo(() => {
    if (!pets || pets.length === 0) return null;
    return pets.find((p) => p.id === selectedPetId) ?? pets[0];
  }, [pets, selectedPetId]);

  const {
    data: dashboard,
    isLoading: dashLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard', activePet?.id],
    queryFn: () => endpoints.dashboard(activePet!.id) as Promise<Dashboard>,
    enabled: Boolean(activePet?.id),
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ reminder }: { reminder: Reminder }) => {
      return endpoints.update(reminder.pet_id, 'reminders', reminder.id, {
        completed: !reminder.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const handleRefresh = async () => {
    await Promise.all([refetchPets(), refetchDashboard()]);
  };

  if (petsLoading && !pets) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading your pet care dashboard..." />
      </SafeAreaView>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Text style={styles.userName}>{user?.name || 'Pet Parent'}</Text>
        </View>
        <EmptyState
          title="No Pets Yet"
          subtitle="Add your dog, cat, or other companions to start tracking their health passport, vaccinations, and weight."
        />
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={styles.addPetBtn}
            onPress={() => router.push('/(app)/pets/new')}>
            <Text style={styles.addPetBtnText}>+ Add Your First Pet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const upcomingVaccine = dashboard?.upcoming_vaccination;
  const activeMedications = dashboard?.active_medications || [];
  const upcomingVisit = dashboard?.upcoming_visit;
  const todaysReminders = dashboard?.todays_reminders || [];
  const todaysFeedings = dashboard?.todays_feedings || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={dashLoading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name || 'Pet Parent'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/profile')}
            style={styles.profileBadge}>
            <Text style={styles.profileInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pet Switcher Horizontal Bar */}
        <View style={styles.petBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petBarScroll}>
            {pets.map((p) => {
              const isSelected = p.id === activePet?.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPetId(p.id)}
                  style={[styles.petChip, isSelected && styles.petChipSelected]}>
                  <Text style={styles.petChipIcon}>{p.species === 'cat' ? '🐱' : '🐶'}</Text>
                  <Text style={[styles.petChipName, isSelected && styles.petChipNameSelected]}>{p.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => router.push('/(app)/pets/new')}
              style={styles.addPetChip}>
              <Text style={styles.addPetChipText}>+ Add Pet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Main Pet Hero Card */}
        {activePet && (
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              {activePet.photo_url ? (
                <Image source={{ uri: mediaUrl(activePet.photo_url) }} style={styles.heroAvatar} />
              ) : (
                <View style={styles.heroAvatarPlaceholder}>
                  <Text style={styles.heroAvatarEmoji}>{activePet.species === 'cat' ? '🐱' : '🐶'}</Text>
                </View>
              )}
              <View style={styles.heroDetails}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{activePet.name}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/pets/${activePet.id}`)}
                    style={styles.viewPetLink}>
                    <Text style={styles.viewPetLinkText}>Details →</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.heroBreed}>
                  {activePet.breed || activePet.species} · {petAge(activePet.birth_date)}
                </Text>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightBadgeText}>
                    ⚖️ {activePet.weight ? `${activePet.weight} kg` : 'No weight logged'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Summary Highlights */}
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>VACCINATION</Text>
                <Text style={styles.highlightValue}>
                  {upcomingVaccine ? relative(upcomingVaccine.next_due_date) : 'Up to date'}
                </Text>
                <Text style={styles.highlightSub}>
                  {upcomingVaccine ? upcomingVaccine.vaccine_name : 'No pending shots'}
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>MEDICATION</Text>
                <Text style={styles.highlightValue}>
                  {activeMedications.length > 0 ? `${activeMedications.length} Active` : 'None active'}
                </Text>
                <Text style={styles.highlightSub} numberOfLines={1}>
                  {activeMedications.length > 0 ? activeMedications[0].medication_name : 'All clear'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => activePet && router.push(`/(app)/pets/${activePet.id}/passport`)}>
            <Text style={styles.actionEmoji}>🛂</Text>
            <Text style={styles.actionTitle}>Passport</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => activePet && router.push(`/(app)/pets/${activePet.id}/weight`)}>
            <Text style={styles.actionEmoji}>⚖️</Text>
            <Text style={styles.actionTitle}>Weight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => activePet && router.push(`/(app)/pets/${activePet.id}/nutrition`)}>
            <Text style={styles.actionEmoji}>🥣</Text>
            <Text style={styles.actionTitle}>Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(app)/(tabs)/assistant')}>
            <Text style={styles.actionEmoji}>🤖</Text>
            <Text style={styles.actionTitle}>AI Advice</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule & Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Reminders</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/reminders')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {todaysReminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>✨ All tasks completed for today!</Text>
            </View>
          ) : (
            todaysReminders.map((rem) => (
              <TouchableOpacity
                key={rem.id}
                style={[styles.reminderItem, rem.completed && styles.reminderCompleted]}
                onPress={() => toggleReminderMutation.mutate({ reminder: rem })}>
                <View style={[styles.checkbox, rem.completed && styles.checkboxChecked]}>
                  {rem.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.reminderContent}>
                  <Text style={[styles.reminderTitle, rem.completed && styles.textStrikethrough]}>
                    {rem.title}
                  </Text>
                  <Text style={styles.reminderTime}>{prettyDateTime(rem.due_at)}</Text>
                </View>
                <View style={styles.reminderTypeBadge}>
                  <Text style={styles.reminderTypeText}>{rem.type}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Veterinary Visit */}
        {upcomingVisit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Vet Visit</Text>
            <View style={styles.visitCard}>
              <View style={styles.visitDateBadge}>
                <Text style={styles.visitDateEmoji}>🏥</Text>
              </View>
              <View style={styles.visitInfo}>
                <Text style={styles.visitClinic}>{upcomingVisit.clinic_name || 'Veterinary Clinic'}</Text>
                <Text style={styles.visitVet}>With {upcomingVisit.veterinarian_name}</Text>
                <Text style={styles.visitDateText}>Due: {prettyDate(upcomingVisit.next_visit_date || upcomingVisit.visit_date)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Nutrition & Feeding */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Feeding</Text>
            <TouchableOpacity
              onPress={() => activePet && router.push(`/(app)/pets/${activePet.id}/nutrition`)}>
              <Text style={styles.sectionLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {todaysFeedings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No feedings logged yet today</Text>
            </View>
          ) : (
            todaysFeedings.map((f) => (
              <View key={f.id} style={styles.feedingItem}>
                <Text style={styles.feedingIcon}>🥣</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedingName}>{f.food_name}</Text>
                  <Text style={styles.feedingMeta}>{prettyDateTime(f.fed_at)}</Text>
                </View>
                <Text style={styles.feedingAmount}>{f.amount}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Health Activity */}
        {dashboard?.recent_visits && dashboard.recent_visits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Health Activity</Text>
            {dashboard.recent_visits.slice(0, 2).map((v) => (
              <View key={v.id} style={styles.activityCard}>
                <Text style={styles.activityReason}>{v.reason || 'Veterinary Consultation'}</Text>
                {v.diagnosis ? (
                  <Text style={styles.activityDiag}>Diagnosis: {v.diagnosis}</Text>
                ) : null}
                <Text style={styles.activityDate}>
                  {prettyDate(v.visit_date)} · {v.clinic_name || v.veterinarian_name}
                </Text>
              </View>
            ))}
          </View>
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
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  petBar: {
    marginBottom: 16,
  },
  petBarScroll: {
    gap: 8,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  petChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  petChipIcon: {
    fontSize: 16,
  },
  petChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  petChipNameSelected: {
    color: '#fff',
  },
  addPetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPetChipText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  heroAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarEmoji: {
    fontSize: 34,
  },
  heroDetails: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  viewPetLink: {
    paddingVertical: 2,
  },
  viewPetLinkText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  heroBreed: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  weightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  weightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  highlightsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 16,
    paddingTop: 12,
    gap: 12,
  },
  highlightItem: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  highlightSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  section: {
    marginBottom: 20,
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
  sectionLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyCardText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    gap: 12,
  },
  reminderCompleted: {
    opacity: 0.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontWeight: '700',
    fontSize: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
  },
  reminderTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  reminderTypeBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reminderTypeText: {
    fontSize: 11,
    color: theme.colors.primaryDark,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
  },
  visitDateBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitDateEmoji: {
    fontSize: 22,
  },
  visitInfo: {
    flex: 1,
  },
  visitClinic: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  visitVet: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  visitDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 4,
  },
  feedingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
    gap: 10,
  },
  feedingIcon: {
    fontSize: 20,
  },
  feedingName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  feedingMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  feedingAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  activityReason: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  activityDiag: {
    fontSize: 13,
    color: theme.colors.accent,
    marginTop: 2,
    fontWeight: '500',
  },
  activityDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  addPetBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 12,
  },
  addPetBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
