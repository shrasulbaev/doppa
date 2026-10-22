// Сборка и проверка заданий урока. Без React и сети, чтобы легко тестировать.
import type { Word } from './types';

export type Step =
  | { kind: 'intro'; word: Word }
  | { kind: 'choose'; word: Word; direction: 'ug-ru' | 'ru-ug'; options: string[]; answer: string }
  | { kind: 'build'; word: Word; tiles: { id: number; char: string }[] }
  | { kind: 'match'; words: Word[]; left: Word[]; right: Word[] };

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

/** Готовит случайную часть задания: варианты ответа, буквы, порядок пар. */
export function prepare(step: Step, pool: Word[], rng: Rng = Math.random): Step {
  switch (step.kind) {
    case 'choose': {
      const field = step.direction === 'ug-ru' ? 'ruShort' : 'ug';
      const answer = step.word[field];
      // Отвлекающие варианты не должны совпадать со словом ни по-уйгурски, ни по переводу
      const others = shuffle(
        Array.from(new Set(pool
          .filter((w) => w.ug !== step.word.ug && w.ruShort !== step.word.ruShort)
          .map((w) => w[field]))),
        rng,
      ).slice(0, 3);
      return { ...step, answer, options: shuffle([...others, answer], rng) };
    }
    case 'build': {
      const letters = Array.from(step.word.ug);
      const extra = shuffle(DISTRACTOR_LETTERS.filter((c) => !letters.includes(c)), rng).slice(0, 2);
      const tiles = shuffle([...letters, ...extra], rng).map((char, id) => ({ id, char }));
      return { ...step, tiles };
    }
    case 'match':
      return { ...step, left: shuffle(step.words, rng), right: shuffle(step.words, rng) };
    default:
      return step;
  }
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
  return built.join('') === step.word.ug;
}

/** Звёзды за уровень: 3 без ошибок, 2 за одну-две ошибки, иначе 1. */
export function starsFor(mistakes: number): number {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
