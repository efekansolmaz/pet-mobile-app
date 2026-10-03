import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/types/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pet reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return status === 'granted';
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<void> {
  const allowed = await ensureNotificationPermissions();
  if (!allowed || reminder.completed) return;
  const triggerDate = new Date(reminder.due_at);
  if (triggerDate.getTime() <= Date.now()) return;

  const repeat = reminder.repeat_rule;
  const trigger: Notifications.NotificationTriggerInput =
    repeat === 'daily'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: triggerDate.getHours(),
          minute: triggerDate.getMinutes(),
        }
      : repeat === 'weekly'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: triggerDate.getDay() + 1,
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description || 'PetCare reminder',
      data: { reminderId: reminder.id, petId: reminder.pet_id, channel: 'local' },
    },
    trigger,
  });
}
