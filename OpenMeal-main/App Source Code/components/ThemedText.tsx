import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'headline' | 'label' | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: tintColor }] : undefined,
        type === 'headline' ? styles.headline : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'TikTokSans-Regular',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'TikTokSans-SemiBold',
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    fontFamily: 'TikTokSans-Bold',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'TikTokSans-Bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: 'TikTokSans-Regular',
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'TikTokSans-Bold',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'TikTokSans-SemiBold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.72,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'TikTokSans-Regular',
    opacity: 0.68,
  },
});
