// Ставит уведомления из planReminders на телефоне. В браузере ничего не делает.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { Planned } from './reminders';

const CHANNEL = 'daily';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Заменяет все запланированные уведомления новыми. Разрешение спрашивает один раз. */
export async function scheduleReminders(plan: Planned[]): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Пословица дня и напоминания', importance: AndroidImportance.DEFAULT });
    }
    let { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && canAskAgain) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const n of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: n.title, body: n.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNEL },
      });
    }
  } catch {
    // Уведомления не главное: если что-то пошло не так, приложение работает дальше
  }
}
