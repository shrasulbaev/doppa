// Базовые элементы интерфейса: кнопки, текст, «облачко» реплики, прогресс, тост.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { BackIcon, CloseIcon, SpeakerIcon } from './icons';

type Variant = 'red' | 'blue' | 'ok' | 'ghost';

const variantStyle: Record<Variant, { bg: string; fg: string; border?: string }> = {
  red: { bg: colors.red, fg: '#fff' },
  blue: { bg: colors.blue, fg: '#fff' },
  ok: { bg: colors.ok, fg: '#fff' },
  ghost: { bg: colors.card, fg: colors.blue, border: colors.line },
};

export function Button({
  title, onPress, variant = 'red', disabled, color, style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variantStyle[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: v.bg, borderColor: v.border ?? v.bg, opacity: disabled ? 0.45 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}>
      <Text style={[s.btnText, { color: color ?? v.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, style }: {
  icon: 'back' | 'close'; label: string; onPress: () => void; style?: StyleProp<ViewStyle>;
}) {
  const Icon = icon === 'back' ? BackIcon : CloseIcon;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[s.iconBtn, style]}>
      <Icon size={26} color={colors.muted} />
    </Pressable>
  );
}

export function SpeakButton({ onPress, label, filled, style }: {
  onPress: () => void; label: string; filled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.speak, filled && { backgroundColor: colors.blue }, pressed && { opacity: 0.7 }, style]}>
      <SpeakerIcon size={24} color={filled ? '#fff' : colors.blue} />
    </Pressable>
  );
}

export function T({ children, style, variant = 'body', numberOfLines }: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'h1' | 'h2' | 'body' | 'muted' | 'eyebrow' | 'arabic';
  numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} style={[s[variant], style]}>{children}</Text>;
}

export function Bubble({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.bubble, style]}>{children}</View>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={s.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[s.barFill, { width: `${Math.min(100, Math.max(0, value * 100))}%` }]} />
    </View>
  );
}

/** Шапка экрана с кнопкой «назад» или «закрыть» и произвольным содержимым справа. */
export function TopBar({ icon = 'back', label = 'Назад', onPress, children }: {
  icon?: 'back' | 'close'; label?: string; onPress: () => void; children?: ReactNode;
}) {
  return (
    <View style={s.topBar}>
      <IconButton icon={icon} label={label} onPress={onPress} />
      {children}
    </View>
  );
}

export function Toast() {
  const { toast } = useStore();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={[s.toastWrap, { bottom: insets.bottom + 90 }]}>
      <Text accessibilityLiveRegion="polite" style={s.toast}>{toast}</Text>
    </View>
  );
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foot: { paddingHorizontal: 20, paddingTop: 14, gap: 12, borderTopWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  card: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, borderRadius: 20 },
  field: {
    height: 54, borderWidth: 2, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14,
    backgroundColor: colors.card, fontFamily: fonts.bold, fontSize: 18, color: colors.ink,
  },
  label: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
  error: { fontFamily: fonts.bold, color: colors.redDark, fontSize: 15 },
});

const s = StyleSheet.create({
  btn: {
    minHeight: 54, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, alignSelf: 'stretch',
  },
  btnText: { fontFamily: fonts.black, fontSize: 17, letterSpacing: 0.6, textTransform: 'uppercase' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  speak: {
    width: 48, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.tint,
  },
  h1: { fontFamily: fonts.black, fontSize: 26, lineHeight: 32, color: colors.ink },
  h2: { fontFamily: fonts.black, fontSize: 21, lineHeight: 27, color: colors.ink },
  body: { fontFamily: fonts.semi, fontSize: 16, lineHeight: 23, color: colors.ink },
  muted: { fontFamily: fonts.semi, fontSize: 15, lineHeight: 21, color: colors.muted },
  eyebrow: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.redDark },
  arabic: { fontFamily: fonts.arabic, fontSize: 20, color: colors.muted, writingDirection: 'rtl' },
  bubble: {
    backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  bar: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.line, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 8, backgroundColor: colors.blue },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  toastWrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  toast: {
    backgroundColor: colors.ink, color: '#fff', fontFamily: fonts.bold, fontSize: 15, lineHeight: 21,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, overflow: 'hidden', textAlign: 'center',
  },
});
