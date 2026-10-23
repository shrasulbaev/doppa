// Правила наград: серия (пиала), жизни (гранаты), опыт (абрикосы).
import type { Progress } from './types';

export const MAX_HEARTS = 5;
/** Один гранат восстанавливается за это время */
export const HEART_REFILL_MS = 30 * 60 * 1000;
export const XP_FIRST_PASS = 20;
export const XP_REPEAT = 5;
export const XP_STORY = 5;

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** Серия, которую видит человек сегодня: сгорает, если вчера не занимался. */
export function currentStreak(p: Pick<Progress, 'streak' | 'lastActiveOn'>, now: Date): number {
  if (!p.lastActiveOn) return 0;
  return daysBetween(p.lastActiveOn, dayKey(now)) <= 1 ? p.streak : 0;
}

/** Серия после занятия сегодня. */
export function bumpStreak(p: Pick<Progress, 'streak' | 'lastActiveOn'>, now: Date) {
  const today = dayKey(now);
  if (!p.lastActiveOn) return { streak: 1, lastActiveOn: today };
  const gap = daysBetween(p.lastActiveOn, today);
  if (gap <= 0) return { streak: Math.max(1, p.streak), lastActiveOn: today };
  if (gap === 1) return { streak: p.streak + 1, lastActiveOn: today };
  return { streak: 1, lastActiveOn: today };
}

/** Сколько гранатов сейчас, с учётом восстановления по времени. */
export function heartsNow(p: Pick<Progress, 'hearts' | 'heartsUpdatedAt'>, nowMs: number) {
  if (p.hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, heartsUpdatedAt: nowMs };
  const gained = Math.floor((nowMs - p.heartsUpdatedAt) / HEART_REFILL_MS);
  if (gained <= 0) return { hearts: p.hearts, heartsUpdatedAt: p.heartsUpdatedAt };
  const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
  return { hearts, heartsUpdatedAt: hearts >= MAX_HEARTS ? nowMs : p.heartsUpdatedAt + gained * HEART_REFILL_MS };
}

/** Через сколько мс восстановится следующий гранат (0, если полные). */
export function nextHeartIn(p: Pick<Progress, 'hearts' | 'heartsUpdatedAt'>, nowMs: number): number {
  const cur = heartsNow(p, nowMs);
  if (cur.hearts >= MAX_HEARTS) return 0;
  return HEART_REFILL_MS - ((nowMs - cur.heartsUpdatedAt) % HEART_REFILL_MS);
}

/** Индекс первого непройденного уровня (или длина списка, если всё пройдено). */
export function currentLevelIndex(levelIds: string[], done: Record<string, unknown>): number {
  const i = levelIds.findIndex((id) => !done[id]);
  return i < 0 ? levelIds.length : i;
}

export type LevelState = 'done' | 'cur' | 'open' | 'lock';

/**
 * Состояния уровней по всему курсу. Текущий — первый непройденный после самого дальнего пройденного,
 * поэтому новый уровень, добавленный позади, не откатывает ученика назад, а просто открыт.
 * С unlockAll (тестовая учётка) открыты все уровни.
 */
export function levelStates(levelIds: string[], done: Record<string, unknown>, unlockAll = false): { cur: number; states: LevelState[] } {
  let last = -1;
  levelIds.forEach((id, i) => { if (done[id]) last = i; });
  let cur = levelIds.findIndex((id, i) => i > last && !done[id]);
  if (cur < 0) cur = levelIds.findIndex((id) => !done[id]);
  if (cur < 0) cur = levelIds.length;
  const states = levelIds.map((id, i): LevelState =>
    done[id] ? 'done' : i === cur ? 'cur' : i < cur || unlockAll ? 'open' : 'lock');
  return { cur, states };
}

/** Номер «записи дня» из n: меняется в полночь, идёт по кругу. */
export function dailyIndex(now: Date, n: number): number {
  if (n <= 0) return 0;
  const days = daysBetween('2026-01-01', dayKey(now));
  return ((days % n) + n) % n;
}
