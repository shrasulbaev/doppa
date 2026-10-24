// Письмо: уйгурский алфавит на кириллице и отдельный курс арабской графики (әрәб йезиқи).
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, LockIcon, StarIcon } from '@/components/icons';
import { ReviewCard } from '@/components/ReviewCard';
import { SpeakButton, T, ui } from '@/components/ui';
import { ARABIC_LETTERS } from '@/lib/arabic';
import { levelStates } from '@/lib/rules';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { WRITING_LEVELS, WRITING_STAGES } from '@/lib/writing';

export default function WritingTab() {
  const [script, setScript] = useState<'cyr' | 'ar'>('ar');
  return (
    <ScrollView contentContainerStyle={[ui.pad, { paddingHorizontal: 0 }]}>
      <View style={[s.switch, { marginHorizontal: 20 }]} accessibilityRole="tablist">
        {([['ar', 'Арабица'], ['cyr', 'Кириллица']] as const).map(([id, label]) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: script === id }}
            onPress={() => setScript(id)}
            style={[s.switchBtn, script === id && s.switchOn]}>
            <Text style={[s.switchText, script === id && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {script === 'ar' ? <ArabicCourse /> : <View style={{ paddingHorizontal: 20, gap: 14 }}><CyrillicAlphabet /></View>}
    </ScrollView>
  );
}

/** Курс арабской графики: ступени от букв до фраз, уровни открываются по порядку */
function ArabicCourse() {
  const { progress } = useStore();
  if (!progress) return null;
  const { states } = levelStates(WRITING_LEVELS.map((l) => l.id), progress.levels, progress.unlockAll);
  const done = states.filter((st) => st === 'done').length;
  return (
    <>
      <View style={[s.hero, { marginHorizontal: 20 }]}>
        <Text style={s.heroAr}>ئۇيغۇر يېزىقى</Text>
        <Text style={s.heroTitle}>Арабская графика</Text>
        <T variant="muted" style={{ color: '#fff', opacity: 0.9 }}>
          Ею пишут уйгуры в Синьцзяне. 32 буквы, пишется справа налево. Пройдено {done} из {WRITING_LEVELS.length}.
        </T>
      </View>
      <ReviewCard />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.abc}>
        {ARABIC_LETTERS.map((l) => (
          <View key={l.ar} style={s.abcCell} accessibilityLabel={`${l.ar} — ${l.cyr}`}>
            <Text style={s.abcAr}>{l.ar}</Text>
            <Text style={s.abcCyr}>{l.cyr}</Text>
          </View>
        ))}
      </ScrollView>
      {WRITING_STAGES.map((st) => (
        <View key={st.n} style={{ gap: 8, paddingHorizontal: 20 }}>
          <View>
            <T variant="eyebrow" style={{ color: colors.blue }}>Ступень {st.n} · {st.title}</T>
            <T variant="muted" style={{ fontSize: 14 }}>{st.about}</T>
          </View>
          {WRITING_LEVELS.filter((l) => l.stage === st.n).map((l) => {
            const k = WRITING_LEVELS.indexOf(l);
            const state = states[k];
            const stars = progress.levels[l.id]?.stars ?? 0;
            const lock = state === 'lock';
            return (
              <Pressable
                key={l.id}
                accessibilityRole="button"
                accessibilityLabel={`${l.title}, ${{ done: 'пройден', cur: 'текущий', open: 'открыт', lock: 'закрыт' }[state]}`}
                onPress={() => (lock ? null : router.push({ pathname: '/lesson/[levelId]', params: { levelId: l.id } }))}
                disabled={lock}
                style={({ pressed }) => [s.level, state === 'cur' && s.levelCur, lock && { opacity: 0.55 }, pressed && { transform: [{ translateY: 2 }] }]}>
                <View style={[s.badge, state === 'done' && { backgroundColor: colors.blue }, state === 'cur' && { backgroundColor: colors.red }]}>
                  {state === 'done' ? <CheckIcon size={20} color="#fff" /> : lock ? <LockIcon size={18} color={colors.muted} /> : <StarIcon size={20} color={state === 'cur' ? '#fff' : colors.blue} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.levelTitle}>{l.title}</Text>
                  {state === 'cur' && <Text style={s.levelSub}>Начать</Text>}
                </View>
                {stars > 0 && (
                  <View style={[ui.row, { gap: 1 }]} accessibilityLabel={`${stars} из 3 звёзд`}>
                    {[0, 1, 2].map((j) => <StarIcon key={j} size={16} color={j < stars ? colors.gold : colors.line} />)}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );
}

function CyrillicAlphabet() {
  const { content, words } = useStore();
  const { speak } = useSpeech();
  const [selected, setSelected] = useState(content.letters[0]?.upper ?? 'А');
  const letter = content.letters.find((l) => l.upper === selected) ?? content.letters[0];
  const example = letter?.exampleWordId != null ? words.get(letter.exampleWordId) : undefined;

  return (
    <>
      <T variant="h1">Алфавит</T>
      {letter && (
        <View style={[ui.card, ui.row, { gap: 14, padding: 14, borderRadius: 22 }]}>
          <View style={s.big}><Text style={s.bigText}>{letter.upper}{letter.upper.toLowerCase()}</Text></View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={s.kind}>{letter.uyghur ? 'Уйгурская буква' : 'Как в русском'}</Text>
              <T variant="arabic" style={{ fontSize: 24 }}>{letter.arabic}</T>
            </View>
            {example ? (
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.word}>{example.ug}</Text>
                  <T variant="muted">{example.ruShort}</T>
                </View>
                <SpeakButton label={`Прослушать ${example.ug}`} onPress={() => speak(example)} />
              </View>
            ) : (
              <T variant="muted">Пример добавим позже</T>
            )}
          </View>
        </View>
      )}
      <View style={[ui.row, { gap: 14, flexWrap: 'wrap' }]}>
        <Legend label="Как в русском" border={colors.line} bg={colors.card} />
        <Legend label="Уйгурские буквы" border={colors.gold} bg={colors.goldTint} />
      </View>
      <View style={s.grid}>
        {content.letters.map((l) => {
          const on = l.upper === selected;
          return (
            <Pressable
              key={l.upper}
              accessibilityRole="button"
              accessibilityLabel={`Буква ${l.upper}`}
              accessibilityState={{ selected: on }}
              onPress={() => setSelected(l.upper)}
              style={[s.cell, l.uyghur && s.cellUg, on && s.cellOn]}>
              <Text style={[s.cellText, l.uyghur && { color: colors.goldInk }, on && { color: '#fff' }]}>{l.upper}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function Legend({ label, border, bg }: { label: string; border: string; bg: string }) {
  return (
    <View style={[ui.row, { gap: 6 }]}>
      <View style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 2, borderColor: border, backgroundColor: bg }} />
      <Text style={s.kind}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  big: { width: 84, height: 84, borderRadius: 18, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  bigText: { fontFamily: fonts.black, fontSize: 38, color: '#fff' },
  kind: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  word: { fontFamily: fonts.black, fontSize: 22, color: colors.blue },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '14.5%', height: 50, borderRadius: 12, borderWidth: 2, borderColor: colors.line,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.line, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  cellUg: { borderColor: colors.gold, backgroundColor: colors.goldTint, shadowColor: colors.gold },
  cellOn: { borderColor: colors.blue, backgroundColor: colors.blue, shadowColor: colors.blueDark },
  cellText: { fontFamily: fonts.black, fontSize: 21, color: colors.ink },
  switch: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999, borderWidth: 2, borderColor: colors.line, padding: 3 },
  switchBtn: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  switchOn: { backgroundColor: colors.blue },
  switchText: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
  hero: { backgroundColor: colors.blue, borderRadius: 20, padding: 18, gap: 4 },
  heroAr: { fontFamily: fonts.arabic, fontSize: 30, lineHeight: 48, color: '#fff', writingDirection: 'rtl', textAlign: 'right' },
  heroTitle: { fontFamily: fonts.black, fontSize: 22, color: '#fff' },
  abc: { paddingHorizontal: 20, gap: 6, flexDirection: 'row-reverse' },
  abcCell: {
    width: 44, height: 64, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  abcAr: { fontFamily: fonts.arabic, fontSize: 22, lineHeight: 34, color: colors.blue },
  abcCyr: { fontFamily: fonts.black, fontSize: 12, color: colors.muted },
  level: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
    backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line,
  },
  levelCur: { borderColor: colors.red },
  badge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  levelTitle: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  levelSub: { fontFamily: fonts.bold, fontSize: 13, color: colors.red },
});
