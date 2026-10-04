import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { Reminder } from '@/types/models';

let Notifications: any = null;

// Expo SDK 53+ removed remote/push notification modules on Android in Expo Go
// We check if running in Expo Go client and only load notifications in custom/dev builds
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    Notifications = null;
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Notifications || !Device.isDevice) return false;
  try {
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
  } catch {
    return false;
  }
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<void> {
  if (!Notifications) {
    // Graceful fallback for Expo Go: reminders remain stored in backend and dashboard UI
    return;
  }
  const allowed = await ensureNotificationPermissions();
  if (!allowed || reminder.completed) return;
  const triggerDate = new Date(reminder.due_at);
  if (triggerDate.getTime() <= Date.now()) return;

  const repeat = reminder.repeat_rule;
  const trigger =
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

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.description || 'PetCare reminder',
        data: { reminderId: reminder.id, petId: reminder.pet_id, channel: 'local' },
      },
      trigger,
    });
  } catch {
    // Ignore notification errors in unsupported environments
  }
}
