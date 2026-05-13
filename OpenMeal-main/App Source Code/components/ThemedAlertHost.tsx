import React, { useEffect, useState } from 'react';
import {
  DeviceEventEmitter,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { ThemedAlertPayload } from '@/services/ThemedAlert';

export function ThemedAlertHost() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const [alert, setAlert] = useState<ThemedAlertPayload | null>(null);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'themedAlert',
      (payload: ThemedAlertPayload) => {
        setAlert(payload);
      }
    );

    return () => subscription.remove();
  }, []);

  const close = () => setAlert(null);

  const handlePress = (button: ThemedAlertPayload['buttons'][number]) => {
    close();
    button.onPress?.();
  };

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              width: Math.min(width - DesignTokens.space.xl * 2, 420),
              backgroundColor: colors.cardBackground,
              borderColor: colors.text + '14',
            },
          ]}
        >
          {alert ? (
            <>
              <ThemedText type="headline" style={styles.title}>
                {alert.title}
              </ThemedText>
              {alert.message ? (
                <ThemedText type="caption" style={styles.message}>
                  {alert.message}
                </ThemedText>
              ) : null}
              <View style={styles.actions}>
                {alert.buttons.map((button: ThemedAlertPayload['buttons'][number], index: number) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';
                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      onPress={() => handlePress(button)}
                      style={[
                        styles.button,
                        { minHeight: DesignTokens.minTouch, justifyContent: 'center' },
                        isCancel
                          ? {
                              backgroundColor: colors.text + '10',
                            }
                          : {
                              backgroundColor: isDestructive ? '#D64545' : colors.tint,
                            },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.buttonText,
                          {
                            color: isCancel ? colors.text : colors.background,
                          },
                        ]}
                      >
                        {button.text}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.space.xl,
  },
  card: {
    borderWidth: 1,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.space.xl,
    gap: 12,
  },
  title: {
    textAlign: 'left',
  },
  message: {
    opacity: 0.82,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'TikTokSans-SemiBold',
    fontSize: 15,
  },
});
