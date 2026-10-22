// Урок: знакомство со словами, выбор перевода, сборка слова из букв, поиск пар.
// Ошибочные задания повторяются в конце урока.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { ApricotIcon, CheckIcon, CloseIcon, PomegranateIcon, StarIcon } from '@/components/icons';
import { Bubble, Button, ProgressBar, SpeakButton, T, TopBar, ui } from '@/components/ui';
import { levelWords } from '@/lib/content';
import { buildLesson, checkBuild, checkChoose, prepare, type Step } from '@/lib/lesson';
import { nextHeartIn } from '@/lib/rules';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import type { AvatarId, Level, Word } from '@/lib/types';

const PRAISE = ['Барикалла!', 'Верно!', 'Отлично!', 'Так держать!'];

export default function LessonScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { content, words } = useStore();
  const level = content.levels.find((l) => l.id === levelId);
  if (!level) return null;
  return <Lesson key={level.id} level={level} words={levelWords(level, words)} pool={content.words} />;
}

function Lesson({ level, words, pool }: { level: Level; words: Word[]; pool: Word[] }) {
  const insets = useSafeAreaInsets();
  const { progress, hearts, loseHeart, completeLevel } = useStore();
  const who: AvatarId = progress?.avatar ?? 'raihan';
  const { speak, talking } = useSpeech();

  const [steps, setSteps] = useState<Step[]>(() => buildLesson(words, pool));
  const [i, setI] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [checked, setChecked] = useState<null | { ok: boolean; praise: string }>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [matchLeft, setMatchLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [result, setResult] = useState<null | { stars: number; gain: number }>(null);
  const [outOfHearts, setOutOfHearts] = useState(hearts <= 0);

  const step = steps[i];

  // Новое слово сразу проговаривается
  useEffect(() => {
    if (step?.kind === 'intro') speak(step.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (outOfHearts) return <NoHearts who={who} onExit={() => router.back()} />;
  if (result) return <Result who={who} level={level} words={words.length} mistakes={mistakes} {...result} />;
  if (!step) return null;

  function feedback(ok: boolean) {
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  }

  function miss(s: Step) {
    setMistakes((m) => m + 1);
    loseHeart();
    setSteps((all) => [...all, prepare(s, pool)]);
  }

  function check() {
    if (step.kind !== 'choose' && step.kind !== 'build') return;
    const ok = step.kind === 'choose'
      ? checkChoose(step, picked ?? '')
      : checkBuild(step, built.map((id) => step.tiles[id].char));
    feedback(ok);
    setChecked({ ok, praise: PRAISE[Math.floor(Math.random() * PRAISE.length)] });
    if (ok) {
      if (step.kind === 'choose' && step.direction === 'ug-ru') speak(step.word);
    } else {
      miss(step);
    }
  }

  function next() {
    if (hearts <= 0) {
      setOutOfHearts(true);
      return;
    }
    setChecked(null);
    setPicked(null);
    setBuilt([]);
    setMatchLeft(null);
    setMatched([]);
    setFlash(null);
    if (i + 1 >= steps.length) setResult(completeLevel(level.id, mistakes));
    else setI(i + 1);
  }

  function pickRight(s: Extract<Step, { kind: 'match' }>, r: number) {
    if (matchLeft === null) return;
    const left = s.left[matchLeft];
    if (left.id === s.right[r].id) {
      feedback(true);
      speak(left);
      setMatched((m) => [...m, left.id]);
      setMatchLeft(null);
    } else {
      feedback(false);
      setFlash(r);
      setTimeout(() => setFlash(null), 600);
      setMistakes((m) => m + 1);
      loseHeart();
    }
  }

  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;

  if (step.kind === 'intro') {
    body = (
      <>
        <T variant="eyebrow">Новое слово</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={150} height={176} talking={talking} />
          <Bubble style={{ flex: 1, gap: 8, marginBottom: 14 }}>
            <Text style={s.wordBig}>{step.word.ug}</Text>
            {!!step.word.arabic && <T variant="arabic">{step.word.arabic}</T>}
            <SpeakButton filled label="Прослушать" onPress={() => speak(step.word)} />
          </Bubble>
        </View>
        <Bubble style={{ alignItems: 'center' }}>
          <T variant="muted" style={{ fontSize: 14 }}>Перевод</T>
          <Text style={s.translation}>{step.word.ru}</Text>
        </Bubble>
      </>
    );
    foot = <Button variant="blue" title="Понятно" onPress={next} />;
  } else if (step.kind === 'choose') {
    const ug = step.direction === 'ug-ru';
    body = (
      <>
        <T variant="eyebrow">{ug ? 'Переведи на русский' : 'Как это по-уйгурски?'}</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={110} height={130} talking={talking} />
          <Bubble style={[ui.row, { flex: 1, marginBottom: 10, justifyContent: 'space-between' }]}>
            <Text style={[s.prompt, ug && { color: colors.blue, fontSize: 28 }]}>{ug ? step.word.ug : step.word.ruShort}</Text>
            {ug && <SpeakButton label="Прослушать" onPress={() => speak(step.word)} />}
          </Bubble>
        </View>
        <View style={s.opts}>
          {step.options.map((o) => {
            const sel = picked === o;
            const good = !!checked && o === step.answer;
            const bad = !!checked && sel && o !== step.answer;
            return (
              <Pressable
                key={o}
                accessibilityRole="button"
                accessibilityState={{ selected: sel, disabled: !!checked }}
                disabled={!!checked}
                onPress={() => setPicked(o)}
                style={[s.opt, sel && s.optSel, good && s.optGood, bad && s.optBad]}>
                <Text style={[s.optText, !ug && { color: colors.blue }, sel && { color: colors.blueDark }, good && { color: colors.okInk }, bad && { color: colors.redDark }]}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
    foot = <CheckFoot checked={checked} canCheck={picked !== null} answer={`${step.word.ug} — ${step.word.ruShort}`} onCheck={check} onNext={next} />;
  } else if (step.kind === 'build') {
    body = (
      <>
        <T variant="eyebrow">Собери слово по-уйгурски</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={110} height={130} talking={talking} />
          <Bubble style={{ flex: 1, marginBottom: 10 }}><Text style={s.prompt}>{step.word.ruShort}</Text></Bubble>
        </View>
        <View style={s.slots} accessibilityLabel="Ваш ответ">
          {built.length ? (
            built.map((id, k) => (
              <Pressable key={id} accessibilityRole="button" disabled={!!checked} onPress={() => setBuilt(built.filter((_, j) => j !== k))} style={s.tile}>
                <Text style={s.tileText}>{step.tiles[id].char}</Text>
              </Pressable>
            ))
          ) : (
            <T variant="muted" style={{ fontSize: 14 }}>Нажимай на буквы ниже</T>
          )}
        </View>
        <View style={s.tiles}>
          {step.tiles.map((t) => {
            const used = built.includes(t.id);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`Буква ${t.char}`}
                disabled={used || !!checked}
                onPress={() => setBuilt([...built, t.id])}
                style={[s.tile, used && { opacity: 0 }]}>
                <Text style={s.tileText}>{t.char}</Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
    foot = <CheckFoot checked={checked} canCheck={built.length > 0} answer={`${step.word.ug} — ${step.word.ruShort}`} onCheck={check} onNext={next} />;
  } else {
    const all = matched.length === step.words.length;
    body = (
      <>
        <T variant="eyebrow">Найди пары</T>
        <T variant="h2">Соедини слово и перевод</T>
        <View style={[ui.row, { alignItems: 'flex-start', gap: 12 }]}>
          <View style={s.col}>
            {step.left.map((w, k) => {
              const done = matched.includes(w.id);
              return (
                <Pressable
                  key={w.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: matchLeft === k, disabled: done }}
                  disabled={done}
                  onPress={() => { setMatchLeft(k); speak(w); }}
                  style={[s.opt, matchLeft === k && s.optSel, done && s.optDone]}>
                  <Text style={[s.optText, { color: colors.blue, fontSize: 19 }, done && { color: colors.okInk }]}>{w.ug}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={s.col}>
            {step.right.map((w, k) => {
              const done = matched.includes(w.id);
              return (
                <Pressable
                  key={w.id}
                  accessibilityRole="button"
                  disabled={done}
                  onPress={() => pickRight(step, k)}
                  style={[s.opt, flash === k && s.optBad, done && s.optDone]}>
                  <Text style={[s.optText, { fontSize: 15 }, done && { color: colors.okInk }]}>{w.ruShort}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </>
    );
    foot = all ? (
      <>
        <Verdict ok text="Все пары найдены!" />
        <Button variant="ok" title="Дальше" onPress={next} />
      </>
    ) : (
      <T variant="muted" style={{ textAlign: 'center', fontSize: 14 }}>Сначала нажми на уйгурское слово, потом на перевод</T>
    );
  }

  const footTone = checked ? (checked.ok ? s.footGood : s.footBad) : step.kind === 'match' && matched.length === step.words.length ? s.footGood : null;

  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <TopBar icon="close" label="Закрыть урок" onPress={() => router.back()}>
        <ProgressBar value={i / steps.length} />
        <View style={[ui.row, { gap: 4 }]} accessibilityLabel={`Гранатов: ${hearts}`}>
          <PomegranateIcon />
          <Text style={s.hearts}>{hearts}</Text>
        </View>
      </TopBar>
      <ScrollView contentContainerStyle={[ui.pad, { gap: 16 }]}>{body}</ScrollView>
      <View style={[ui.foot, { paddingBottom: insets.bottom + 18 }, footTone]}>{foot}</View>
    </View>
  );
}

function Verdict({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? CheckIcon : CloseIcon;
  const color = ok ? colors.okInk : colors.redDark;
  return (
    <View accessibilityLiveRegion="polite" style={[ui.row, { gap: 8 }]}>
      <Icon size={28} color={color} />
      <Text style={[s.verdict, { color }]}>{text}</Text>
    </View>
  );
}

function CheckFoot({ checked, canCheck, answer, onCheck, onNext }: {
  checked: null | { ok: boolean; praise: string };
  canCheck: boolean;
  answer: string;
  onCheck: () => void;
  onNext: () => void;
}) {
  if (!checked) return <Button title="Проверить" disabled={!canCheck} onPress={onCheck} />;
  if (checked.ok) {
    return (
      <>
        <Verdict ok text={checked.praise} />
        <Button variant="ok" title="Дальше" onPress={onNext} />
      </>
    );
  }
  return (
    <>
      <Verdict ok={false} text="Правильный ответ:" />
      <Text style={[s.verdict, { color: colors.redDark, fontSize: 17 }]}>{answer}</Text>
      <Button title="Понятно" onPress={onNext} />
    </>
  );
}

function Result({ who, level, words, mistakes, stars, gain }: {
  who: AvatarId; level: Level; words: number; mistakes: number; stars: number; gain: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[ui.pad, s.center]}>
        <Avatar who={who} width={170} height={230} talking />
        <View style={[ui.row, { gap: 4 }]} accessibilityLabel={`${stars} из 3 звёзд`}>
          {[0, 1, 2].map((k) => <StarIcon key={k} size={54} color={k < stars ? colors.gold : colors.line} />)}
        </View>
        <T variant="h1" style={{ textAlign: 'center' }}>Уровень «{level.title}» пройден!</T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          {mistakes ? `Ошибок: ${mistakes}. Слова с ошибками мы повторили в конце урока.` : 'Ни одной ошибки, барикалла!'}
        </T>
        <View style={[ui.row, { gap: 10, flexWrap: 'wrap', justifyContent: 'center' }]}>
          <Bubble style={[ui.row, { gap: 6, borderRadius: 14 }]}>
            <ApricotIcon />
            <Text style={[s.pill, { color: '#8A5A00' }]}>+{gain} абрикосов</Text>
          </Bubble>
          <Bubble style={{ borderRadius: 14 }}><Text style={s.pill}>{words} новых слов</Text></Bubble>
        </View>
      </ScrollView>
      <View style={[ui.foot, { paddingBottom: insets.bottom + 18 }]}>
        <Button variant="blue" title="Продолжить" onPress={() => router.back()} />
      </View>
    </View>
  );
}

function NoHearts({ who, onExit }: { who: AvatarId; onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const { progress } = useStore();
  const [now] = useState(() => Date.now());
  const mins = progress ? Math.ceil(nextHeartIn(progress, now) / 60000) : 0;
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[ui.pad, s.center]}>
        <Avatar who={who} width={150} height={200} />
        <T variant="h1" style={{ textAlign: 'center' }}>Гранаты закончились</T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          Гранаты — это жизни: за каждую ошибку отдаёшь один. Новый гранат вырастет через {mins} мин, а пока можно почитать историю или повторить алфавит.
        </T>
      </ScrollView>
      <View style={[ui.foot, { paddingBottom: insets.bottom + 18 }]}>
        <Button variant="blue" title="На карту" onPress={onExit} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wordBig: { fontFamily: fonts.black, fontSize: 30, lineHeight: 34, color: colors.blue },
  translation: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, textAlign: 'center' },
  prompt: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, flexShrink: 1 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opt: {
    flexGrow: 1, flexBasis: '45%', minHeight: 58, padding: 10, borderWidth: 2, borderColor: colors.line, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  optSel: { borderColor: colors.blue, backgroundColor: colors.tint },
  optGood: { borderColor: colors.ok, backgroundColor: colors.okTint },
  optBad: { borderColor: colors.red, backgroundColor: colors.redTint },
  optDone: { borderColor: colors.ok, backgroundColor: colors.okTint, opacity: 0.6 },
  optText: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, textAlign: 'center' },
  col: { flex: 1, gap: 10 },
  slots: {
    minHeight: 68, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 2, borderColor: colors.line, paddingVertical: 8,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tile: {
    minWidth: 48, height: 52, paddingHorizontal: 12, borderWidth: 2, borderColor: colors.line, borderRadius: 12,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  tileText: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  hearts: { fontFamily: fonts.black, fontSize: 17, color: colors.redDark },
  verdict: { fontFamily: fonts.black, fontSize: 20 },
  footGood: { backgroundColor: colors.okTint, borderColor: colors.okTint },
  footBad: { backgroundColor: colors.redTint, borderColor: colors.redTint },
  pill: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
