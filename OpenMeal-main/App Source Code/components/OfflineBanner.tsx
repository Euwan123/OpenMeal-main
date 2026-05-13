import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    NetInfo.fetch().then(state => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setOffline(!connected);
    });
    const unsub = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setOffline(!connected);
    });
    return () => unsub();
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + DesignTokens.space.sm,
          backgroundColor: colorScheme === 'dark' ? '#3d2a00' : '#fff3cd',
          borderBottomColor: colors.text + '18',
        },
      ]}
      accessibilityRole="alert"
    >
      <IconSymbol name="wifi.off" size={18} color={colors.text} />
      <ThemedText type="caption" style={[styles.text, { color: colors.text }]}>
        You are offline. New scans will retry when the connection returns.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.space.sm,
    paddingHorizontal: DesignTokens.space.lg,
    paddingBottom: DesignTokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
});
