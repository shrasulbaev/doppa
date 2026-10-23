// Разговорник: все слова словаря по темам, с озвучкой
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SpeakButton, T, ui } from '@/components/ui';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function PhrasebookTab() {
  const { content } = useStore();
  const { speak } = useSpeech();
  const topics = useMemo(() => Array.from(new Set(content.words.map((w) => w.topic))), [content.words]);
  const [topic, setTopic] = useState(topics[0]);
  const list = content.words.filter((w) => w.topic === topic);

  return (
    <FlatList
      data={list}
      keyExtractor={(w) => String(w.id)}
      contentContainerStyle={[ui.pad, { gap: 10 }]}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <T variant="h1">Разговорник</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
            {topics.map((t) => {
              const on = t === topic;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTopic(t)}
                  style={[s.chip, on && s.chipOn]}>
                  <Text style={[s.chipText, on && { color: '#fff' }]}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      renderItem={({ item: w }) => (
        <View style={[ui.card, ui.row, s.row]}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={[ui.row, { justifyContent: 'space-between', alignItems: 'baseline' }]}>
              <Text style={s.ug}>{w.ug}</Text>
              {!!w.arabic && <T variant="arabic" style={{ fontSize: 17 }}>{w.arabic}</T>}
            </View>
            <T variant="muted" style={{ fontSize: 14 }}>{w.ru}</T>
          </View>
          <SpeakButton label={`Прослушать ${w.ug}`} onPress={() => speak(w)} />
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' },
  chipOn: { borderColor: colors.red, backgroundColor: colors.red },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.muted },
  row: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  ug: { fontFamily: fonts.black, fontSize: 19, color: colors.blue, flexShrink: 1 },
});
