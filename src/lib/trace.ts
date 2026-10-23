// Пропись: проверка того, что ученик написал пальцем, по эталону из шрифта.
// Эталоны строит scripts/trace_templates.py в content/trace.json. Высота поля 100, ширина у каждого своя,
// пишется справа налево. Без React, чтобы легко тестировать.

export type Pt = [number, number];
/** Точка или мелкий значок над/под буквой: центр и радиус */
export type Mark = { at: Pt; r: number };
/** Эталон: контур для подсказки, средняя линия штрихов, значки, откуда начинать и куда вести */
export type Glyph = { w: number; base: number; outline: string; line: Pt[]; marks: Mark[]; start: Pt; dir: Pt };

export type TraceMode = 'trace' | 'half' | 'free';

/** Длина ломаной */
function length(line: Pt[]): number {
  let d = 0;
  for (let i = 1; i < line.length; i++) d += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return d;
}

/** Точки вдоль ломаной через каждые step единиц */
export function resample(line: Pt[], step = 2): Pt[] {
  if (line.length < 2) return line.slice();
  const out: Pt[] = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    let t = step - carry;
    while (t <= seg) {
      out.push([x0 + ((x1 - x0) * t) / seg, y0 + ((y1 - y0) * t) / seg]);
      t += step;
    }
    carry = seg - (t - step);
  }
  return out;
}

function bounds(pts: Pt[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

const median = (v: number[]) => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];

/**
 * Какая часть показана на шаге «Половина»: то, с чего начинают писать.
 * Широкое пишется справа налево, поэтому показываем правую половину; узкое (алиф) — верхнюю.
 */
export function halfOf(g: Glyph): { axis: 'x' | 'y'; at: number; shown: (p: Pt) => boolean } {
  const b = bounds(g.line);
  if (b.x1 - b.x0 >= (b.y1 - b.y0) * 0.6) {
    const at = median(g.line.map((p) => p[0]));
    return { axis: 'x', at, shown: (p) => p[0] >= at };
  }
  const at = median(g.line.map((p) => p[1]));
  return { axis: 'y', at, shown: (p) => p[1] <= at };
}

const near = (p: Pt, pts: Pt[], r: number) => pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= r);

/** Сдвигаем и масштабируем написанное так, чтобы его рамка совпала с рамкой эталона */
function fitTo(ink: Pt[][], target: Pt[]): Pt[][] {
  const a = bounds(ink.flat());
  const b = bounds(target);
  const k = Math.max(b.x1 - b.x0, b.y1 - b.y0) / Math.max(a.x1 - a.x0, a.y1 - a.y0, 1);
  const cx = (a.x0 + a.x1) / 2;
  const cy = (a.y0 + a.y1) / 2;
  const tx = (b.x0 + b.x1) / 2;
  const ty = (b.y0 + b.y1) / 2;
  return ink.map((line) => line.map(([x, y]): Pt => [tx + (x - cx) * k, ty + (y - cy) * k]));
}

export type TraceResult = { ok: boolean; coverage: number; precision: number; shape: number; marks: boolean; hint?: string };

/** Среднее расстояние от точек a до ближайших точек b */
function meanDist(a: Pt[], b: Pt[]): number {
  if (!a.length || !b.length) return Infinity;
  return a.reduce((s, p) => s + Math.min(...b.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))), 0) / a.length;
}

/** Отношение ширины к высоте; запас в пятую часть размера, чтобы тонкий алиф с наклоном не считался другой формой */
const aspect = (pts: Pt[]) => {
  const b = bounds(pts);
  const pad = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.2;
  return (b.x1 - b.x0 + pad) / (b.y1 - b.y0 + pad);
};

