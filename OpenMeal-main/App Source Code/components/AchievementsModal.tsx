import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AchievementsService, { AchievementProgress } from '@/services/AchievementsService';
import { FadeInView } from '@/components/FadeInView';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AchievementsModal({ visible, onClose }: AchievementsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [items, setItems] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const progress = await AchievementsService.getProgress();
        setItems(progress);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible]);

  const unlockedCount = items.filter(item => item.unlocked).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="headline" style={styles.headerTitle}>Achievements</ThemedText>
          <View style={styles.closeButton} />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.text + '15' }]}>
          <ThemedText type="label">Progress</ThemedText>
          <ThemedText type="title" style={styles.summaryValue}>{unlockedCount}/{items.length}</ThemedText>
          <ThemedText type="caption">Unlock badges by logging meals, recipes, and movement.</ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <FadeInView key={item.id} delay={index * 35}>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: item.unlocked ? colors.tint + '55' : colors.text + '12',
                      opacity: item.unlocked ? 1 : 0.72,
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.unlocked ? colors.tint + '18' : colors.text + '08' }]}>
                    <IconSymbol name={item.icon as any} size={22} color={item.unlocked ? colors.tint : colors.text + '70'} />
                  </View>
                  <View style={styles.cardText}>
                    <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                    <ThemedText type="caption">{item.description}</ThemedText>
                  </View>
                  {item.unlocked ? (
                    <IconSymbol name="checkmark.seal.fill" size={20} color={colors.tint} />
                  ) : (
                    <IconSymbol name="lock.fill" size={18} color={colors.text + '40'} />
                  )}
                </View>
              </FadeInView>
            ))}
          </ScrollView>
        )}
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
    gap: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
});
