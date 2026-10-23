// Курс арабской графики: от букв до предложений. Уровни строятся из алфавита,
// словаря и фраз грамматических уровней, поэтому отдельного контента не требуют.
import { ARABIC_LETTERS, cyrToArabic, letterByAr, letterForms, type ArabicLetter } from './arabic.ts';
import { buildSteps, type Rng, type Step } from './lesson.ts';
import type { Course, Rule, Word } from './types';

export type WritingKind = 'letters' | 'trace' | 'forms' | 'read' | 'write' | 'phrases';

export type WritingLevel = {
  id: string;
  stage: number;
  title: string;
  kind: WritingKind;
  /** Буквы (в арабице) для уровней букв и форм */
  letters?: string[];
  /** Слова из словаря для чтения и письма */
  wordIds?: number[];
  /** Грамматические уровни, из которых берутся фразы */
  phraseLevels?: string[];
  /** Связки слов для прописи: как читается кириллицей и перевод */
  phrases?: [string, string][];
  rule?: Rule;
};

export type WritingStage = { n: number; title: string; about: string };

export const WRITING_STAGES: WritingStage[] = [
  { n: 1, title: 'Буквы', about: 'Как выглядит каждая из 32 букв' },
  { n: 2, title: 'Пропись: буквы', about: 'Пишем буквы пальцем: обвести, дописать, написать самому' },
  { n: 3, title: 'Формы букв', about: 'Буква меняется в начале, середине и конце слова' },
  { n: 4, title: 'Чтение слов', about: 'Знакомые слова в арабской записи' },
  { n: 5, title: 'Письмо', about: 'Собираем слова из букв' },
  { n: 6, title: 'Пропись: слова', about: 'Пишем слова слитно, буква за буквой' },
  { n: 7, title: 'Фразы', about: 'Читаем и собираем предложения' },
  { n: 8, title: 'Пропись: связки', about: 'Пишем два слова подряд' },
];

const ar = (s: string) => s.split(' ');

