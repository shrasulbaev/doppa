// Карта уроков: Шёлковый путь одной дорогой через все города
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance,
} from 'react-native';

import { sceneFor } from '@/components/cityArt';
import { MapScene, type CitySign, type Teacher } from '@/components/MapScene';
import { ProverbCard } from '@/components/ProverbCard';
import { levelStates, type LevelState } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import type { Level, Word } from '@/lib/types';

/** Фраза учителя у текущего уровня: первое слово или предложение из его темы */
function teacherLine(level: Level, words: Map<number, Word>): Omit<Teacher, 'index'> {
  const phrase = level.items?.[0];
  if (phrase) return { ug: phrase.ug, ru: phrase.ru };
  const word = level.wordIds.map((id) => words.get(id)).find(Boolean);
  if (!word) return { ug: 'Салам!' };
  return { ug: word.ug.charAt(0).toUpperCase() + word.ug.slice(1), ru: word.ruShort };
}

export default function MapTab() {
  const { content, words, progress, showToast } = useStore();
  const scroll = useRef<ScrollViewInstance>(null);
  const chipsScroll = useRef<ScrollViewInstance>(null);
  // Где начинается каждый город на карте и каждая кнопка в ряду городов
  const sectionY = useRef<Record<string, number>>({});
  const chipX = useRef<Record<string, number>>({});
  const chipsH = useRef(0);
  const jumped = useRef(false);
  const [active, setActive] = useState<string | null>(null);

  const sections = content.sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((sec) => ({
      ...sec,
      levels: content.levels.filter((l) => l.sectionId === sec.id).sort((a, b) => a.position - b.position),
    }))
    .filter((s) => s.levels.length);
  const all = sections.flatMap((s) => s.levels);
  const { cur, states } = levelStates(all.map((l) => l.id), progress?.levels ?? {}, progress?.unlockAll);
  const stateOf = new Map<string, LevelState>(all.map((l, i) => [l.id, states[i]]));
  const curSection = all[cur]?.sectionId ?? sections[sections.length - 1]?.id;
  const shown = active ?? curSection;

  // Подсвечиваем в ряду кнопку города, который сейчас на экране
  useEffect(() => {
    const x = shown ? chipX.current[shown] : undefined;
    if (x !== undefined) chipsScroll.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
  }, [shown]);

  if (!progress) return null;

  const jumpTo = (id: string, animated = true) => {
    const y = sectionY.current[id];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - chipsH.current), animated });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + chipsH.current + 160;
    let seen = sections[0]?.id;
    for (const sec of sections) if ((sectionY.current[sec.id] ?? Infinity) <= y) seen = sec.id;
    if (seen && seen !== active) setActive(seen);
  };

  // Открываем карту сразу на городе, где сейчас учимся
  const onSectionLayout = (id: string, y: number) => {
    sectionY.current[id] = y;
    if (!jumped.current && id === curSection && sections[0]?.id !== id) {
      jumped.current = true;
      requestAnimationFrame(() => jumpTo(id, false));
    }
  };

  return (
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: colors.meadow }}
      contentContainerStyle={{ paddingBottom: 24 }}
      stickyHeaderIndices={[0]}
      onScroll={onScroll}
      scrollEventThrottle={64}>
      <View style={s.chipsBar} onLayout={(e) => { chipsH.current = e.nativeEvent.layout.height; }}>
        <ScrollView ref={chipsScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {sections.map((sec) => {
            const on = sec.id === shown;
            const closed = stateOf.get(sec.levels[0].id) === 'lock';
            return (
              <Pressable
                key={sec.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${sec.city}${closed ? ', закрыт' : ''}`}
                onLayout={(e) => { chipX.current[sec.id] = e.nativeEvent.layout.x; }}
                onPress={() => { setActive(sec.id); jumpTo(sec.id); }}
                style={[s.chip, on && s.chipOn, closed && !on && { opacity: 0.55 }]}>
                <Text style={[s.chipText, on && { color: '#fff' }]}>{sec.city}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ProverbCard />
      {sections.map((sec, si) => {
        const secStates = sec.levels.map((l) => stateOf.get(l.id) ?? 'lock');
        const curIdx = secStates.indexOf('cur');
        const openIdx = curIdx >= 0 ? curIdx : secStates.indexOf('open');
        const allDone = secStates.every((st) => st === 'done');
        const locked = secStates.every((st) => st === 'lock');
        const sign: CitySign = allDone
          ? { eyebrow: `${sec.title} · ${sec.city} пройден`, title: `Барикалла, ${progress.name}!`, tone: 'ok' }
          : locked
            ? { eyebrow: `${sec.title} · ${sec.city}`, title: `Откроется после города ${sections[si - 1]?.city ?? ''}`, tone: 'lock' }
            : {
              eyebrow: `Шёлковый путь · ${sec.title} · ${sec.city}`,
              title: `Уровень ${openIdx + 1} из ${sec.levels.length} · ${sec.levels[openIdx].title}`,
              tone: 'blue',
            };
        // Учитель стоит у текущего уровня, а когда пройдено всё — у последнего
        const lastSection = si === sections.length - 1;
        const teacher: Teacher | undefined = curIdx >= 0
          ? { index: curIdx, ...teacherLine(sec.levels[curIdx], words) }
          : lastSection && cur >= all.length
            ? { index: sec.levels.length - 1, ug: 'Барикалла!', ru: 'молодец!' }
            : undefined;
        return (
          <View key={sec.id} onLayout={(e) => onSectionLayout(sec.id, e.nativeEvent.layout.y)}>
            <MapScene
              levels={sec.levels}
              states={secStates}
              who={progress.avatar}
              scene={sceneFor(sec.city)}
              sign={sign}
              teacher={teacher}
              onOpen={(level, state) => {
                if (state === 'lock') showToast('Сначала пройди предыдущий уровень');
                else router.push({ pathname: '/lesson/[levelId]', params: { levelId: level.id } });
              }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chipsBar: { backgroundColor: colors.card, borderBottomWidth: 2, borderColor: colors.line },
  chips: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: 999, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontFamily: fonts.black, fontSize: 14, color: colors.ink },
});
