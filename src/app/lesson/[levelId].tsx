// Урок: знакомство со словами, выбор перевода, сборка слова из букв, поиск пар.
// Грамматический урок начинается с правила, а предложения собираются из слов.
// Ошибочные задания повторяются в конце урока и запоминаются для «Работы над ошибками».
// Тот же экран ведёт уроки арабской графики: там поле ug записано арабицей.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { ApricotIcon, CheckIcon, CloseIcon, PomegranateIcon, StarIcon } from '@/components/icons';
import { TracePad } from '@/components/TracePad';
import { Bubble, Button, ProgressBar, SpeakButton, T, TopBar, ui } from '@/components/ui';
import { levelWords } from '@/lib/content';
import { buildLesson, buildPhraseLesson, checkBuild, checkChoose, isPhrase, levelPhrases, shuffle, starsFor, type Step } from '@/lib/lesson';
import { REVIEW_ID, buildReview, reviewItems } from '@/lib/review';
import { nextHeartIn } from '@/lib/rules';
import { GLYPHS, checkTrace, type Pt, type TraceResult } from '@/lib/trace';
import { useSpeech } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import type { AvatarId, Word } from '@/lib/types';
import { WRITING_LEVELS, buildWritingLesson, isWritingLevel } from '@/lib/writing';

const PRAISE = ['Барикалла!', 'Верно!', 'Отлично!', 'Так держать!'];

export default function LessonScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { content, words, completeLevel, noteMistake } = useStore();
  if (levelId === REVIEW_ID) return <ReviewLesson />;
  const writing = isWritingLevel(levelId) ? WRITING_LEVELS.find((l) => l.id === levelId) : undefined;
  if (writing) {
    const unit = { letters: 'новых букв', trace: 'букв написано', forms: 'форм букв', read: 'слов прочитано', write: 'слов написано', phrases: 'фраз прочитано' }[writing.kind];
    return (
      <Lesson
        key={writing.id}
        title={writing.title}
        unit={unit}
        make={() => buildWritingLesson(writing, content)}
        onMiss={(w) => noteMistake(writing.id, w.ug)}
        onFinish={(m) => completeLevel(writing.id, m)}
      />
    );
  }
  const level = content.levels.find((l) => l.id === levelId);
  if (!level) return null;
  const phrases = level.kind === 'phrases';
  const items = phrases ? levelPhrases(level) : levelWords(level, words);
  return (
    <Lesson
      key={level.id}
      title={level.title}
      unit={phrases ? 'новых фраз' : 'новых слов'}
      count={items.length}
      make={() => (phrases ? buildPhraseLesson(level) : buildLesson(items, content.words))}
      onMiss={(w) => noteMistake(level.id, w.ug)}
      onFinish={(m) => completeLevel(level.id, m)}
    />
  );
}

/** Работа над ошибками: слова, где ошибался, повторяются; верно отвеченные уходят из списка */
function ReviewLesson() {
  const { content, progress, noteMistake, clearMistake, completeReview } = useStore();
  const [items] = useState(() => reviewItems(progress?.mistakes, content));
  const failed = useRef(new Set<string>());
  const keyOf = new Map(items.map((it) => [it.word.ug, it]));
  return (
    <Lesson
      title="Работа над ошибками"
      unit="слов повторено"
      count={items.length}
      make={() => buildReview(items)}
      onMiss={(w) => {
        const it = keyOf.get(w.ug);
        if (!it) return;
        failed.current.add(it.key);
        noteMistake(it.levelId, w.ug);
      }}
      onFinish={(m) => {
        for (const it of items) if (!failed.current.has(it.key)) clearMistake(it.key);
        return { stars: starsFor(m), ...completeReview() };
      }}
    />
  );
}

/** Повтор задания в конце урока: те же варианты, но в другом порядке */
function again(s: Step): Step {
  if (s.kind === 'choose') return { ...s, options: shuffle(s.options) };
  if (s.kind === 'build') return { ...s, tiles: shuffle(s.tiles.map((x) => x.char)).map((char, id) => ({ id, char })) };
  if (s.kind === 'match') return { ...s, left: shuffle(s.left), right: shuffle(s.right) };
  return s;
}

