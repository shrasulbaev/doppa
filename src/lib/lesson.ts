// Сборка и проверка заданий урока. Без React и сети, чтобы легко тестировать.
import { ARABIC_LETTERS, arabicTiles } from './arabic.ts';
import type { Level, Rule, Word } from './types';

export type Step =
  | { kind: 'intro'; word: Word }
  | { kind: 'choose'; word: Word; direction: 'ug-ru' | 'ru-ug'; options: string[]; answer: string }
  | { kind: 'rule'; rule: Rule; script?: 'arabic' }
  /** Сборка слова из букв или, для фраз, предложения из слов */
  | { kind: 'build'; word: Word; tiles: { id: number; char: string }[] }
  | { kind: 'match'; words: Word[]; left: Word[]; right: Word[] }
  /** Пропись: написать букву пальцем — обвести, дописать половину или написать самому */
  | { kind: 'trace'; word: Word; mode: 'trace' | 'half' | 'free' };

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DISTRACTOR_LETTERS = 'абдеиклмнорстуәөүқһ'.split('');
const ARABIC_DISTRACTORS = ARABIC_LETTERS.map((l) => l.ar);

/** Готовит случайную часть задания: варианты ответа, буквы, порядок пар. */
export function prepare(step: Step, pool: Word[], rng: Rng = Math.random): Step {
  switch (step.kind) {
    case 'choose': {
      const field = step.direction === 'ug-ru' ? 'ruShort' : 'ug';
      const answer = step.word[field];
      // Отвлекающие варианты не должны совпадать со словом ни по-уйгурски, ни по переводу.
      // У фраз сначала берём формы того же слова: атам, атаң, атиси.
      const fits = pool.filter((w) => w.ug !== step.word.ug && w.ruShort !== step.word.ruShort);
      const group = step.word.group;
      const others = Array.from(new Set([
        ...shuffle(fits.filter((w) => group && w.group === group), rng),
        ...shuffle(fits.filter((w) => !group || w.group !== group), rng),
      ].map((w) => w[field]))).slice(0, 3);
      return { ...step, answer, options: shuffle([...others, answer], rng) };
    }
    case 'build': {
      if (isPhrase(step.word)) {
        const parts = phraseParts(step.word.ug);
        const extra = (step.word.wrong ?? []).map((w) => w.toLowerCase()).filter((w) => !parts.includes(w));
        return { ...step, tiles: shuffle([...parts, ...extra], rng).map((char, id) => ({ id, char })) };
      }
      const arabic = step.word.script === 'arabic';
      const letters = arabic ? arabicTiles(step.word.ug) : Array.from(step.word.ug);
      const extra = shuffle((arabic ? ARABIC_DISTRACTORS : DISTRACTOR_LETTERS).filter((c) => !letters.includes(c)), rng).slice(0, 2);
      const tiles = shuffle([...letters, ...extra], rng).map((char, id) => ({ id, char }));
      return { ...step, tiles };
    }
    case 'match':
      return { ...step, left: shuffle(step.words, rng), right: shuffle(step.words, rng) };
    default:
      return step;
  }
}

export type StepPlan = { intro?: boolean; choose?: ('ug-ru' | 'ru-ug')[]; build?: boolean; match?: boolean };

/**
 * Урок по набору заданий: слова идут парами, каждое знакомится и закрепляется выбранными заданиями,
 * а пары проверяются поиском соответствий. Так устроены уроки письменности и работа над ошибками.
 */
export function buildSteps(items: Word[], pool: Word[], plan: StepPlan, rng: Rng = Math.random): Step[] {
  const steps: Step[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    if (plan.intro) pair.forEach((word) => steps.push({ kind: 'intro', word }));
    for (const direction of plan.choose ?? []) {
      pair.forEach((word) => steps.push({ kind: 'choose', word, direction, options: [], answer: '' }));
    }
    if (plan.build) pair.forEach((word) => steps.push({ kind: 'build', word, tiles: [] }));
    if (plan.match && i >= 2) {
      const words = items.slice(Math.max(0, i - 2), i + 2);
      // В поиске пар нужны разные ответы, иначе две карточки подходят к одной
      if (new Set(words.map((w) => w.ruShort)).size === words.length) steps.push({ kind: 'match', words, left: [], right: [] });
    }
  }
  return steps.map((s) => prepare(s, pool, rng));
}

