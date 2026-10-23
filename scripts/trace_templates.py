"""Эталоны прописи из шрифта приложения.

Каждую букву, слово и связку рисуем шрифтом Noto Naskh Arabic и вытаскиваем из картинки:
  outline — контур (серая буква-подсказка, которую обводят),
  line    — средняя линия штрихов (по ней проверяется написанное),
  marks   — точки и мелкие значки (центр и размер),
  start/dir — откуда начинать писать и куда вести.
Координаты: высота поля 100, ширина своя у каждого элемента. Результат: content/trace.json.

Список берётся из content/trace-items.json (его пишет scripts/trace-items.mts).
Запуск: python3 scripts/trace_templates.py   (нужны pillow с raqm и scikit-image)
"""
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, features
from skimage.measure import approximate_polygon, find_contours, label, regionprops
from skimage.morphology import skeletonize

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'node_modules/@expo-google-fonts/noto-naskh-arabic/400Regular/NotoNaskhArabic_400Regular.ttf'
SIZE = 240  # кегль рендера, px
PAD = 8  # поля вокруг текста, в единицах поля
MIN_W = 80

assert features.check('raqm'), 'нужна pillow с libraqm для арабской вязи'
font = ImageFont.truetype(str(FONT), SIZE, layout_engine=ImageFont.Layout.RAQM)


def render(text):
    box = font.getbbox(text, direction='rtl', language='ug')
    w, h = box[2] - box[0] + 40, SIZE * 2
    img = Image.new('L', (w, h), 0)
    ImageDraw.Draw(img).text((20 - box[0], SIZE // 2), text, font=font, fill=255, direction='rtl', language='ug')
    return np.array(img) > 127


def neighbours(p, pix):
    y, x = p
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            q = (y + dy, x + dx)
            if q != p and q in pix:
                yield q


def prune(pix, spur):
    """Срезаем короткие усики скелета, которые появляются на концах толстых штрихов"""
    pix = set(pix)
    for _ in range(3):
        ends = [p for p in pix if sum(1 for _ in neighbours(p, pix)) == 1]
        for e in ends:
            path, cur, prev = [e], e, None
            while len(path) <= spur:
                nxt = [q for q in neighbours(cur, pix) if q != prev and q not in path]
                if len(nxt) != 1 or sum(1 for _ in neighbours(nxt[0], pix)) > 2:
                    break
                prev, cur = cur, nxt[0]
                path.append(cur)
            if len(path) <= spur and len(pix) > len(path) * 3:
                pix -= set(path[:-1])
    return pix


def walk(start, pix, steps):
    """Точка в steps пикселях от start вдоль скелета — направление первого штриха"""
    seen, q, last = {start}, deque([(start, 0)]), start
    while q:
        p, d = q.popleft()
        last = p
        if d >= steps:
            return p
        for n in neighbours(p, pix):
            if n not in seen:
                seen.add(n)
                q.append((n, d + 1))
    return last


def analyse(text):
    ink = render(text)
    lab = label(ink, connectivity=2)
    regions = regionprops(lab)
    big = max(r.area for r in regions)
    return ink, lab, regions, big


def build(items):
    data = {t: analyse(t) for t in items}
    # Общая высота для всех: так буквы одного размера и строка на одном месте
    rows = np.concatenate([np.where(d[0].any(axis=1))[0] for d in data.values()])
    top, bottom = rows.min(), rows.max()
    k = (100 - 2 * PAD) / (bottom - top)
    base_px = SIZE // 2 + font.getmetrics()[0]
    out = {}
    for text, (ink, lab, regions, big) in data.items():
        cols = np.where(ink.any(axis=0))[0]
        width = max(MIN_W, (cols.max() - cols.min()) * k + 2 * PAD)
        x_off = (width - (cols.max() - cols.min()) * k) / 2

        def pt(y, x):
            return [round(float((x - cols.min()) * k + x_off), 1), round(float((y - top) * k + PAD), 1)]

        line, marks, starts = [], [], []
        for r in regions:
            minr, minc, maxr, maxc = r.bbox
            span = max(maxr - minr, maxc - minc) * k
            if r.area < big * 0.3 and span < 22:
                cy, cx = r.centroid
                marks.append({'at': pt(cy, cx), 'r': round(float(span / 2), 1)})
                continue
            sk = skeletonize(lab == r.label)
            pix = prune({(int(y), int(x)) for y, x in zip(*np.where(sk))}, spur=int(9 / k))
            # Точки линии примерно через 2 единицы
            grid = {}
            for y, x in pix:
                grid.setdefault((round(x * k / 2), round(y * k / 2)), (y, x))
            line += [pt(y, x) for y, x in grid.values()]
            # Пишем справа налево и сверху: начинаем с правого верхнего конца штриха.
            # Если справа концов нет (петля у و, ف, ھ), начинаем с правого верха петли, без стрелки:
            # в какую сторону вести петлю, по скелету не понять.
            right = minc + (maxc - minc) * 0.6
            ends = [p for p in pix if p[1] >= right and sum(1 for _ in neighbours(p, pix)) == 1]
            score = lambda p: p[1] - 0.5 * p[0]
            if ends:
                s = max(ends, key=score)
                starts.append((s, walk(s, pix, int(10 / k))))
            else:
                s = max(pix, key=score)
                starts.append((s, s))
        # Главный штрих — самый правый, с него начинается слово
        (s, d) = max(starts, key=lambda sd: sd[0][1])
        outline = []
        for c in find_contours(np.pad(ink, 1).astype(float), 0.5):
            poly = approximate_polygon(c - 1, tolerance=0.35 / k)
            outline.append('M' + 'L'.join(f'{a[0]} {a[1]}' for a in (pt(y, x) for y, x in poly)) + 'Z')
        line.sort(key=lambda p: (-p[0], p[1]))
        out[text] = {
            'w': round(float(width), 1), 'outline': ''.join(outline), 'line': line, 'marks': marks,
            'start': pt(*s), 'dir': pt(*d), 'base': round(float((base_px - top) * k + PAD), 1),
        }
    return out


def main():
    items = json.loads((ROOT / 'content/trace-items.json').read_text())
    out = build(items)
    (ROOT / 'content/trace.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    for t, g in out.items():
        print(f"{t}\tw={g['w']}\tline={len(g['line'])}\tmarks={len(g['marks'])}")


if __name__ == '__main__':
    main()
