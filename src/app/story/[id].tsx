// История с вопросами. Ответил на все правильно — история засчитана.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StoryArt } from '@/components/StoryArt';
import { Button, IconButton, SpeakButton, T, ui } from '@/components/ui';
import { XP_STORY } from '@/lib/rules';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { content, words, completeStory, showToast } = useStore();
  const { speak } = useSpeech();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const index = content.stories.findIndex((s) => s.id === id);
  const story = content.stories[index];
  if (!story) return null;
  const word = words.get(story.wordId);
  const next = content.stories[index + 1];

  function answer(qi: number, oi: number) {
    const all = { ...answers, [qi]: oi };
    setAnswers(all);
    if (story.quiz.every((q, k) => all[k] === q.answer) && completeStory(story.id)) {
      showToast(`Барикалла! История прочитана, +${XP_STORY} абрикосов`);
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View>
        <StoryArt art={story.art} height={170 + insets.top} />
        <IconButton
          icon="back"
          label="Назад к историям"
          onPress={() => router.back()}
          style={[s.back, { top: insets.top + 12 }]}
        />
      </View>
      <View style={ui.pad}>
        <Text style={s.meta}>{story.audience} · {story.minutes} мин</Text>
        <T variant="h1">{story.title}</T>
        {story.paragraphs.map((p, i) => (
          <T key={i} style={{ fontSize: 17, lineHeight: 27 }}>{p}</T>
        ))}
        {word && (
          <View style={[ui.row, s.word]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.meta, { color: colors.blueDark, fontSize: 11 }]}>Слово из истории</Text>
              <View style={[ui.row, { justifyContent: 'space-between', alignItems: 'baseline' }]}>
                <Text style={s.ug}>{word.ug}</Text>
                {!!word.arabic && <T variant="arabic" style={{ fontSize: 18 }}>{word.arabic}</T>}
              </View>
              <T variant="muted" style={{ fontSize: 14 }}>{word.ru}</T>
            </View>
            <SpeakButton label={`Прослушать ${word.ug}`} onPress={() => speak(word)} style={{ backgroundColor: colors.card }} />
          </View>
        )}
        <T variant="h2" style={{ paddingTop: 8 }}>Проверь себя</T>
        {story.quiz.map((q, qi) => {
          const pick = answers[qi];
          return (
            <View key={qi} style={{ gap: 8 }}>
              <T style={{ fontFamily: fonts.black }}>{qi + 1}. {q.question}</T>
              {q.options.map((o, oi) => {
                const good = pick === q.answer && oi === q.answer;
                const bad = pick === oi && oi !== q.answer;
                return (
                  <Pressable
                    key={oi}
                    accessibilityRole="button"
                    disabled={pick === q.answer}
                    onPress={() => answer(qi, oi)}
                    style={[s.opt, good && s.good, bad && s.bad]}>
                    <Text style={[s.optText, good && { color: colors.okInk }, bad && { color: colors.redDark }]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        {next && (
          <Button
            title="Следующая история"
            variant="ghost"
            style={{ marginTop: 8 }}
            onPress={() => router.replace({ pathname: '/story/[id]', params: { id: next.id } })}
          />
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  back: { position: 'absolute', left: 12, backgroundColor: colors.card },
  meta: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
  word: { backgroundColor: colors.tint, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  ug: { fontFamily: fonts.black, fontSize: 21, color: colors.blue },
  opt: { minHeight: 48, borderWidth: 2, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  optText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  good: { borderColor: colors.ok, backgroundColor: colors.okTint },
  bad: { borderColor: colors.red, backgroundColor: colors.redTint },
});
