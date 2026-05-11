import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AchievementsService from './AchievementsService';

export interface JoggingReminder {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
}

const REMINDERS_KEY = '@OpenMeal/joggingReminders';
const SESSIONS_KEY = '@OpenMeal/joggingSessions';
const NOTIFICATION_CHANNEL_ID = 'jogging-reminders';

const DEFAULT_REMINDERS: JoggingReminder[] = [
  { id: 'morning_jog', name: 'Morning Jog', time: '06:30', enabled: true },
  { id: 'evening_walk', name: 'Evening Walk', time: '17:30', enabled: false },
];

class JoggingRemindersService {
  private initialized = false;
  private scheduledNotifications = new Set<string>();

  async initialize() {
    if (this.initialized) {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Jogging Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 120, 180],
        lightColor: '#2E7D32',
        sound: 'default',
      });
    }

    await this.loadAndRescheduleNotifications();
    this.initialized = true;
  }

  async getReminders(): Promise<JoggingReminder[]> {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_KEY);
      if (!stored) {
        await this.saveReminders(DEFAULT_REMINDERS);
        return DEFAULT_REMINDERS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_REMINDERS;
    }
  }

  async saveReminders(reminders: JoggingReminder[]): Promise<void> {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  async getPermissionStatus(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (status === 'granted') {
      const reminders = await this.getReminders();
      for (const reminder of reminders) {
        if (reminder.enabled) {
          await this.scheduleNotification(reminder);
        }
      }
    }

    return status === 'granted';
  }

  async toggleReminder(id: string, enabled: boolean): Promise<void> {
    const reminders = await this.getReminders();
    const updated = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled } : reminder
    );
    await this.saveReminders(updated);

    if (enabled && (await this.getPermissionStatus())) {
      const reminder = updated.find(item => item.id === id);
      if (reminder) {
        await this.scheduleNotification(reminder);
      }
    } else {
      await this.cancelNotification(id);
    }
  }

  async updateReminderTime(id: string, time: string): Promise<void> {
    const reminders = await this.getReminders();
    const updated = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, time } : reminder
    );
    await this.saveReminders(updated);
    await this.cancelNotification(id);
    const reminder = updated.find(item => item.id === id);
    if (reminder?.enabled && (await this.getPermissionStatus())) {
      await this.scheduleNotification(reminder);
    }
  }

  async completeSession(): Promise<number> {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    const totalSessions = stored ? Number(stored) + 1 : 1;
    await AsyncStorage.setItem(SESSIONS_KEY, String(totalSessions));
    await AchievementsService.recordJogSession(totalSessions);
    return totalSessions;
  }

  async getSessionCount(): Promise<number> {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    return stored ? Number(stored) : 0;
  }

  private async loadAndRescheduleNotifications() {
    const reminders = await this.getReminders();
    if (!(await this.getPermissionStatus())) {
      return;
    }

    for (const reminder of reminders) {
      if (reminder.enabled) {
        await this.scheduleNotification(reminder);
      }
    }
  }

  private async scheduleNotification(reminder: JoggingReminder): Promise<void> {
    if (this.scheduledNotifications.has(reminder.id)) {
      await this.cancelNotification(reminder.id);
    }

    const timeMatch = reminder.time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return;
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= new Date(now.getTime() + 5 * 60 * 1000)) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${reminder.name} time`,
        body: 'Lace up, move for 20 minutes, and mark your session when you are done.',
        data: {
          reminderId: reminder.id,
          action: 'open_jogging',
          timestamp: Date.now(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          android: {
            smallIcon: 'ic_notification',
          },
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledTime,
      },
      identifier: reminder.id,
    });

    this.scheduledNotifications.add(reminder.id);
  }

  private async cancelNotification(reminderId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
    this.scheduledNotifications.delete(reminderId);
  }
}

export default new JoggingRemindersService();
