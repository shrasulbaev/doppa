// Эталоны прописи из шрифта (собирает scripts/trace_templates.py), по арабской записи
import data from '../../content/trace.json';
import type { Glyph } from './trace';

export const GLYPHS = data as unknown as Record<string, Glyph>;
