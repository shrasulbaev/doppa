/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HEART_REFILL_MS, MAX_HEARTS, bumpStreak, currentLevelIndex, currentStreak, heartsNow, levelStates, nextHeartIn } from './rules.ts';

const day = (s: string) => new Date(`${s}T12:00:00`);

test('серия растёт на следующий день и сгорает после пропуска', () => {
  assert.deepEqual(bumpStreak({ streak: 0, lastActiveOn: null }, day('2026-10-20')), { streak: 1, lastActiveOn: '2026-10-20' });
  assert.equal(bumpStreak({ streak: 3, lastActiveOn: '2026-10-20' }, day('2026-10-20')).streak, 3);
  assert.equal(bumpStreak({ streak: 3, lastActiveOn: '2026-10-20' }, day('2026-10-21')).streak, 4);
  assert.equal(bumpStreak({ streak: 3, lastActiveOn: '2026-10-20' }, day('2026-10-23')).streak, 1);
  assert.equal(currentStreak({ streak: 3, lastActiveOn: '2026-10-20' }, day('2026-10-21')), 3);
  assert.equal(currentStreak({ streak: 3, lastActiveOn: '2026-10-20' }, day('2026-10-22')), 0);
});

test('серия переходит через границу месяца', () => {
  assert.equal(bumpStreak({ streak: 5, lastActiveOn: '2026-10-31' }, day('2026-11-01')).streak, 6);
});

test('гранаты восстанавливаются по одному', () => {
  const t0 = 1_000_000;
  assert.equal(heartsNow({ hearts: 2, heartsUpdatedAt: t0 }, t0 + HEART_REFILL_MS - 1).hearts, 2);
  const one = heartsNow({ hearts: 2, heartsUpdatedAt: t0 }, t0 + HEART_REFILL_MS + 5);
  assert.deepEqual(one, { hearts: 3, heartsUpdatedAt: t0 + HEART_REFILL_MS });
  assert.equal(heartsNow({ hearts: 0, heartsUpdatedAt: t0 }, t0 + 99 * HEART_REFILL_MS).hearts, MAX_HEARTS);
  assert.equal(nextHeartIn({ hearts: 4, heartsUpdatedAt: t0 }, t0 + 1000), HEART_REFILL_MS - 1000);
  assert.equal(nextHeartIn({ hearts: MAX_HEARTS, heartsUpdatedAt: t0 }, t0), 0);
});

test('текущий уровень — первый непройденный', () => {
  assert.equal(currentLevelIndex(['a', 'b', 'c'], {}), 0);
  assert.equal(currentLevelIndex(['a', 'b', 'c'], { a: 1 }), 1);
  assert.equal(currentLevelIndex(['a', 'b'], { a: 1, b: 1 }), 2);
});

test('новый уровень позади не откатывает ученика назад, а просто открыт', () => {
  assert.deepEqual(levelStates(['a', 'b', 'c', 'd'], {}), { cur: 0, states: ['cur', 'lock', 'lock', 'lock'] });
  assert.deepEqual(levelStates(['a', 'g', 'b', 'c'], { a: 1, b: 1 }), { cur: 3, states: ['done', 'open', 'done', 'cur'] });
  assert.deepEqual(levelStates(['a', 'g', 'b'], { a: 1, b: 1 }), { cur: 1, states: ['done', 'cur', 'done'] });
  assert.deepEqual(levelStates(['a', 'b'], { a: 1, b: 1 }).cur, 2);
  assert.deepEqual(levelStates(['a', 'b', 'c'], { a: 1 }, true).states, ['done', 'cur', 'open']);
});
