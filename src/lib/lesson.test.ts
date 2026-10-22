/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildLesson, checkBuild, checkChoose, prepare, starsFor, type Step } from './lesson.ts';
import type { Word } from './types.ts';

const word = (id: number, ug: string, ruShort: string): Word => ({
  id, topic: 't', ug, arabic: null, latin: null, ru: ruShort, ruShort, pos: null, status: '', audio: null,
});
const words = [
  word(1, 'салам', 'привет'), word(2, 'рәхмәт', 'спасибо'), word(3, 'хош', 'пока'),
  word(4, 'ана', 'мама'), word(5, 'ата', 'папа'), word(6, 'бала', 'ребёнок'),
];
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('урок вводит каждое слово до того, как о нём спрашивают', () => {
  const steps = buildLesson(words, words, seeded());
  const seen = new Set<number>();
  for (const s of steps) {
    if (s.kind === 'intro') seen.add(s.word.id);
    else if (s.kind === 'match') s.words.forEach((w) => assert.ok(seen.has(w.id)));
    else assert.ok(seen.has(s.word.id), `${s.kind} до знакомства со словом ${s.word.ug}`);
  }
  assert.equal(seen.size, 6);
  assert.deepEqual(steps.map((s) => s.kind), [
    'intro', 'intro', 'choose', 'choose',
    'intro', 'intro', 'choose', 'choose', 'build', 'match',
    'intro', 'intro', 'choose', 'choose', 'build', 'match',
  ]);
});

test('в выборе четыре разных варианта, один из них верный', () => {
  for (const s of buildLesson(words, words, seeded(7))) {
    if (s.kind !== 'choose') continue;
    assert.equal(s.options.length, 4);
    assert.equal(new Set(s.options).size, 4);
    assert.ok(s.options.includes(s.answer));
    assert.ok(checkChoose(s, s.answer));
    assert.equal(s.answer, s.direction === 'ug-ru' ? s.word.ruShort : s.word.ug);
  }
});

test('из букв можно собрать слово, и лишних букв ровно две', () => {
  const step = prepare({ kind: 'build', word: words[1], tiles: [] }, words, seeded(3)) as Extract<Step, { kind: 'build' }>;
  assert.equal(step.tiles.length, Array.from('рәхмәт').length + 2);
  assert.ok(checkBuild(step, Array.from('рәхмәт')));
  assert.ok(!checkBuild(step, Array.from('рәхмт')));
});

test('звёзды за ошибки', () => {
  assert.equal(starsFor(0), 3);
  assert.equal(starsFor(2), 2);
  assert.equal(starsFor(3), 1);
});