export const WRITING_LEVELS: WritingLevel[] = [
  {
    id: 'w-letters-1', stage: 1, title: 'Гласные а, ә, о, у', kind: 'letters', letters: ar('ا ە و ۇ'),
    rule: {
      text: 'Арабская графика пишется справа налево. Все восемь гласных пишутся буквами, поэтому слово читается так же, как написано.',
      examples: [{ ug: 'ا', ru: 'а' }, { ug: 'ە', ru: 'ә' }, { ug: 'و', ru: 'о' }, { ug: 'ۇ', ru: 'у' }],
    },
  },
  {
    id: 'w-letters-2', stage: 1, title: 'Гласные ө, ү, е, и', kind: 'letters', letters: ar('ۆ ۈ ې ى'),
    rule: {
      text: 'В начале слова гласная пишется с подставкой ئ (хамза): ата → ئاتا. Так же после другой гласной.',
      examples: [{ ug: 'ئاتا', ru: 'ата' }, { ug: 'ئۆي', ru: 'өй' }, { ug: 'ئىت', ru: 'ит' }],
    },
  },
  { id: 'w-letters-3', stage: 1, title: 'б, п, т, н, й', kind: 'letters', letters: ar('ب پ ت ن ي') },
  { id: 'w-letters-4', stage: 1, title: 'җ, ч, х, д, р, з, ж', kind: 'letters', letters: ar('ج چ خ د ر ز ژ') },
  { id: 'w-letters-5', stage: 1, title: 'с, ш, ғ, ф, қ', kind: 'letters', letters: ar('س ش غ ف ق') },
  { id: 'w-letters-6', stage: 1, title: 'к, г, ң, л, м, һ, в', kind: 'letters', letters: ar('ك گ ڭ ل م ھ ۋ') },
  { id: 'w-trace-1', stage: 2, title: 'Пишем а, ә, о, у', kind: 'trace', letters: ar('ا ە و ۇ') },
  { id: 'w-trace-2', stage: 2, title: 'Пишем ө, ү, е, и', kind: 'trace', letters: ar('ۆ ۈ ې ى') },
  { id: 'w-trace-3', stage: 2, title: 'Пишем б, п, т, н, й', kind: 'trace', letters: ar('ب پ ت ن ي') },
  { id: 'w-trace-4', stage: 2, title: 'Пишем җ, ч, х, д, р, з, ж', kind: 'trace', letters: ar('ج چ خ د ر ز ژ') },
  { id: 'w-trace-5', stage: 2, title: 'Пишем с, ш, ғ, ф, қ', kind: 'trace', letters: ar('س ش غ ف ق') },
  { id: 'w-trace-6', stage: 2, title: 'Пишем к, г, ң, л, м, һ, в', kind: 'trace', letters: ar('ك گ ڭ ل م ھ ۋ') },
  {
    id: 'w-forms-1', stage: 3, title: 'Буквы соединяются', kind: 'forms', letters: ar('ب ت ن ي س ش ق ك ل م'),
    rule: {
      text: 'Буквы в слове пишутся слитно, поэтому у каждой есть форма для начала, середины и конца. Узнавай букву по точкам и «зубчикам».',
      examples: [{ ug: 'بـ ـبـ ـب', ru: 'б' }, { ug: 'نـ ـنـ ـن', ru: 'н' }, { ug: 'كـ ـكـ ـك', ru: 'к' }],
    },
  },
  {
    id: 'w-forms-2', stage: 3, title: 'Буквы без соединения', kind: 'forms', letters: ar('ا ە د ر ز و ۇ ۋ'),
    rule: {
      text: 'Эти буквы соединяются только с предыдущей буквой, а следующая после них пишется заново, как в начале слова.',
      examples: [{ ug: 'دادا', ru: 'дада' }, { ug: 'ئانا', ru: 'ана' }, { ug: 'ئۇكا', ru: 'ука' }],
    },
  },
  { id: 'w-read-1', stage: 4, title: 'Семья', kind: 'read', wordIds: [11, 12, 14, 13, 17, 19] },
  { id: 'w-read-2', stage: 4, title: 'Еда', kind: 'read', wordIds: [80, 81, 82, 83, 85, 87] },
  { id: 'w-read-3', stage: 4, title: 'Природа и цвета', kind: 'read', wordIds: [133, 134, 139, 142, 56, 57] },
  { id: 'w-read-4', stage: 4, title: 'Числа и вежливость', kind: 'read', wordIds: [32, 34, 36, 41, 1, 3] },
  { id: 'w-write-1', stage: 5, title: 'Короткие слова', kind: 'write', wordIds: [108, 106, 175, 60, 62, 68] },
  { id: 'w-write-2', stage: 5, title: 'Школа', kind: 'write', wordIds: [205, 209, 200, 201, 207, 212] },
  { id: 'w-write-3', stage: 5, title: 'Родина', kind: 'write', wordIds: [275, 276, 284, 52, 256, 257] },
  { id: 'w-trace-words-1', stage: 6, title: 'Семья и еда', kind: 'trace', wordIds: [11, 12, 80, 32, 68, 108] },
  { id: 'w-trace-words-2', stage: 6, title: 'Вокруг нас', kind: 'trace', wordIds: [106, 175, 81, 82, 60, 62] },
  { id: 'w-phrases-1', stage: 7, title: 'Это… У меня есть…', kind: 'phrases', phraseLevels: ['ghulja-g1', 'hotan-g2'] },
  { id: 'w-phrases-2', stage: 7, title: 'О себе', kind: 'phrases', phraseLevels: ['aksu-g1', 'urumqi-g1'] },
  {
    id: 'w-trace-phrases-1', stage: 8, title: 'Это…', kind: 'trace',
    phrases: [['Бу нан', 'Это лепёшка'], ['Бу өй', 'Это дом'], ['Бу чай', 'Это чай'], ['Бу китап', 'Это книга']],
  },
  {
    id: 'w-trace-phrases-2', stage: 8, title: 'Какой? Чей?', kind: 'trace',
    phrases: [['Ақ ат', 'Белая лошадь'], ['Чоң өй', 'Большой дом'], ['Мән бала', 'Я ребёнок'], ['Атам бар', 'У меня есть отец']],
  },
];

export function isWritingLevel(id: string): boolean {
  return id.startsWith('w-');
}

const base = { arabic: null, latin: null, pos: null, status: 'не проверено', audio: null, script: 'arabic' as const };

function letterWord(l: ArabicLetter, k: number): Word {
  const f = letterForms(l);
  const big = l.cyr.toUpperCase() + l.cyr;
  return {
    ...base, id: -(1000 + k), topic: 'Буквы', ug: l.ar, ruShort: big, ru: big,
    hint: `буква «${l.name}», ${l.vowel ? 'гласная' : 'согласная'}${l.joinsNext ? '' : ', не соединяется со следующей'}`,
    // Строка пишется справа налево: первая форма окажется справа
    forms: l.joinsNext ? `${f.start}  ${f.middle}  ${f.end}` : `${f.start}  ${f.end}`,
  };
}

function formWords(l: ArabicLetter, k: number): Word[] {
  const f = letterForms(l);
  const big = l.cyr.toUpperCase() + l.cyr;
  return [f.start, f.middle, f.end].map((ug, j) => ({
    ...base, id: -(2000 + k * 3 + j), topic: 'Формы', ug, ruShort: big, ru: big, group: l.ar,
  }));
}

