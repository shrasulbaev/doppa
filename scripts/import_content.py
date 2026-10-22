"""Собирает контент приложения из словаря (xlsx) и курса (course.json).

Пишет:
  content/dictionary.json — слова для приложения (встраиваются в сборку как запасной вариант)
  supabase/seed.sql       — те же данные для базы Supabase

Запуск: python3 scripts/import_content.py
Нужен пакет openpyxl (pip install openpyxl).
"""
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "content" / "source" / "uyghur_russian_dictionary_v1.xlsx"
COURSE = ROOT / "content" / "course.json"


def short_ru(ru: str) -> str:
    """Короткий перевод для заданий: без пояснений в скобках, до первой ; или ,"""
    s = re.sub(r"\s*\(.*?\)", "", ru)
    s = re.split(r"[;,]", s)[0]
    return s.strip() or ru.strip()


def read_words():
    ws = openpyxl.load_workbook(XLSX, read_only=True)["Словарь"]
    words = []
    for row in list(ws.iter_rows(values_only=True))[1:]:
        if not row or row[0] is None:
            continue
        num, topic, cyr, arab, latin, ru, pos, status, _checker, _comment, audio = row[:11]
        words.append({
            "id": int(num),
            "topic": topic,
            "ug": cyr,
            "arabic": arab,
            "latin": latin,
            "ru": ru,
            "ruShort": short_ru(ru),
            "pos": pos,
            "status": status,
            "audio": audio,
        })
    return words


def q(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(values):
    return "array[" + ",".join(q(v) for v in values) + "]::" + ("int[]" if values and isinstance(values[0], int) else "text[]")


def main():
    words = read_words()
    course = json.loads(COURSE.read_text(encoding="utf-8"))
    ids = {w["id"] for w in words}
    for lvl in course["levels"]:
        missing = [i for i in lvl["wordIds"] if i not in ids]
        assert not missing, f"{lvl['id']}: нет слов {missing}"

    (ROOT / "content" / "dictionary.json").write_text(
        json.dumps(words, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    out = ["-- Сгенерировано scripts/import_content.py — не редактируйте вручную.", "begin;",
           "truncate words, sections, levels, letters, stories cascade;"]
    for w in words:
        out.append("insert into words (id, topic, ug, arabic, latin, ru, ru_short, pos, review_status, audio_file) values ("
                   + ", ".join(q(w[k]) for k in ["id", "topic", "ug", "arabic", "latin", "ru", "ruShort", "pos", "status", "audio"]) + ");")
    for s in course["sections"]:
        out.append(f"insert into sections (id, position, title, city) values ({q(s['id'])}, {s['position']}, {q(s['title'])}, {q(s['city'])});")
    for l in course["levels"]:
        out.append(f"insert into levels (id, section_id, position, title, word_ids) values ({q(l['id'])}, {q(l['sectionId'])}, {l['position']}, {q(l['title'])}, {arr(l['wordIds'])});")
    for i, l in enumerate(course["letters"], 1):
        out.append(f"insert into letters (position, upper, arabic, example_word_id, is_uyghur) values ({i}, {q(l['upper'])}, {q(l['arabic'])}, {q(l['exampleWordId'])}, {q(l['uyghur'])});")
    for s in course["stories"]:
        out.append("insert into stories (id, position, title, audience, minutes, art, word_id, paragraphs, quiz) values ("
                   f"{q(s['id'])}, {s['position']}, {q(s['title'])}, {q(s['audience'])}, {s['minutes']}, {q(s['art'])}, {s['wordId']}, "
                   f"{arr(s['paragraphs'])}, {q(json.dumps(s['quiz'], ensure_ascii=False))}::jsonb);")
    out.append("commit;")
    (ROOT / "supabase" / "seed.sql").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Слов: {len(words)}, уровней: {len(course['levels'])}, историй: {len(course['stories'])}")


if __name__ == "__main__":
    main()
