import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import JoggingRemindersService, { JoggingReminder } from '@/services/JoggingRemindersService';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';

interface JoggingRemindersModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoggingRemindersModal({ visible, onClose }: JoggingRemindersModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [hasPermission, setHasPermission] = useState(false);
  const [reminders, setReminders] = useState<JoggingReminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<JoggingReminder | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await JoggingRemindersService.initialize();
        setHasPermission(await JoggingRemindersService.getPermissionStatus());
        setReminders(await JoggingRemindersService.getReminders());
        setSessionCount(await JoggingRemindersService.getSessionCount());
      } catch {
        Alert.alert('Unable to load', 'Jogging reminders could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible]);

  const requestPermission = async () => {
    try {
      const granted = await JoggingRemindersService.requestPermissions();
      setHasPermission(granted);
      if (!granted) {
        Alert.alert('Notifications needed', 'Enable notifications to receive jogging reminders.');
      }
    } catch {
      Alert.alert('Unable to enable', 'Notification permission could not be updated.');
    }
  };

  const toggleReminder = async (reminder: JoggingReminder, enabled: boolean) => {
    try {
      await JoggingRemindersService.toggleReminder(reminder.id, enabled);
      setReminders(await JoggingRemindersService.getReminders());
    } catch {
      Alert.alert('Unable to update', 'That reminder could not be updated.');
    }
  };

  const saveTime = async (time: Date) => {
    if (!selectedReminder) {
      return;
    }

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    try {
      await JoggingRemindersService.updateReminderTime(selectedReminder.id, `${hours}:${minutes}`);
      setReminders(await JoggingRemindersService.getReminders());
    } catch {
      Alert.alert('Unable to save', 'The reminder time could not be saved.');
    } finally {
      setShowTimePicker(false);
      setSelectedReminder(null);
    }
  };

  const completeSession = async () => {
    try {
      const total = await JoggingRemindersService.completeSession();
      setSessionCount(total);
      Alert.alert('Session logged', 'Nice work. Your movement streak is growing.');
    } catch {
      Alert.alert('Unable to log', 'Your session could not be saved.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="headline" style={styles.headerTitle}>Jogging</ThemedText>
          <View style={styles.closeButton} />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.text + '15' }]}>
          <ThemedText type="label">Completed sessions</ThemedText>
          <ThemedText type="title" style={styles.summaryValue}>{sessionCount}</ThemedText>
          <ThemedText type="caption">Short daily movement keeps your energy and recovery on track.</ThemedText>
        </View>

        {!hasPermission ? (
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.tint }]} onPress={requestPermission}>
            <ThemedText style={[styles.permissionButtonText, { color: colors.background }]}>Enable jogging reminders</ThemedText>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {reminders.map(reminder => (
              <View
                key={reminder.id}
                style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.text + '12' }]}
              >
                <View style={styles.cardText}>
                  <ThemedText type="defaultSemiBold">{reminder.name}</ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReminder(reminder);
                      setShowTimePicker(true);
                    }}
                  >
                    <ThemedText type="caption" style={{ color: colors.tint }}>{reminder.time}</ThemedText>
                  </TouchableOpacity>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={value => toggleReminder(reminder, value)}
                  trackColor={{ false: colors.text + '20', true: colors.tint + '55' }}
                  thumbColor={reminder.enabled ? colors.tint : colors.background}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: colors.text }]}
              onPress={completeSession}
            >
              <ThemedText style={[styles.completeButtonText, { color: colors.background }]}>Mark session complete</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        )}

        <DateTimePickerModal
          visible={showTimePicker}
          mode="time"
          title="Reminder time"
          initialDate={(() => {
            if (!selectedReminder) {
              return new Date();
            }
            const [hours, minutes] = selectedReminder.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          onClose={() => {
            setShowTimePicker(false);
            setSelectedReminder(null);
          }}
          onSave={saveTime}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    gap: 4,
  },
  summaryValue: {
    marginTop: 4,
  },
  permissionButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionButtonText: {
    fontFamily: 'TikTokSans-SemiBold',
    fontSize: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardText: {
    gap: 4,
  },
  completeButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    fontFamily: 'TikTokSans-Bold',
    fontSize: 16,
  },
});
