/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import proverbs from '../../content/proverbs.json' with { type: 'json' };
import { ACTIVE_DAYS, planReminders } from './reminders.ts';
import { dailyIndex } from './rules.ts';

const base = { proverbs, streak: 0, teacher: 'Райхан' };

test('утром пословица, вечером напоминание, на неделю вперёд и не больше', () => {
  const now = new Date(2026, 9, 24, 8, 0);
  const plan = planReminders({ ...base, now, lastActiveOn: null });
  assert.equal(plan.filter((p) => p.kind === 'proverb').length, ACTIVE_DAYS);
  assert.equal(plan.filter((p) => p.kind === 'reminder').length, ACTIVE_DAYS);
  assert.ok(plan.every((p) => p.at > now));
  const last = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ACTIVE_DAYS);
  assert.ok(plan.every((p) => p.at < last), 'кто не заходит неделю, тому больше ничего не приходит');
  for (const p of plan) assert.equal(p.at.getHours(), p.kind === 'proverb' ? 9 : 19);
});

test('пословица в уведомлении та же, что на карте в этот день', () => {
  const now = new Date(2026, 9, 24, 8, 0);
  for (const p of planReminders({ ...base, now, lastActiveOn: null }).filter((x) => x.kind === 'proverb')) {
    assert.ok(p.body.startsWith(proverbs[dailyIndex(p.at, proverbs.length)].ug));
  }
});

test('прошедшее время не ставится, а если урок сегодня был, вечером не напоминаем', () => {
  const evening = new Date(2026, 9, 24, 20, 0);
  const plan = planReminders({ ...base, now: evening, lastActiveOn: null });
  assert.ok(plan[0].at.getDate() === 25);
  const noon = new Date(2026, 9, 24, 12, 0);
  const played = planReminders({ ...base, now: noon, lastActiveOn: '2026-10-24', streak: 3 });
  assert.ok(!played.some((p) => p.kind === 'reminder' && p.at.getDate() === 24));
  const notYet = planReminders({ ...base, now: noon, lastActiveOn: '2026-10-23', streak: 3 });
  assert.match(notYet.find((p) => p.kind === 'reminder')!.body, /Серия 3/);
});
