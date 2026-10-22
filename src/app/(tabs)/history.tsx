// История и культура: короткие рассказы с вопросами
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApricotIcon, CheckIcon } from '@/components/icons';
import { StoryArt } from '@/components/StoryArt';
import { T, ui } from '@/components/ui';
import { XP_STORY } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function HistoryTab() {
  const { content, progress } = useStore();
  return (
    <ScrollView contentContainerStyle={ui.pad}>
      <View style={{ gap: 4 }}>
        <T variant="h1">История и культура</T>
        <T variant="muted">Короткие рассказы с вопросами. За каждый прочитанный — {XP_STORY} абрикосов.</T>
      </View>
      {content.stories.map((st, i) => {
        const read = !!progress?.stories[st.id];
        return (
          <Pressable
            key={st.id}
            accessibilityRole="button"
            accessibilityLabel={`${st.title}. ${st.audience}, ${st.minutes} мин${read ? ', прочитано' : ''}`}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: st.id } })}
            style={({ pressed }) => [ui.card, s.card, pressed && { opacity: 0.85 }]}>
            <StoryArt art={st.art} height={i === 0 ? 130 : 90} />
            <View style={s.body}>
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <Text style={s.meta}>{st.audience} · {st.minutes} мин</Text>
                {read ? (
                  <View style={[ui.row, { gap: 4 }]}>
                    <CheckIcon size={16} color={colors.okInk} />
                    <Text style={[s.badge, { color: colors.okInk }]}>Прочитано</Text>
                  </View>
                ) : (
                  <View style={[ui.row, { gap: 4 }]}>
                    <ApricotIcon size={16} />
                    <Text style={[s.badge, { color: colors.apricotInk }]}>+{XP_STORY}</Text>
                  </View>
                )}
              </View>
              <Text style={s.title}>{st.title}</Text>
            </View>
          </Pressable>
        );
      })}
      <T variant="muted" style={{ fontSize: 13 }}>Новые истории будут выходить каждую неделю.</T>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { overflow: 'hidden' },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 4 },
  meta: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
  badge: { fontFamily: fonts.black, fontSize: 13 },
  title: { fontFamily: fonts.black, fontSize: 19, color: colors.ink },
});
