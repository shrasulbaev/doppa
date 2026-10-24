/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import course from '../../content/course.json' with { type: 'json' };
import dictionary from '../../content/dictionary.json' with { type: 'json' };
import { ARABIC_LETTERS, arabicTiles, cyrToArabic, letterForms } from './arabic.ts';
import { checkBuild, checkChoose } from './lesson.ts';
import type { Course, Level, Story, Word } from './types.ts';
import traceItems from '../../content/trace-items.json' with { type: 'json' };
import traceData from '../../content/trace.json' with { type: 'json' };
import { checkTrace, halfOf, type Glyph, type Pt } from './trace.ts';
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
    assert.ok(items.length >= (level.kind === 'trace' ? 3 : 4), `${level.id}: мало материала (${items.length})`);
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

const GLYPHS = traceData as unknown as Record<string, Glyph>;

/** Как ученик пишет эталон: идём по точкам линии от ближайшей к ближайшей, отрываем палец на скачках */
function writeLike(g: Glyph, shake = 0): Pt[][] {
  const left = g.line.slice();
  const strokes: Pt[][] = [];
  let cur = left.splice(left.findIndex((p) => Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) < 3) || 0, 1)[0];
  let stroke: Pt[] = [cur];
  while (left.length) {
    let k = 0;
    left.forEach((p, j) => { if (Math.hypot(p[0] - cur[0], p[1] - cur[1]) < Math.hypot(left[k][0] - cur[0], left[k][1] - cur[1])) k = j; });
    const next = left.splice(k, 1)[0];
    if (Math.hypot(next[0] - cur[0], next[1] - cur[1]) > 6) { strokes.push(stroke); stroke = []; }
    stroke.push([next[0] + (stroke.length % 2 ? shake : -shake), next[1]]);
    cur = next;
  }
  strokes.push(stroke);
  // Обрывки короче точки дописываем к линии, как сделал бы человек одним движением
  return [...strokes.filter((l) => l.length > 6), ...g.marks.map((m): Pt[] => [m.at, [m.at[0] + 1, m.at[1] + 1]])];
}

test('у всего, что пишется в прописи, есть эталон из шрифта', () => {
  const items = WRITING_LEVELS.filter((l) => l.kind === 'trace').flatMap((l) => writingItems(l, full).items.map((w) => w.ug));
  for (const ug of items) assert.ok(GLYPHS[ug], `нет эталона для ${ug}: запусти scripts/trace-items.mts и trace_templates.py`);
  assert.deepEqual([...new Set(items)], traceItems);
  // Все буквы алфавита есть в прописи
  for (const l of ARABIC_LETTERS) assert.ok(items.includes(l.ar), l.ar);
});

test('аккуратно написанный эталон проходит проверку на всех шагах, пустое поле — нет', () => {
  for (const [ug, g] of Object.entries(GLYPHS)) {
    const ink = writeLike(g, 1.5);
    for (const mode of ['trace', 'half', 'free'] as const) {
      const r = checkTrace(g, ink, mode);
      assert.ok(r.ok, `${ug} (${mode}): ${r.hint} cov=${r.coverage.toFixed(2)} prec=${r.precision.toFixed(2)}`);
    }
    assert.equal(checkTrace(g, [], 'free').ok, false);
    // По памяти рука пишет иначе: уже, с наклоном, в другом месте — это всё ещё верно
    const hand = ink.map((l) => l.map(([x, y]): Pt => [5 + x * 0.85 + (60 - y) * 0.15, y * 0.95 + 3]));
    const r = checkTrace(g, hand, 'free');
    assert.ok(r.ok, `${ug} (по памяти с наклоном): ${r.hint} shape=${r.shape.toFixed(1)}`);
  }
});

test('проверка прописи: забытые точки, точки не там, каракули и половина буквы не проходят', () => {
  const b = GLYPHS['ب'];
  const ink = writeLike(b, 1.5);
  const body = ink.slice(0, -1);
  const noDot = checkTrace(b, body, 'trace');
  assert.equal(noDot.ok, false);
  assert.match(noDot.hint ?? '', /точк/);
  // Точки сверху, как у «т»: это не «б»
  const t = GLYPHS['ت'];
  const tDots = t.marks.map((m): Pt[] => [m.at, [m.at[0] + 1, m.at[1] + 1]]);
  assert.equal(checkTrace(b, [...body, ...tDots], 'trace').ok, false);
  assert.equal(checkTrace(b, [...ink, ...tDots], 'trace').ok, false);
  // Прямая черта вместо буквы
  const y = b.base - 3;
  assert.equal(checkTrace(b, [[[b.w - 10, y], [10, y]], ...ink.slice(-1)], 'trace').ok, false);
  // Только обведённая половина не засчитывается ни на «Обвести», ни на «Половине»
  const { shown } = halfOf(b);
  const firstPart = body.map((l) => l.filter(shown)).filter((l) => l.length > 6);
  assert.equal(checkTrace(b, [...firstPart, ...ink.slice(-1)], 'trace').ok, false);
  assert.equal(checkTrace(b, [...firstPart, ...ink.slice(-1)], 'half').ok, false);
  // По памяти: мельче и в углу поля — всё равно верно
  const small = (p: Pt): Pt => [10 + p[0] * 0.5, 30 + p[1] * 0.5];
  assert.ok(checkTrace(b, ink.map((l) => l.map(small)), 'free').ok);
  // Слово без хамзы над первой буквой — ошибка
  const ata = GLYPHS['ئاتا'];
  const ataInk = writeLike(ata);
  assert.ok(checkTrace(ata, ataInk, 'trace').ok);
  const hamza = ata.marks.reduce((a, m) => (m.at[0] > a.at[0] ? m : a));
  const noHamza = ataInk.filter((l) => l[0] !== hamza.at);
  assert.equal(noHamza.length, ataInk.length - 1);
  assert.equal(checkTrace(ata, noHamza, 'trace').ok, false);
});

test('на шаге «Половина» показана примерно половина, с той стороны, откуда начинают писать', () => {
  for (const ug of ['ب', 'ا', 'ئاتا', 'بۇ نان']) {
    const g = GLYPHS[ug];
    const { shown, axis } = halfOf(g);
    const part = g.line.filter(shown).length / g.line.length;
    assert.ok(part > 0.4 && part < 0.6, `${ug}: ${part}`);
    assert.ok(shown(g.start), `${ug}: начало не в показанной половине`);
    if (ug === 'ا') assert.equal(axis, 'y');
  }
});
