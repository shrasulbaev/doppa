// Список того, что пишется в прописи (из уровней курса письма), для scripts/trace_templates.py.
// Запуск: node --experimental-strip-types scripts/trace-items.mts && python3 scripts/trace_templates.py
import { writeFileSync } from 'node:fs';

import course from '../content/course.json' with { type: 'json' };
import dictionary from '../content/dictionary.json' with { type: 'json' };
import type { Course, Level, Story, Word } from '../src/lib/types.ts';
import { WRITING_LEVELS, writingItems } from '../src/lib/writing.ts';

const full: Course = {
  words: dictionary as Word[], sections: course.sections, levels: course.levels as Level[],
  letters: course.letters, stories: course.stories as Story[],
};
const items = WRITING_LEVELS.filter((l) => l.kind === 'trace').flatMap((l) => writingItems(l, full).items.map((w) => w.ug));
writeFileSync(new URL('../content/trace-items.json', import.meta.url), JSON.stringify([...new Set(items)], null, 1) + '\n');
console.log(`${items.length} элементов прописи`);
