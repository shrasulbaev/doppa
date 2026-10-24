// Уйгурская арабская графика (әрәб йезиқи): буквы, формы в слове и перевод с кириллицы.
// Без React, чтобы легко тестировать.

export type ArabicLetter = {
  /** Отдельная форма буквы */
  ar: string;
  /** Та же буква в кириллице */
  cyr: string;
  /** Как называть букву в подсказках */
  name: string;
  vowel: boolean;
  /** Соединяется ли со следующей буквой слева */
  joinsNext: boolean;
};

const L = (ar: string, cyr: string, name: string, vowel = false, joinsNext = true): ArabicLetter =>
  ({ ar, cyr, name, vowel, joinsNext });

/** 32 буквы в порядке уйгурского алфавита */
export const ARABIC_LETTERS: ArabicLetter[] = [
  L('ا', 'а', 'а', true, false),
  L('ە', 'ә', 'ә', true, false),
  L('ب', 'б', 'бә'),
  L('پ', 'п', 'пә'),
  L('ت', 'т', 'тә'),
  L('ج', 'җ', 'җим'),
  L('چ', 'ч', 'чә'),
  L('خ', 'х', 'хә'),
  L('د', 'д', 'дал', false, false),
  L('ر', 'р', 'рә', false, false),
  L('ز', 'з', 'зә', false, false),
  L('ژ', 'ж', 'жә', false, false),
  L('س', 'с', 'син'),
  L('ش', 'ш', 'шин'),
  L('غ', 'ғ', 'ғәйн'),
  L('ف', 'ф', 'фә'),
  L('ق', 'қ', 'қап'),
  L('ك', 'к', 'кап'),
  L('گ', 'г', 'гәп'),
  L('ڭ', 'ң', 'ңәп'),
  L('ل', 'л', 'лам'),
  L('م', 'м', 'мим'),
  L('ن', 'н', 'нун'),
  L('ھ', 'һ', 'һә'),
  L('و', 'о', 'о', true, false),
  L('ۇ', 'у', 'у', true, false),
  L('ۆ', 'ө', 'ө', true, false),
  L('ۈ', 'ү', 'ү', true, false),
  L('ۋ', 'в', 'вә', false, false),
  L('ې', 'е', 'е', true),
  L('ى', 'и', 'и', true),
  L('ي', 'й', 'йә'),
];

/** Хамза: подставка, с которой гласная пишется в начале слова и после другой гласной */
export const HAMZA = 'ئ';

const ZWJ = '‍';

export function letterByAr(ar: string): ArabicLetter | undefined {
  return ARABIC_LETTERS.find((l) => l.ar === ar);
}

/**
 * Четыре формы буквы. Шрифт сам выбирает нужное начертание,
 * если рядом стоит невидимый соединитель (ZWJ).
 */
export function letterForms(l: ArabicLetter) {
  return {
    alone: l.ar,
    start: l.joinsNext ? l.ar + ZWJ : l.ar,
    middle: l.joinsNext ? ZWJ + l.ar + ZWJ : ZWJ + l.ar,
    end: ZWJ + l.ar,
  };
}

const CYR_TO_AR: Record<string, string> = Object.fromEntries([
  ...ARABIC_LETTERS.map((l) => [l.cyr, l.ar]),
  ['я', 'يا'],
  ['ю', 'يۇ'],
]);
const VOWELS = new Set(ARABIC_LETTERS.filter((l) => l.vowel).map((l) => l.cyr));

/**
 * Переводит кириллицу в арабицу по правилам: буква в букву, а гласная в начале слова
 * или после гласной получает хамзу. Части слов, которые пишутся иначе
 * (рәхмәт → رەھمەت), так не угадать, поэтому для слов из словаря берём готовое написание.
 */
export function cyrToArabic(text: string, known?: Map<string, string>): string {
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part;
      const m = part.match(/^(.*?)([?!.,…]*)$/u);
      const word = (m?.[1] ?? part).toLowerCase();
      const tail = (m?.[2] ?? '').replace('?', '؟').replace(',', '،');
      const ready = known?.get(word);
      if (ready) return ready + tail;
      let out = '';
      let prev: string | null = null;
      for (const c of word) {
        if (VOWELS.has(c) && (prev === null || VOWELS.has(prev) || prev === '-')) out += HAMZA;
        out += CYR_TO_AR[c] ?? c;
        prev = c;
      }
      return out + tail;
    })
    .join('');
}

/** Буквы для сборки слова: каждая буква отдельно, хамза тоже */
export function arabicTiles(word: string): string[] {
  return Array.from(word).filter((c) => c.trim() && c !== ZWJ);
}
