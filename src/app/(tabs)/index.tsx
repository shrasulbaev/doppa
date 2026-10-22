// Карта уроков: Шёлковый путь, раздел за разделом
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MapScene } from '@/components/MapScene';
import { currentLevelIndex } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function MapTab() {
  const { content, progress, showToast } = useStore();
  if (!progress) return null;

  // Первый раздел, где ещё есть непройденные уровни
  const sections = content.sections.map((sec) => ({
    ...sec,
    levels: content.levels.filter((l) => l.sectionId === sec.id).sort((a, b) => a.position - b.position),
  }));
  const withLevels = sections.filter((s) => s.levels.length);
  const active = withLevels.find((s) => s.levels.some((l) => !progress.levels[l.id])) ?? withLevels[withLevels.length - 1];
  if (!active) return null;
  const next = sections[sections.indexOf(active) + 1];
  const cur = currentLevelIndex(active.levels.map((l) => l.id), progress.levels);
  const allDone = cur >= active.levels.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.meadow }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.bannerWrap}>
        <View style={s.banner}>
          <Text style={s.eyebrow}>
            {allDone ? `${active.title} · ${active.city} пройден` : `Шёлковый путь · ${active.title} · ${active.city}`}
          </Text>
          <Text style={s.bannerTitle}>
            {allDone
              ? `Барикалла, ${progress.name}!`
              : `Уровень ${cur + 1} из ${active.levels.length} · ${active.levels[cur].title}`}
          </Text>
        </View>
      </View>
      <MapScene
        levels={active.levels}
        current={cur}
        done={progress.levels}
        who={progress.avatar}
        nextCity={next?.city}
        onOpen={(level, state) => {
          if (state === 'lock') showToast('Сначала пройди предыдущий уровень');
          else router.push({ pathname: '/lesson/[levelId]', params: { levelId: level.id } });
        }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bannerWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  banner: {
    backgroundColor: colors.blue, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, gap: 2,
    shadowColor: colors.blueDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  eyebrow: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase', color: '#fff', opacity: 0.9 },
  bannerTitle: { fontFamily: fonts.black, fontSize: 20, color: '#fff' },
});