/**
 * Проверка написанного. На шагах «Обвести» и «Половина» эталон стоит на месте: смотрим, прошёл ли ученик
 * почти всю линию (coverage) и не ушёл ли в сторону (precision). На шаге «Сам» размер и положение не важны:
 * написанное подгоняется под рамку эталона и сравнивается по форме (shape — среднее расхождение в % размера).
 * Везде точки и значки должны стоять на своих местах и в нужном количестве.
 */
export function checkTrace(g: Glyph, ink: Pt[][], mode: TraceMode): TraceResult {
  const strokes = ink.filter((l) => l.length > 0);
  if (!strokes.length) return { ok: false, coverage: 0, precision: 0, shape: 100, marks: false, hint: 'Напиши пальцем в поле' };
  // Длинное поле (фраза) на экране мельче, поэтому допуск в его единицах чуть больше
  const tol = (mode === 'free' ? 9 : mode === 'half' ? 8 : 7) * Math.sqrt(Math.max(1, g.w / 100));
  const all = mode === 'free' ? fitTo(strokes, [...g.line, ...g.marks.map((m) => m.at)]) : strokes;
  // Короткие штрихи и касания — это точки и значки, длинные — линия букв
  const isMark = (l: Pt[]) => {
    const b = bounds(l);
    return Math.hypot(b.x1 - b.x0, b.y1 - b.y0) <= 16 && length(l) <= 28;
  };
  // Короткий штрих у значка эталона — значок; короткий штрих по линии буквы — кусочек линии
  const atMark = (l: Pt[]) => g.marks.some((m) => l.some((p) => near(p, [m.at], m.r + tol * 1.5)));
  const onLine = (l: Pt[]) => l.filter((p) => near(p, g.line, tol)).length >= l.length * 0.8;
  const closerToMark = (l: Pt[]) => g.marks.some((m) => meanDist(l, [m.at]) - m.r < meanDist(l, g.line));
  const markInk = all.filter((l) => isMark(l) && (closerToMark(l) || !onLine(l)));
  const linePts = all.filter((l) => !markInk.includes(l)).flatMap((l) => resample(l));
  const covered = g.line.filter((p) => near(p, linePts, tol)).length;
  const coverage = g.line.length ? covered / g.line.length : 1;
  const precision = linePts.length ? linePts.filter((p) => near(p, g.line, tol * 1.5)).length / linePts.length : 0;
  const b = bounds(g.line);
  const size = Math.max(b.x1 - b.x0, b.y1 - b.y0, 1);
  const shape = (Math.max(meanDist(g.line, linePts), meanDist(linePts, g.line)) / size) * 100;
  // Значки: каждому нужен свой штрих рядом. Чёрточкой можно поставить две-три точки подряд, касанием — одну.
  const room = new Map(markInk.map((l) => [l, length(l) < 3 ? 1 : 1 + Math.floor(length(l) / 4)]));
  const placed = g.marks.every((m) => {
    const l = markInk.find((l) => room.get(l)! > 0 && l.some((p) => near(p, [m.at], m.r + tol)));
    if (l) room.set(l, room.get(l)! - 1);
    return !!l;
  });
  const extra = markInk.filter((l) => !atMark(l)).length > 0 || markInk.length > g.marks.length;
  const marks = placed && !extra;
  const traced = mode === 'free'
    ? shape < 8 && Math.abs(Math.log(aspect(linePts) / aspect(g.line))) < Math.log(1.8)
    : coverage >= 0.75 && precision >= 0.7;
  const ok = traced && marks;
  const below = g.marks.filter((m) => m.at[1] > g.base).length;
  const hint = ok ? undefined
    : mode === 'free' && !traced ? 'Не очень похоже на образец'
      : coverage < 0.75 ? 'Написано не до конца'
        : precision < 0.7 ? 'Линия ушла в сторону'
          : !placed ? `Проверь точки и значки${below === g.marks.length ? ': они снизу' : below ? ': есть сверху и снизу' : ': они сверху'}`
            : 'Лишние точки: их тут нет';
  return { ok, coverage, precision, shape, marks, hint };
}
