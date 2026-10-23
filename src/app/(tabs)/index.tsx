// Карта уроков: Шёлковый путь, раздел за разделом
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MapScene } from '@/components/MapScene';
import { levelStates, type LevelState } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function MapTab() {
  const { content, progress, showToast } = useStore();
  // Раздел, выбранный вручную; по умолчанию — тот, где текущий уровень
  const [picked, setPicked] = useState<string | null>(null);
  if (!progress) return null;

  const sections = content.sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((sec) => ({
      ...sec,
      levels: content.levels.filter((l) => l.sectionId === sec.id).sort((a, b) => a.position - b.position),
    }))
    .filter((s) => s.levels.length);
  const all = sections.flatMap((s) => s.levels);
  const { cur, states } = levelStates(all.map((l) => l.id), progress.levels, progress.unlockAll);
  const stateOf = new Map<string, LevelState>(all.map((l, i) => [l.id, states[i]]));
  const curSection = all[cur]?.sectionId ?? sections[sections.length - 1]?.id;
  const active = sections.find((s) => s.id === (picked ?? curSection)) ?? sections[0];
  if (!active) return null;

  const next = sections[sections.indexOf(active) + 1];
  const sectionStates = active.levels.map((l) => stateOf.get(l.id) ?? 'lock');
  const curIdx = sectionStates.indexOf('cur');
  const openIdx = curIdx >= 0 ? curIdx : sectionStates.indexOf('open');
  const allDone = sectionStates.every((st) => st === 'done');
  const locked = sectionStates.every((st) => st === 'lock');
  const prev = sections[sections.indexOf(active) - 1];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.meadow }} contentContainerStyle={{ paddingBottom: 24 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {sections.map((sec) => {
          const on = sec.id === active.id;
          const closed = stateOf.get(sec.levels[0].id) === 'lock';
          return (
            <Pressable
              key={sec.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${sec.city}${closed ? ', закрыт' : ''}`}
              onPress={() => setPicked(sec.id)}
              style={[s.chip, on && s.chipOn, closed && !on && { opacity: 0.55 }]}>
              <Text style={[s.chipText, on && { color: '#fff' }]}>{sec.city}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={s.bannerWrap}>
        <View style={s.banner}>
          <Text style={s.eyebrow}>
            {allDone ? `${active.title} · ${active.city} пройден` : `Шёлковый путь · ${active.title} · ${active.city}`}
          </Text>
          <Text style={s.bannerTitle}>
            {allDone
              ? `Барикалла, ${progress.name}!`
              : locked
                ? `Откроется после города ${prev?.city ?? ''}`
                : `Уровень ${openIdx + 1} из ${active.levels.length} · ${active.levels[openIdx].title}`}
          </Text>
        </View>
      </View>
      <MapScene
        key={active.id}
        levels={active.levels}
        states={sectionStates}
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
  chips: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: 999, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontFamily: fonts.black, fontSize: 14, color: colors.ink },
  bannerWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  banner: {
    backgroundColor: colors.blue, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, gap: 2,
    shadowColor: colors.blueDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  eyebrow: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase', color: '#fff', opacity: 0.9 },
  bannerTitle: { fontFamily: fonts.black, fontSize: 20, color: '#fff' },
});
