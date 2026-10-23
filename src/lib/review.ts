// Работа над ошибками: слова, буквы и фразы, в которых ученик ошибался, собираются в отдельный урок.
import { levelPhrases, buildSteps, shuffle, type Rng, type Step } from './lesson.ts';
import type { Course, Word } from './types';
import { WRITING_LEVELS, writingItems } from './writing.ts';

export const REVIEW_ID = 'review';
/** Сколько ошибок нужно накопить, чтобы открылся урок */
export const REVIEW_MIN = 3;
/** Сколько слов берём в один урок */
export const REVIEW_SIZE = 6;

export function mistakeKey(levelId: string, ug: string): string {
  return `${levelId}|${ug}`;
}

export type ReviewItem = { key: string; levelId: string; word: Word; pool: Word[] };

/** Находит слово по ключу ошибки. Если уровень или слово убрали из курса, ключ пропускаем. */
export function resolveMistake(key: string, course: Course): ReviewItem | null {
  const cut = key.indexOf('|');
  if (cut < 0) return null;
  const levelId = key.slice(0, cut);
  const ug = key.slice(cut + 1);
  const writing = WRITING_LEVELS.find((l) => l.id === levelId);
  if (writing) {
    const { items, pool } = writingItems(writing, course);
    const word = items.find((w) => w.ug === ug);
    return word ? { key, levelId, word, pool } : null;
  }
  const level = course.levels.find((l) => l.id === levelId);
  if (!level) return null;
  if (level.kind === 'phrases') {
    const items = levelPhrases(level);
    const word = items.find((w) => w.ug === ug);
    return word ? { key, levelId, word, pool: items } : null;
  }
  const word = course.words.find((w) => w.ug === ug && level.wordIds.includes(w.id));
  return word ? { key, levelId, word, pool: course.words } : null;
}

/** Последние ошибки, которые ещё есть в курсе, самые свежие первыми */
export function reviewItems(mistakes: Record<string, number> | undefined, course: Course, size = REVIEW_SIZE): ReviewItem[] {
  return Object.entries(mistakes ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => resolveMistake(key, course))
    .filter((r): r is ReviewItem => !!r)
    .slice(0, size);
}

/** Урок: напоминаем слово и дважды спрашиваем, в обе стороны */
export function buildReview(items: ReviewItem[], rng: Rng = Math.random): Step[] {
  return shuffle(items, rng).flatMap((it) =>
    buildSteps([it.word], it.pool, { intro: true, choose: ['ug-ru', 'ru-ug'] }, rng));
}