const AR = (w: Word) => w.script === 'arabic';

/** Правильный ответ после ошибки. Арабицу изолируем, чтобы она не перемешалась с кириллицей. */
function answerText(w: Word): string {
  return AR(w) ? `${w.ruShort} — \u2067${w.ug}\u2069` : `${w.ug} — ${w.ruShort}`;
}

function Lesson({ title, unit, count, make, onMiss, onFinish }: {
  title: string;
  /** Подпись к числу на экране итогов: «новых слов», «новых букв» */
  unit: string;
  count?: number;
  make: () => Step[];
  onMiss: (w: Word) => void;
  onFinish: (mistakes: number) => { stars: number; gain: number };
}) {
  const insets = useSafeAreaInsets();
  const { progress, hearts, loseHeart } = useStore();
  const who: AvatarId = progress?.avatar ?? 'raihan';
  const { speak, talking } = useSpeech();

  const [steps, setSteps] = useState<Step[]>(make);
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
  const [ink, setInk] = useState<Pt[][]>([]);
  const [traced, setTraced] = useState<TraceResult | null>(null);
  const introduced = new Set(steps.filter((s) => s.kind === 'intro').map((s) => (s.kind === 'intro' ? s.word.ug : '')));

  const step = steps[i];

  // Новое слово сразу проговаривается. У букв арабицы записей нет, их не озвучиваем.
  useEffect(() => {
    if (step?.kind === 'intro' && !step.word.forms) speak(step.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (outOfHearts) return <NoHearts who={who} onExit={() => router.back()} />;
  if (result) return <Result who={who} title={title} unit={unit} count={count ?? introduced.size} mistakes={mistakes} {...result} />;
  if (!step) return <Broken who={who} text="В этом уровне пока нет заданий." />;

  function feedback(ok: boolean) {
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  }

  function miss(s: Step) {
    setMistakes((m) => m + 1);
    loseHeart();
    if (s.kind === 'choose' || s.kind === 'build' || s.kind === 'trace') onMiss(s.word);
    setSteps((all) => [...all, again(s)]);
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
    setInk([]);
    setTraced(null);
    if (i + 1 >= steps.length) setResult(onFinish(mistakes));
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
      onMiss(left);
    }
  }

  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;

  if (step.kind === 'rule') {
    body = (
      <>
        <T variant="eyebrow">Правило</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={110} height={130} talking={talking} />
          <Bubble style={{ flex: 1, marginBottom: 10 }}><Text style={s.ruleText}>{step.rule.text}</Text></Bubble>
        </View>
        <Bubble style={{ gap: 10 }}>
          {step.rule.examples.map((e) => (
            <View key={e.ug} style={[ui.row, { justifyContent: 'space-between', gap: 12 }]}>
              <Text style={[s.optText, { color: colors.blue, fontSize: 20, textAlign: 'left' }, step.script === 'arabic' && s.ar]}>{e.ug}</Text>
              <Text style={[s.optText, { fontSize: 15, flexShrink: 1, textAlign: 'right' }]}>{e.ru}</Text>
            </View>
          ))}
        </Bubble>
      </>
    );
    foot = <Button variant="blue" title="Понятно" onPress={next} />;
  } else if (step.kind === 'intro') {
    body = (
      <>
        <T variant="eyebrow">
          {step.word.forms ? 'Новая буква' : AR(step.word) ? 'Читаем арабицей' : step.word.id < 0 ? 'Новая фраза' : 'Новое слово'}
        </T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={150} height={176} talking={talking} />
          <Bubble style={{ flex: 1, gap: 8, marginBottom: 14 }}>
            <Text style={[s.wordBig, AR(step.word) && s.arBig]}>{step.word.ug}</Text>
            {!!step.word.hint && <T variant="muted">{step.word.hint}</T>}
            {!!step.word.arabic && <T variant="arabic">{step.word.arabic}</T>}
            {!step.word.forms && <SpeakButton filled label="Прослушать" onPress={() => speak(step.word)} />}
          </Bubble>
        </View>
        {!!step.word.forms && (
          <Bubble style={{ alignItems: 'center', gap: 4 }}>
            <T variant="muted" style={{ fontSize: 14 }}>
              {step.word.forms.trim().split(/\s+/).length === 3 ? 'В конце · в середине · в начале слова' : 'После другой буквы · отдельно'}
            </T>
            <Text style={[s.ar, s.forms]}>{step.word.forms}</Text>
          </Bubble>
        )}
        <Bubble style={{ alignItems: 'center' }}>
          <T variant="muted" style={{ fontSize: 14 }}>{step.word.forms ? 'Буква' : AR(step.word) ? 'Читается' : 'Перевод'}</T>
          <Text style={s.translation}>{step.word.ru}</Text>
        </Bubble>
      </>
    );
    foot = <Button variant="blue" title="Понятно" onPress={next} />;
  } else if (step.kind === 'choose') {
    const ug = step.direction === 'ug-ru';
    const ar = AR(step.word);
    const eyebrow = ar
      ? ug ? (isPhrase(step.word) ? 'Что здесь написано?' : 'Как это читается?') : 'Найди, как это пишется'
      : ug ? 'Переведи на русский' : 'Как это по-уйгурски?';
    body = (
      <>
        <T variant="eyebrow">{eyebrow}</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={110} height={130} talking={talking} />
          <Bubble style={[ui.row, { flex: 1, marginBottom: 10, justifyContent: 'space-between' }]}>
            <Text style={[s.prompt, ug && { color: colors.blue, fontSize: 28 }, ug && ar && s.arBig]}>{ug ? step.word.ug : step.word.ruShort}</Text>
            {ug && !ar && <SpeakButton label="Прослушать" onPress={() => speak(step.word)} />}
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
                <Text style={[s.optText, !ug && { color: colors.blue }, !ug && ar && s.arOpt, sel && { color: colors.blueDark }, good && { color: colors.okInk }, bad && { color: colors.redDark }]}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
    foot = <CheckFoot checked={checked} canCheck={picked !== null} answer={answerText(step.word)} onCheck={check} onNext={next} />;
  } else if (step.kind === 'build') {
    const phrase = isPhrase(step.word);
    const ar = AR(step.word);
    const eyebrow = ar
      ? phrase ? 'Собери фразу арабицей' : 'Напиши арабицей'
      : phrase ? 'Собери фразу по-уйгурски' : 'Собери слово по-уйгурски';
    body = (
      <>
        <T variant="eyebrow">{eyebrow}</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={110} height={130} talking={talking} />
          <Bubble style={{ flex: 1, marginBottom: 10 }}><Text style={s.prompt}>{step.word.ruShort}</Text></Bubble>
        </View>
        {ar && (
          // Буквы в слове соединяются, поэтому показываем собранное слово целиком
          <Text style={[s.ar, s.arPreview]} accessibilityLabel="Собранное слово">
            {built.map((id) => step.tiles[id].char).join(phrase ? ' ' : '') || ' '}
          </Text>
        )}
        <View style={[s.slots, ar && { flexDirection: 'row-reverse' }]} accessibilityLabel="Ваш ответ">
          {built.length ? (
            built.map((id, k) => (
              <Pressable key={id} accessibilityRole="button" disabled={!!checked} onPress={() => setBuilt(built.filter((_, j) => j !== k))} style={s.tile}>
                <Text style={[s.tileText, ar && s.arTile]}>{step.tiles[id].char}</Text>
              </Pressable>
            ))
          ) : (
            <T variant="muted" style={{ fontSize: 14 }}>
              {phrase ? 'Нажимай на слова ниже' : 'Нажимай на буквы ниже'}{ar ? ', первая буква справа' : ''}
            </T>
          )}
        </View>
        <View style={[s.tiles, ar && { flexDirection: 'row-reverse' }]}>
          {step.tiles.map((t) => {
            const used = built.includes(t.id);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={phrase ? t.char : `Буква ${t.char}`}
                disabled={used || !!checked}
                onPress={() => setBuilt([...built, t.id])}
                style={[s.tile, used && { opacity: 0 }]}>
                <Text style={[s.tileText, ar && s.arTile]}>{t.char}</Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
    foot = <CheckFoot checked={checked} canCheck={built.length > 0} answer={answerText(step.word)} onCheck={check} onNext={next} />;
  } else if (step.kind === 'trace') {
    const glyph = GLYPHS[step.word.ug];
    const mode = step.mode;
    const name = step.word.hint?.split(',')[0] ?? step.word.ruShort;
    body = (
      <>
        <T variant="eyebrow">{{ trace: 'Обведи букву', half: 'Допиши букву', free: 'Напиши букву сам' }[mode]}</T>
        <View style={[ui.row, { alignItems: 'flex-end' }]}>
          <Avatar who={who} width={90} height={106} talking={talking} />
          <Bubble style={[ui.row, { flex: 1, marginBottom: 8, justifyContent: 'space-between' }]}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.prompt}>{name}</Text>
              <T variant="muted" style={{ fontSize: 14 }}>
                {{ trace: 'Веди пальцем от зелёной точки', half: 'Начало уже есть, продолжи и поставь точки', free: 'Напиши по памяти, справа налево' }[mode]}
              </T>
            </View>
            {mode !== 'free' && <Text style={[s.ar, { fontSize: 34, lineHeight: 54 }]}>{step.word.ug}</Text>}
          </Bubble>
        </View>
        {glyph ? (
          <>
            <TracePad glyph={glyph} mode={mode} ink={ink} onInk={setInk} ghost={!!traced && !traced.ok} disabled={!!traced} />
            <Button variant="ghost" title="Стереть" disabled={!ink.length || !!traced?.ok} onPress={() => { setInk([]); setTraced(null); }} />
          </>
        ) : (
          <T variant="muted">Для этой буквы пропись ещё не готова.</T>
        )}
      </>
    );
    const verify = () => {
      if (!glyph) return next();
      const r = checkTrace(glyph, ink, mode);
      feedback(r.ok);
      setTraced(r);
      // Ошибкой считаем только письмо по памяти, обводить и дописывать можно сколько угодно
      if (!r.ok && mode === 'free') miss(step);
    };
    foot = !traced ? (
      <Button title="Проверить" disabled={!!glyph && !ink.length} onPress={verify} />
    ) : traced.ok ? (
      <>
        <Verdict ok text={PRAISE[i % PRAISE.length]} />
        <Button variant="ok" title="Дальше" onPress={next} />
      </>
    ) : (
      <>
        <Verdict ok={false} text={traced.hint ?? 'Не похоже'} />
        <T variant="muted" style={{ fontSize: 14 }}>Красным пунктиром показано, как пишется буква.</T>
        {mode === 'free'
          ? <Button title="Понятно" onPress={next} />
          : <Button title="Ещё раз" onPress={() => { setInk([]); setTraced(null); }} />}
      </>
    );
  } else {
    const all = matched.length === step.words.length;
    body = (
      <>
        <T variant="eyebrow">Найди пары</T>
        <T variant="h2">{step.words.some(AR) ? 'Соедини написание и чтение' : 'Соедини слово и перевод'}</T>
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
                  <Text style={[s.optText, { color: colors.blue, fontSize: 19 }, AR(w) && s.arOpt, done && { color: colors.okInk }]}>{w.ug}</Text>
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
      <T variant="muted" style={{ textAlign: 'center', fontSize: 14 }}>
        {step.words.some(AR) ? 'Сначала нажми слева на арабскую запись, потом на её пару' : 'Сначала нажми на уйгурское слово, потом на перевод'}
      </T>
    );
  }

  const verdict = checked ?? traced;
  const footTone = verdict ? (verdict.ok ? s.footGood : s.footBad) : step.kind === 'match' && matched.length === step.words.length ? s.footGood : null;

  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <TopBar icon="close" label="Закрыть урок" onPress={() => router.back()}>
        <ProgressBar value={i / steps.length} />
        <View style={[ui.row, { gap: 4 }]} accessibilityLabel={`Гранатов: ${hearts}`}>
          <PomegranateIcon />
          <Text style={s.hearts}>{hearts}</Text>
        </View>
      </TopBar>
      {/* Пока пишем пальцем, экран не прокручивается, иначе прокрутка перехватит штрих */}
      <ScrollView scrollEnabled={step.kind !== 'trace'} contentContainerStyle={[ui.pad, { gap: 16 }]}>{body}</ScrollView>
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

function Result({ who, title, unit, count, mistakes, stars, gain }: {
  who: AvatarId; title: string; unit: string; count: number; mistakes: number; stars: number; gain: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[ui.pad, s.center]}>
        <Avatar who={who} width={170} height={230} talking />
        <View style={[ui.row, { gap: 4 }]} accessibilityLabel={`${stars} из 3 звёзд`}>
          {[0, 1, 2].map((k) => <StarIcon key={k} size={54} color={k < stars ? colors.gold : colors.line} />)}
        </View>
        <T variant="h1" style={{ textAlign: 'center' }}>«{title}» пройден!</T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          {mistakes
            ? `Ошибок: ${mistakes}. Мы повторили их в конце урока и сохранили для «Работы над ошибками».`
            : 'Ни одной ошибки, барикалла!'}
        </T>
        <View style={[ui.row, { gap: 10, flexWrap: 'wrap', justifyContent: 'center' }]}>
          <Bubble style={[ui.row, { gap: 6, borderRadius: 14 }]}>
            <ApricotIcon />
            <Text style={[s.pill, { color: '#8A5A00' }]}>+{gain} абрикосов</Text>
          </Bubble>
          {count > 0 && <Bubble style={{ borderRadius: 14 }}><Text style={s.pill}>{count} {unit}</Text></Bubble>}
        </View>
      </ScrollView>
      <View style={[ui.foot, { paddingBottom: insets.bottom + 18 }]}>
        <Button variant="blue" title="Продолжить" onPress={() => router.back()} />
      </View>
    </View>
  );
}

/** Если урок не открылся, показываем причину вместо белого экрана */
export function ErrorBoundary({ error }: { error: Error; retry: () => Promise<void> }) {
  return <Broken who="raihan" text={`Урок не открылся: ${error.message}`} />;
}

function Broken({ who, text }: { who: AvatarId; text: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[ui.pad, s.center]}>
        <Avatar who={who} width={150} height={200} />
        <T variant="h1" style={{ textAlign: 'center' }}>Ой, что-то пошло не так</T>
        <T variant="muted" style={{ textAlign: 'center' }}>{text} Обновите приложение до последней версии.</T>
      </ScrollView>
      <View style={[ui.foot, { paddingBottom: insets.bottom + 18 }]}>
        <Button variant="blue" title="На карту" onPress={() => router.back()} />
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
  ruleText: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: colors.ink },
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
  // Арабская графика: свой шрифт, крупнее кириллицы и справа налево
  ar: { fontFamily: fonts.arabic, writingDirection: 'rtl', color: colors.blue },
  arBig: { fontFamily: fonts.arabic, writingDirection: 'rtl', fontSize: 40, lineHeight: 64 },
  arOpt: { fontFamily: fonts.arabic, writingDirection: 'rtl', fontSize: 26, lineHeight: 40 },
  arTile: { fontFamily: fonts.arabic, fontSize: 26, lineHeight: 40 },
  arPreview: { fontSize: 38, lineHeight: 64, textAlign: 'center', minHeight: 64 },
  forms: { fontSize: 34, lineHeight: 58, textAlign: 'center' },
});
