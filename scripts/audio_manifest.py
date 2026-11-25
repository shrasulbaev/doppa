"""Список всего, что нужно озвучить, со стабильными именами файлов.

Собирает слова словаря, фразы уроков, примеры правил, пословицы, буквы, реплики учителя
и тексты историй. Пишет:
  content/audio.json            — уйгурский текст → имя файла (встроен в приложение)
  content/audio-script.xlsx     — таблица для диктора (или путь из аргумента)

Имена уже выданных записей не меняются: скрипт читает прежний content/audio.json
и выдаёт новые номера только новым фразам.

Запуск: python3 scripts/audio_manifest.py [путь/к/таблице.xlsx]
"""
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
MANIFEST = CONTENT / "audio.json"


def norm(text: str) -> str:
    """Ключ для поиска записи: без регистра, знаков препинания и лишних пробелов."""
    t = text.lower().replace("ё", "е")
    t = re.sub(r"[.,!?;:«»\"()—–-]", " ", t)
    return " ".join(t.split())


def load_prev() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"phrases": {}, "proverbs": {}, "letters": {}, "teacher": {}}


def main() -> None:
    out_xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else CONTENT / "audio-script.xlsx"
    words = json.loads((CONTENT / "dictionary.json").read_text(encoding="utf-8"))
    course = json.loads((CONTENT / "course.json").read_text(encoding="utf-8"))
    proverbs = json.loads((CONTENT / "proverbs.json").read_text(encoding="utf-8"))
    writing_ts = (ROOT / "src/lib/writing.ts").read_text(encoding="utf-8")
    prev = load_prev()

    word_by_key = {}
    for w in words:
        word_by_key.setdefault(norm(w["ug"]), w)

    sections = {s["id"]: s for s in course["sections"]}

    def where_level(level: dict) -> str:
        sec = sections.get(level["sectionId"], {})
        return f'{sec.get("city", level["sectionId"])}, уровень {level["position"]} «{level["title"]}»'

    # ---------- Слова словаря ----------
    word_uses: dict[int, list[str]] = {}
    for level in course["levels"]:
        for wid in level["wordIds"]:
            word_uses.setdefault(wid, []).append(where_level(level))
    for st in course["stories"]:
        word_uses.setdefault(st["wordId"], []).append(f'история «{st["title"]}»')
    for l in course["letters"]:
        if l["exampleWordId"]:
            word_uses.setdefault(l["exampleWordId"], []).append(f'алфавит, буква {l["upper"]}')

    # ---------- Фразы: грамматика, примеры правил, пропись ----------
    phrase_rows: dict[str, dict] = {}  # norm -> row
    order: list[str] = []

    def add_phrase(ug: str, ru: str, where: str) -> None:
        ug = ug.strip()
        key = norm(ug)
        if not key:
            return
        if key in word_by_key:  # уже есть в словаре — запись слова подойдёт
            word_uses.setdefault(word_by_key[key]["id"], []).append(where)
            return
        if key not in phrase_rows:
            phrase_rows[key] = {"ug": ug, "ru": ru, "where": []}
            order.append(key)
        if where not in phrase_rows[key]["where"]:
            phrase_rows[key]["where"].append(where)

    for level in course["levels"]:
        if level.get("kind") != "phrases":
            continue
        rule = level.get("rule") or {}
        for ex in rule.get("examples", []):
            # «ата → атам»: озвучиваем обе части по отдельности
            parts = [p.strip() for p in ex["ug"].split("→")]
            for p in parts:
                ru = ex["ru"].split("→")[-1].strip()
                add_phrase(p, ru if p == parts[-1] else "", where_level(level) + ", пример правила")
        for item in level.get("items") or []:
            add_phrase(item["ug"], item["ru"], where_level(level))

    for m in re.finditer(r"id: '(w-trace-phrases-\d)'.*?phrases: \[(.*?)\],\n", writing_ts, re.S):
        for cyr, ru in re.findall(r"\['([^']+)', '([^']+)'\]", m.group(2)):
            add_phrase(cyr, ru, f"письменность, пропись {m.group(1)}")

    used_ids = {v for v in prev["phrases"].values()}
    next_n = max([int(v[3:7]) for v in used_ids] + [0]) + 1
    phrase_file: dict[str, str] = {}
    for key in order:
        if key in prev["phrases"]:
            phrase_file[key] = prev["phrases"][key]
        else:
            phrase_file[key] = f"ph_{next_n:04d}.mp3"
            next_n += 1

    # ---------- Пословицы ----------
    proverb_file = {str(p["id"]): f'prv_{p["id"]:04d}.mp3' for p in proverbs}

    # ---------- Буквы ----------
    letter_rows = []
    for i, l in enumerate(course["letters"], 1):
        lower = l["upper"].lower()
        letter_rows.append({"file": f"let_{i:02d}.mp3", "cyr": l["upper"] + lower, "arabic": l["arabic"],
                            "note": "уйгурская буква" if l["uyghur"] else "как в русском"})

    # ---------- Учитель ----------
    lesson_ts = (ROOT / "src/app/lesson/[levelId].tsx").read_text(encoding="utf-8")
    praise = re.search(r"const PRAISE = \[(.*?)\];", lesson_ts).group(1)
    praise = re.findall(r"'([^']+)'", praise)
    teacher = [("tch_hello", "Салам!", "uy", "приветствие на карте")]
    for i, p in enumerate(praise, 1):
        teacher.append((f"tch_praise_{i}", p, "uy" if p.startswith("Барикалла") else "ru", "похвала за верный ответ"))
    teacher += [
        ("tch_perfect", "Ни одной ошибки, барикалла!", "ru", "конец урока без ошибок"),
        ("tch_wrong", "Почти! Давай ещё раз.", "ru", "неверный ответ (новая реплика)"),
        ("tch_level_done", "Уровень пройден!", "ru", "конец урока (новая реплика)"),
    ]

    manifest = {
        "_about": "Создано scripts/audio_manifest.py. Ключ — уйгурский текст без регистра и знаков. Файлы лежат в бакете audio.",
        "phrases": {k: phrase_file[k] for k in order},
        "proverbs": proverb_file,
        "letters": {r["cyr"]: r["file"] for r in letter_rows},
        "teacher": {k: f"{k}.mp3" for k, *_ in teacher},
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # ---------- Таблица ----------
    wb = Workbook()
    head_font = Font(bold=True, color="FFFFFF")
    head_fill = PatternFill("solid", fgColor="4FA0DC")

    def sheet(title: str, headers: list[str], rows: list[list], widths: list[int]):
        ws = wb.create_sheet(title)
        ws.append(headers)
        for c in ws[1]:
            c.font, c.fill = head_font, head_fill
        for r in rows:
            ws.append(r)
        for i, wdt in enumerate(widths):
            ws.column_dimensions[chr(65 + i)].width = wdt
        for row in ws.iter_rows(min_row=2):
            for c in row:
                c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        return ws

    total = len(words) + len(order) + len(proverbs) + len(letter_rows) + len(teacher)
    readme = wb.active
    readme.title = "Как записывать"
    story_count = sum(len(s["paragraphs"]) for s in course["stories"])
    lines = [
        ["Doppa — сценарий озвучки"],
        [""],
        ["Что записать", "Сколько", "Лист"],
        ["Слова словаря", len(words), "1. Слова"],
        ["Фразы и предложения из уроков", len(order), "2. Фразы"],
        ["Пословицы", len(proverbs), "3. Пословицы"],
        ["Буквы алфавита", len(letter_rows), "4. Буквы"],
        ["Реплики учителя", len(teacher), "5. Учитель"],
        ["Итого на уйгурском (обязательно)", total - len([t for t in teacher if t[2] == "ru"]), ""],
        ["Тексты историй на русском (по желанию)", story_count, "6. Истории"],
        [""],
        ["Правила записи"],
        ["• Один файл — одна строка таблицы. Имя файла строго из колонки «Файл»."],
        ["• Формат: mp3, моно, 44,1 кГц, 128 кбит/с. Тишина в начале и в конце — не больше 0,3 с."],
        ["• Читать спокойно и чётко, как учитель для ребёнка. Слово — один раз, без «эээ» и повторов."],
        ["• Вопросительные фразы (со знаком ?) — с вопросительной интонацией."],
        ["• Если в слове ошибка или так не говорят — не записывайте, отметьте в колонке «Замечания»."],
        ["• Колонка «Записано» — ставьте отметку, чтобы не потерять место."],
        ["• Если голосов два (Алим и Райхан), реплики учителя запишите обоими: tch_hello_alim.mp3, tch_hello_raihan.mp3."],
        [""],
        ["Куда загружать: Supabase → Storage → бакет audio. Слова начнут звучать в приложении сразу, без новой сборки."],
    ]
    for ln in lines:
        readme.append(ln)
    readme["A1"].font = Font(bold=True, size=14)
    readme["A3"].font = readme["B3"].font = readme["C3"].font = Font(bold=True)
    readme["A12"].font = Font(bold=True)
    readme.column_dimensions["A"].width = 95
    readme.column_dimensions["B"].width = 10
    readme.column_dimensions["C"].width = 14

    sheet("1. Слова", ["Файл", "Уйгурский (кириллица)", "Арабская запись", "Перевод", "Тема", "Где звучит", "Записано", "Замечания"],
          [[w["audio"], w["ug"], w["arabic"], w["ruShort"], w["topic"], "; ".join(dict.fromkeys(word_uses.get(w["id"], ["разговорник"]))), "", ""]
           for w in words], [13, 24, 20, 26, 22, 50, 10, 24])
    sheet("2. Фразы", ["Файл", "Уйгурский (кириллица)", "Перевод", "Где звучит", "Записано", "Замечания"],
          [[phrase_file[k], phrase_rows[k]["ug"], phrase_rows[k]["ru"], "; ".join(phrase_rows[k]["where"]), "", ""] for k in order],
          [13, 32, 30, 60, 10, 24])
    sheet("3. Пословицы", ["Файл", "Пословица", "Перевод", "Записано", "Замечания"],
          [[proverb_file[str(p["id"])], p["ug"], p["ru"], "", ""] for p in proverbs], [14, 45, 45, 10, 24])
    sheet("4. Буквы", ["Файл", "Буква", "Арабская", "Как читать", "Записано", "Замечания"],
          [[r["file"], r["cyr"], r["arabic"], "звук буквы, один раз (" + r["note"] + ")", "", ""] for r in letter_rows],
          [12, 8, 10, 46, 10, 24])
    sheet("5. Учитель", ["Файл", "Текст", "Язык", "Когда звучит", "Записано", "Замечания"],
          [[f"{k}.mp3", t, "уйгурский" if lang == "uy" else "русский", note, "", ""] for k, t, lang, note in teacher],
          [20, 34, 12, 40, 10, 24])
    story_rows = []
    for st in course["stories"]:
        story_rows.append([f'st_{st["id"]}_title.mp3', st["title"], st["title"], "", ""])
        for i, p in enumerate(st["paragraphs"], 1):
            story_rows.append([f'st_{st["id"]}_{i:02d}.mp3', st["title"], p, "", ""])
    sheet("6. Истории", ["Файл", "История", "Текст (русский)", "Записано", "Замечания"], story_rows, [24, 26, 90, 10, 24])

    out_xlsx.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out_xlsx)
    print(f"Слова {len(words)}, фразы {len(order)}, пословицы {len(proverbs)}, буквы {len(letter_rows)}, "
          f"учитель {len(teacher)}, абзацы историй {story_count} → {out_xlsx}")


if __name__ == "__main__":
    main()
