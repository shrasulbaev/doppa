// Контент курса. Встроен в сборку, чтобы приложение работало без сети;
// если подключён Supabase, свежая версия подтягивается из базы.
import course from '../../content/course.json';
import dictionary from '../../content/dictionary.json';
import { supabase } from './supabase';
import type { Course, Level, Story, Word } from './types';

const CACHE_KEY = 'doppa.content.v1';
const LEVEL_KINDS = ['words', 'phrases'];

export const bundled: Course = {
  words: dictionary as Word[],
  sections: course.sections,
  levels: course.levels as Level[],
  letters: course.letters,
  stories: course.stories as Story[],
};

export function readCachedContent(): Course | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Course) : null;
  } catch {
    return null;
  }
}

/** Загружает контент из Supabase. Возвращает null, если сервер не подключён или недоступен. */
export async function fetchRemoteContent(): Promise<Course | null> {
  if (!supabase) return null;
  const [w, s, l, a, st] = await Promise.all([
    supabase.from('words').select('*').order('id'),
    supabase.from('sections').select('*').order('position'),
    supabase.from('levels').select('*').order('position'),
    supabase.from('letters').select('*').order('position'),
    supabase.from('stories').select('*').order('position'),
  ]);
  if (w.error || s.error || l.error || a.error || st.error || !w.data?.length) return null;
  const next: Course = {
    words: w.data.map((r) => ({
      id: r.id, topic: r.topic, ug: r.ug, arabic: r.arabic, latin: r.latin, ru: r.ru,
      ruShort: r.ru_short, pos: r.pos, status: r.review_status, audio: r.audio_file,
    })),
    sections: s.data.map((r) => ({ id: r.id, position: r.position, title: r.title, city: r.city })),
    // Уровни новых видов, которых эта версия приложения не умеет показывать, пропускаем
    levels: l.data.filter((r) => LEVEL_KINDS.includes(r.kind ?? 'words')).map((r) => ({
      id: r.id, sectionId: r.section_id, position: r.position, title: r.title, wordIds: r.word_ids,
      kind: r.kind ?? 'words', rule: r.rule, items: r.items,
    })),
    letters: a.data.map((r) => ({
      upper: r.upper, arabic: r.arabic, exampleWordId: r.example_word_id, uyghur: r.is_uyghur,
    })),
    stories: st.data.map((r) => ({
      id: r.id, position: r.position, title: r.title, audience: r.audience, minutes: r.minutes,
      art: r.art, wordId: r.word_id, paragraphs: r.paragraphs, quiz: r.quiz,
    })),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function wordMap(c: Course): Map<number, Word> {
  return new Map(c.words.map((w) => [w.id, w]));
}

export function levelWords(level: Level, words: Map<number, Word>): Word[] {
  return level.wordIds.map((id) => words.get(id)).filter((w): w is Word => !!w);
}
