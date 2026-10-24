// Пословица дня на карте: свёрнутая полоска, по нажатию раскрывается текст, перевод и русский аналог.
import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import proverbs from '../../content/proverbs.json';
import { dailyIndex } from '@/lib/rules';
import { colors, fonts } from '@/lib/theme';

type Proverb = { id: number; ug: string; ru: string; note?: string };

export function ProverbCard() {
  const [open, setOpen] = useState(false);
  const list = proverbs as Proverb[];
  const p = list[dailyIndex(new Date(), list.length)];
  if (!p) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={open ? `Пословица дня: ${p.ug}. ${p.ru}` : 'Пословица дня, раскрыть'}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((v) => !v);
      }}
      style={s.card}>
      <View style={s.head}>
        <Text style={s.eyebrow}>Мақал · пословица дня</Text>
        <Svg width={20} height={20} viewBox="0 0 24 24" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Path d="M6 9l6 6 6-6" fill="none" stroke={colors.apricotInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      {open && (
        <View style={s.body}>
          <Text style={s.ug}>{p.ug}</Text>
          <Text style={s.ru}>{p.ru}</Text>
          {p.note ? <Text style={s.note}>{p.note}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 20, marginTop: 12, marginBottom: 4, paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: colors.goldTint, borderRadius: 16, borderWidth: 2, borderColor: '#F3D9A4',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.apricotInk },
  body: { paddingTop: 6, paddingBottom: 4, gap: 4 },
  ug: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  ru: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  note: { fontFamily: fonts.semi, fontSize: 13, color: colors.muted },
});
