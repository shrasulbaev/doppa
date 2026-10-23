// Пропись: эталоны букв и проверка того, что ученик написал пальцем.
// Координаты в квадрате 100 × 100, буква пишется справа налево. Без React, чтобы легко тестировать.

export type Pt = [number, number];
/** Эталон буквы: линии (каждая — один штрих без отрыва) и точки */
export type Glyph = { strokes: Pt[][]; dots: Pt[] };

export type TraceMode = 'trace' | 'half' | 'free';

/** Эталоны по печатной форме Naskh. Первая точка штриха — откуда начинать писать. */
export const GLYPHS: Record<string, Glyph> = {
  // бә: «лодочка» справа налево, точка снизу
  ب: { strokes: [[[86, 38], [84, 50], [76, 58], [60, 61], [40, 61], [24, 58], [16, 51], [14, 42]]], dots: [[50, 76]] },
  // тә: та же лодочка, две точки сверху
  ت: { strokes: [[[86, 38], [84, 50], [76, 58], [60, 61], [40, 61], [24, 58], [16, 51], [14, 42]]], dots: [[42, 40], [58, 40]] },
  // нун: глубокая чаша, точка над ней
  ن: { strokes: [[[74, 34], [76, 50], [70, 64], [56, 72], [40, 72], [28, 64], [24, 50], [26, 40]]], dots: [[50, 38]] },
};

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

/** Первая половина буквы по длине: её показываем на шаге «Половина» */
export function firstHalf(g: Glyph): Pt[][] {
  const total = g.strokes.reduce((s, l) => s + length(l), 0);
  let left = total / 2;
  const out: Pt[][] = [];
  for (const line of g.strokes) {
    if (left <= 0) break;
    const pts = resample(line, 1);
    const take = Math.min(pts.length, Math.round(left) + 1);
    out.push(pts.slice(0, take));
    left -= length(line);
  }
  return out;
}

const near = (p: Pt, pts: Pt[], r: number) => pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= r);

function bounds(pts: Pt[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Сдвигаем и масштабируем написанное так, чтобы его рамка совпала с рамкой эталона */
function fitTo(ink: Pt[][], target: Pt[]): Pt[][] {
  const all = ink.flat();
  const a = bounds(all);
  const b = bounds(target);
  const k = Math.max(b.x1 - b.x0, b.y1 - b.y0) / Math.max(a.x1 - a.x0, a.y1 - a.y0, 1);
  const cx = (a.x0 + a.x1) / 2;
  const cy = (a.y0 + a.y1) / 2;
  const tx = (b.x0 + b.x1) / 2;
  const ty = (b.y0 + b.y1) / 2;
  return ink.map((line) => line.map(([x, y]): Pt => [tx + (x - cx) * k, ty + (y - cy) * k]));
}

export type TraceResult = { ok: boolean; coverage: number; precision: number; dots: boolean; hint?: string };

/**
 * Проверка: прошёл ли ученик почти всю линию буквы (coverage), не ушёл ли далеко в сторону (precision)
 * и поставил ли точки на свои места. На шагах «Обвести» и «Половина» буква стоит на месте,
 * на шаге «Сам» размер и положение не важны: написанное подгоняется под рамку эталона.
 */
export function checkTrace(g: Glyph, ink: Pt[][], mode: TraceMode): TraceResult {
  const strokes = ink.filter((l) => l.length > 0);
  if (!strokes.length) return { ok: false, coverage: 0, precision: 0, dots: false, hint: 'Напиши букву пальцем' };
  // Короткие штрихи — это точки, длинные — линия буквы
  const isDot = (l: Pt[]) => length(l) < 9;
  const target = g.strokes.flatMap((l) => resample(l));
  const all = mode === 'free' ? fitTo(strokes, [...target, ...g.dots]) : strokes;
  const lines = all.filter((l) => !isDot(l));
  const marks = all.filter(isDot).map((l) => l[0]);
  const linePts = lines.flatMap((l) => resample(l));
  // На «Половине» первую часть уже показали, её считаем написанной
  const given = mode === 'half' ? firstHalf(g).flatMap((l) => resample(l)) : [];
  const tol = mode === 'free' ? 11 : 8;
  const covered = target.filter((p) => near(p, [...linePts, ...given], tol)).length;
  const coverage = target.length ? covered / target.length : 1;
  const precision = linePts.length ? linePts.filter((p) => near(p, target, tol * 1.5)).length / linePts.length : 0;
  // Каждая точка эталона должна быть поставлена, и лишних точек не больше одной
  const dots = g.dots.every((d) => near(d, marks, 12)) && marks.length <= g.dots.length + 1;
  const ok = coverage >= 0.75 && precision >= 0.7 && dots;
  const hint = ok ? undefined
    : coverage < 0.75 ? 'Буква написана не до конца'
      : precision < 0.7 ? 'Линия ушла в сторону от буквы'
        : g.dots.length ? `Не забудь ${g.dots.length === 1 ? 'точку' : 'точки'}: ${g.dots[0][1] > 60 ? 'снизу' : 'сверху'}`
          : 'Лишние точки';
  return { ok, coverage, precision, dots, hint };
}
