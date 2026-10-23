/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import course from '../../content/course.json' with { type: 'json' };
import dictionary from '../../content/dictionary.json' with { type: 'json' };
import { ARABIC_LETTERS, arabicTiles, cyrToArabic, letterForms } from './arabic.ts';
import { checkBuild, checkChoose } from './lesson.ts';
import type { Course, Level, Story, Word } from './types.ts';
import { WRITING_LEVELS, WRITING_STAGES, buildWritingLesson, knownArabic, writingItems } from './writing.ts';

const full: Course = {
  words: dictionary as Word[], sections: course.sections, levels: course.levels as Level[],
  letters: course.letters, stories: course.stories as Story[],
};
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('в алфавите 32 буквы, все разные, у каждой своя кириллическая пара', () => {
  assert.equal(ARABIC_LETTERS.length, 32);
  assert.equal(new Set(ARABIC_LETTERS.map((l) => l.ar)).size, 32);
  assert.equal(new Set(ARABIC_LETTERS.map((l) => l.cyr)).size, 32);
  assert.equal(ARABIC_LETTERS.filter((l) => l.vowel).length, 8);
});

test('несоединяющаяся буква не получает формы начала', () => {
  const d = ARABIC_LETTERS.find((l) => l.cyr === 'д')!;
  assert.equal(letterForms(d).start, 'د');
  const b = ARABIC_LETTERS.find((l) => l.cyr === 'б')!;
  assert.notEqual(letterForms(b).start, letterForms(b).end);
});

test('кириллица переводится в арабицу как в словаре почти для всех слов', () => {
  const withArabic = (dictionary as Word[]).filter((w) => w.arabic);
  const same = withArabic.filter((w) => cyrToArabic(w.ug) === w.arabic);
  assert.ok(same.length / withArabic.length > 0.95, `совпало ${same.length} из ${withArabic.length}`);
  assert.equal(cyrToArabic('ата'), 'ئاتا');
  assert.equal(cyrToArabic('аилә'), 'ئائىلە');
  assert.equal(cyrToArabic('Бу немә?'), 'بۇ نېمە؟');
  // Слова из словаря пишутся как в словаре, даже если правило дало бы другое
  assert.equal(cyrToArabic('Рәхмәт сизгә', knownArabic(dictionary as Word[])).split(' ')[0], 'رەھمەت');
});

test('у каждой ступени есть уровни, а все буквы алфавита где-то изучаются', () => {
  for (const st of WRITING_STAGES) assert.ok(WRITING_LEVELS.some((l) => l.stage === st.n), st.title);
  const taught = new Set(WRITING_LEVELS.filter((l) => l.kind === 'letters').flatMap((l) => l.letters ?? []));
  assert.deepEqual([...taught].sort(), ARABIC_LETTERS.map((l) => l.ar).sort());
  assert.equal(new Set(WRITING_LEVELS.map((l) => l.id)).size, WRITING_LEVELS.length);
});

test('каждый уровень письменности собирается и в нём можно ответить верно', () => {
  for (const level of WRITING_LEVELS) {
    const { items } = writingItems(level, full);
    assert.ok(items.length >= 4, `${level.id}: мало материала (${items.length})`);
    const steps = buildWritingLesson(level, full, seeded(7));
    assert.ok(steps.length >= items.length, level.id);
    for (const s of steps) {
      if (s.kind === 'choose') {
        assert.ok(s.options.includes(s.answer), `${level.id}: нет ответа среди вариантов`);
        assert.equal(new Set(s.options).size, s.options.length, `${level.id}: повтор вариантов`);
        assert.ok(s.options.length >= 3, `${level.id}: мало вариантов для ${s.word.ug}`);
        assert.ok(checkChoose(s, s.answer));
      }
      if (s.kind === 'build') {
        assert.equal(s.word.script, 'arabic');
        const need = s.word.ug.includes(' ') ? s.word.ug.split(' ') : arabicTiles(s.word.ug);
        const left = s.tiles.map((t) => t.char);
        for (const c of need) {
          const k = left.indexOf(c);
          assert.ok(k >= 0, `${level.id}: не хватает плитки ${c} для ${s.word.ug}`);
          left.splice(k, 1);
        }
        assert.ok(checkBuild(s, need));
      }
      if (s.kind === 'match') assert.equal(new Set(s.words.map((w) => w.ruShort)).size, s.words.length);
    }
  }
});

test('урок букв сначала знакомит с буквой, потом спрашивает', () => {
  const steps = buildWritingLesson(WRITING_LEVELS[0], full, seeded(3));
  const seen = new Set<string>();
  for (const s of steps) {
    if (s.kind === 'intro') seen.add(s.word.ug);
    if (s.kind === 'choose') assert.ok(seen.has(s.word.ug), `спросили о ${s.word.ug} до знакомства`);
  }
});
