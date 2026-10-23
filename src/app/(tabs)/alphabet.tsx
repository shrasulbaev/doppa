// Уйгурский алфавит на кириллице. Арабская графика будет отдельным модулем.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SpeakButton, T, ui } from '@/components/ui';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function AlphabetTab() {
  const { content, words } = useStore();
  const { speak } = useSpeech();
  const [selected, setSelected] = useState(content.letters[0]?.upper ?? 'А');
  const letter = content.letters.find((l) => l.upper === selected) ?? content.letters[0];
  const example = letter?.exampleWordId != null ? words.get(letter.exampleWordId) : undefined;

  return (
    <ScrollView contentContainerStyle={ui.pad}>
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
      <T variant="muted" style={{ fontSize: 13 }}>Арабская графика будет отдельным модулем.</T>
    </ScrollView>
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
});