/** Слово словаря в арабской записи; ответ — как оно читается кириллицей */
function readWord(w: Word): Word {
  return {
    ...base, id: -(3000 + w.id), topic: w.topic, ug: w.arabic ?? cyrToArabic(w.ug), ruShort: w.ug,
    ru: `${w.ug} — ${w.ruShort}`, hint: w.ruShort, audio: w.audio, status: w.status,
  };
}

/** Арабское написание слов словаря, чтобы фразы писались как в словаре */
export function knownArabic(words: Word[]): Map<string, string> {
  return new Map(words.filter((w) => w.arabic).map((w) => [w.ug.toLowerCase(), w.arabic as string]));
}

export type WritingItems = { items: Word[]; pool: Word[] };

/** Материал уровня: что учим (items) и откуда берутся неверные варианты (pool) */
export function writingItems(level: WritingLevel, course: Course): WritingItems {
  const words = new Map(course.words.map((w) => [w.id, w]));
  switch (level.kind) {
    case 'letters': {
      const items = (level.letters ?? []).map((a) => letterWord(letterByAr(a)!, ARABIC_LETTERS.findIndex((l) => l.ar === a)));
      return { items, pool: ARABIC_LETTERS.map(letterWord) };
    }
    case 'trace': {
      // Буквы, слова словаря или связки слов: в ug — арабская запись, по ней ищется эталон прописи
      const known = knownArabic(course.words);
      const items = [
        ...(level.letters ?? []).map((a) => letterWord(letterByAr(a)!, ARABIC_LETTERS.findIndex((l) => l.ar === a))),
        ...(level.wordIds ?? []).map((id) => words.get(id)).filter((w): w is Word => !!w).map(readWord),
        ...(level.phrases ?? []).map(([cyr, ru], k): Word => ({
          ...base, id: -(5000 + k), topic: level.title, ug: cyrToArabic(cyr, known), ruShort: cyr, ru: `${cyr} — ${ru}`, hint: ru,
        })),
      ];
      return { items, pool: items };
    }
    case 'forms': {
      const items = (level.letters ?? []).flatMap((a) => formWords(letterByAr(a)!, ARABIC_LETTERS.findIndex((l) => l.ar === a)));
      return { items, pool: ARABIC_LETTERS.flatMap(formWords) };
    }
    case 'read':
    case 'write': {
      const items = (level.wordIds ?? []).map((id) => words.get(id)).filter((w): w is Word => !!w).map(readWord);
      const pool = course.words.filter((w) => w.arabic && !w.ug.includes(' ')).map(readWord);
      return { items, pool };
    }
    case 'phrases': {
      const known = knownArabic(course.words);
      const items = (level.phraseLevels ?? [])
        .flatMap((id) => (course.levels.find((l) => l.id === id)?.items ?? []).filter((p) => p.ug.includes(' ')).slice(0, 3))
        .map((p, k): Word => ({
          ...base, id: -(4000 + k), topic: level.title, ug: cyrToArabic(p.ug, known), ruShort: p.ru,
          ru: `${p.ug} — ${p.ru}`, hint: p.ug, wrong: p.wrong?.map((w) => cyrToArabic(w, known)),
        }));
      return { items, pool: items };
    }
  }
}

/** Задания уровня письменности */
export function buildWritingLesson(level: WritingLevel, course: Course, rng: Rng = Math.random): Step[] {
  const { items, pool } = writingItems(level, course);
  const rule: Step[] = level.rule ? [{ kind: 'rule', rule: level.rule, script: 'arabic' }] : [];
  switch (level.kind) {
    case 'letters':
      return [...rule, ...buildSteps(items, pool, { intro: true, choose: ['ug-ru', 'ru-ug'], match: true }, rng)];
    case 'forms': {
      // Знакомим с буквой, потом угадываем её формы. У несоединяющихся букв форм две: середина совпадает с концом.
      return [...rule, ...(level.letters ?? []).flatMap((a) => {
        const k = ARABIC_LETTERS.findIndex((l) => l.ar === a);
        const letter = ARABIC_LETTERS[k];
        const forms = formWords(letter, k).filter((w, j, all) => all.findIndex((x) => x.ug === w.ug) === j);
        return [{ kind: 'intro', word: letterWord(letter, k) } as Step, ...buildSteps(forms, pool, { choose: ['ug-ru'] }, rng)];
      })];
    }
    case 'trace':
      // Каждую букву: обвести, дописать половину, потом написать по памяти
      return items.flatMap((word): Step[] => (['trace', 'half', 'free'] as const).map((mode) => ({ kind: 'trace', word, mode })));
    case 'read':
      return buildSteps(items, pool, { intro: true, choose: ['ug-ru', 'ru-ug'], match: true }, rng);
    case 'write':
      return buildSteps(items, pool, { choose: ['ru-ug'], build: true }, rng);
    case 'phrases':
      return buildSteps(items, pool, { intro: true, choose: ['ug-ru'], build: true }, rng);
  }
}