/** Порядок урока: слова вводятся парами, потом закрепляются разными заданиями. */
export function buildLesson(words: Word[], pool: Word[], rng: Rng = Math.random): Step[] {
  const w = words;
  const choose = (word: Word, direction: 'ug-ru' | 'ru-ug'): Step =>
    ({ kind: 'choose', word, direction, options: [], answer: '' });
  const plan: Step[] = [];
  for (let i = 0; i < w.length; i += 2) {
    const pair = w.slice(i, i + 2);
    pair.forEach((word) => plan.push({ kind: 'intro', word }));
    pair.forEach((word, k) => plan.push(choose(word, k === 0 ? 'ug-ru' : 'ru-ug')));
    if (i >= 2) plan.push({ kind: 'build', word: pair[0], tiles: [] });
    if (i >= 2) plan.push({ kind: 'match', words: w.slice(Math.max(0, i - 2), i + 2), left: [], right: [] });
  }
  return plan.map((s) => prepare(s, pool, rng));
}

export function checkChoose(step: Extract<Step, { kind: 'choose' }>, picked: string): boolean {
  return picked === step.answer;
}

export function checkBuild(step: Extract<Step, { kind: 'build' }>, built: string[]): boolean {
  if (isPhrase(step.word)) return built.join(' ') === phraseParts(step.word.ug).join(' ');
  return built.join('') === (step.word.script === 'arabic' ? arabicTiles(step.word.ug).join('') : step.word.ug);
}

/** Фраза собирается из слов, а не из букв */
export function isPhrase(w: Word): boolean {
  return w.id < 0 && w.ug.includes(' ');
}

/** Слова фразы для плиток: в нижнем регистре, чтобы заглавная буква не подсказывала начало */
export function phraseParts(ug: string): string[] {
  return ug.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Фразы грамматического уровня в виде слов, чтобы работали те же задания. Номера отрицательные. */
export function levelPhrases(level: Level): Word[] {
  return (level.items ?? []).map((p, k) => ({
    id: -(k + 1), topic: level.title, ug: p.ug, arabic: null, latin: null, ru: p.ru, ruShort: p.ru,
    pos: 'фраза', status: 'не проверено', audio: null, group: p.group, wrong: p.wrong,
  }));
}

/**
 * Урок грамматики: правило, потом каждая фраза знакомится и закрепляется.
 * Отдельные формы слова (атам, атаң) учим выбором, предложения собираем из слов.
 */
export function buildPhraseLesson(level: Level, rng: Rng = Math.random): Step[] {
  const items = levelPhrases(level);
  const choose = (word: Word, direction: 'ug-ru' | 'ru-ug'): Step =>
    ({ kind: 'choose', word, direction, options: [], answer: '' });
  const plan: Step[] = level.rule ? [{ kind: 'rule', rule: level.rule }] : [];
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    pair.forEach((word) => plan.push({ kind: 'intro', word }));
    pair.forEach((word) => plan.push(isPhrase(word) ? { kind: 'build', word, tiles: [] } : choose(word, 'ru-ug')));
    pair.forEach((word, k) => {
      if (isPhrase(word) || k === 1) plan.push(choose(word, 'ug-ru'));
    });
    if (i >= 2 && i % 4 === 2) plan.push({ kind: 'match', words: items.slice(i - 2, i + 2), left: [], right: [] });
  }
  return plan.map((s) => prepare(s, items, rng));
}

/** Звёзды за уровень: 3 без ошибок, 2 за одну-две ошибки, иначе 1. */
export function starsFor(mistakes: number): number {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
