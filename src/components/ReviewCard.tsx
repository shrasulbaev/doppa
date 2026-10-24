// Кнопка «Работа над ошибками»: появляется, когда накопилось несколько ошибок.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REVIEW_ID, REVIEW_MIN, reviewItems } from '@/lib/review';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export function ReviewCard() {
  const { progress, content } = useStore();
  const count = reviewItems(progress?.mistakes, content, Infinity).length;
  if (count < REVIEW_MIN) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Работа над ошибками, слов: ${count}`}
      onPress={() => router.push({ pathname: '/lesson/[levelId]', params: { levelId: REVIEW_ID } })}
      style={({ pressed }) => [s.card, pressed && { transform: [{ translateY: 2 }] }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.title}>Работа над ошибками</Text>
        <Text style={s.sub}>Ошибок для повтора: {count}. За раз повторяем до 6.</Text>
      </View>
      <Text style={s.go}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 10,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.redTint,
    borderWidth: 2, borderColor: '#F3C2C9',
  },
  title: { fontFamily: fonts.black, fontSize: 16, color: colors.redDark },
  sub: { fontFamily: fonts.semi, fontSize: 14, color: colors.ink },
  go: { fontFamily: fonts.black, fontSize: 30, color: colors.redDark, lineHeight: 32 },
});
