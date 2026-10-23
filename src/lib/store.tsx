// Состояние приложения: контент, прогресс ученика и вход через Supabase.
// Прогресс хранится на устройстве и, если человек вошёл, копируется в Supabase.
import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { bundled, fetchRemoteContent, readCachedContent, wordMap } from './content';
import { starsFor } from './lesson';
import { MAX_HEARTS, XP_FIRST_PASS, XP_REPEAT, XP_STORY, bumpStreak, heartsNow } from './rules';
import { supabase } from './supabase';
import type { AvatarId, Course, Progress, Word } from './types';

const PROGRESS_KEY = 'doppa.progress.v1';

function readProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return null;
  }
}

function writeProgress(p: Progress | null) {
  try {
    if (p) localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROGRESS_KEY);
  } catch {}
}

export function newProgress(name: string, avatar: AvatarId): Progress {
  return {
    name, avatar, xp: 0, streak: 0, lastActiveOn: null,
    hearts: MAX_HEARTS, heartsUpdatedAt: Date.now(), levels: {}, stories: {},
  };
}

async function pushProgress(userId: string, p: Progress) {
  if (!supabase) return;
  await supabase.from('profiles').upsert({
    id: userId, name: p.name, avatar: p.avatar, xp: p.xp, streak: p.streak,
    last_active_on: p.lastActiveOn, updated_at: new Date().toISOString(),
  });
  const levels = Object.entries(p.levels).map(([level_id, v]) => ({
    user_id: userId, level_id, stars: v.stars, completed_at: v.completedAt,
  }));
  if (levels.length) await supabase.from('level_progress').upsert(levels);
  const stories = Object.entries(p.stories).map(([story_id, v]) => ({
    user_id: userId, story_id, completed_at: v.completedAt,
  }));
  if (stories.length) await supabase.from('story_progress').upsert(stories);
}

/** Прогресс из Supabase для вернувшегося ученика, или null, если профиля ещё нет. */
export async function pullProgress(userId: string): Promise<Progress | null> {
  if (!supabase) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!profile) return null;
  const [{ data: lv }, { data: st }] = await Promise.all([
    supabase.from('level_progress').select('*').eq('user_id', userId),
    supabase.from('story_progress').select('*').eq('user_id', userId),
  ]);
  const p = newProgress(profile.name, profile.avatar);
  p.xp = profile.xp;
  p.streak = profile.streak;
  p.lastActiveOn = profile.last_active_on;
  for (const r of lv ?? []) p.levels[r.level_id] = { stars: r.stars, completedAt: r.completed_at };
  for (const r of st ?? []) p.stories[r.story_id] = { completedAt: r.completed_at };
  return p;
}

type Store = {
  ready: boolean;
  content: Course;
  words: Map<number, Word>;
  session: Session | null;
  progress: Progress | null;
  /** Гранаты с учётом восстановления по времени */
  hearts: number;
  toast: string | null;
  showToast: (text: string) => void;
  startProgress: (p: Progress) => void;
  update: (fn: (p: Progress) => Progress) => void;
  loseHeart: () => void;
  completeLevel: (levelId: string, mistakes: number) => { stars: number; gain: number };
  completeStory: (storyId: string) => boolean;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Без Supabase ждать нечего: сессии нет
  const [ready, setReady] = useState(!supabase);
  const [content, setContent] = useState<Course>(() => readCachedContent() ?? bundled);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<Progress | null>(readProgress);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    fetchRemoteContent().then((c) => c && setContent(c)).catch(() => {});
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      sessionRef.current = data.session;
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      sessionRef.current = s;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Раз в минуту пересчитываем гранаты
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const save = useCallback((p: Progress | null) => {
    setProgress(p);
    writeProgress(p);
    const s = sessionRef.current;
    if (p && s) pushProgress(s.user.id, p).catch(() => {});
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      const cur = readProgress() ?? progress;
      if (cur) save(fn(cur));
    },
    [progress, save],
  );

  const value = useMemo<Store>(() => {
    const hearts = progress ? heartsNow(progress, now).hearts : MAX_HEARTS;
    return {
      ready, content, words: wordMap(content), session, progress, hearts, toast, showToast, update,
      startProgress: (p) => save(p),
      loseHeart: () =>
        update((p) => {
          const cur = heartsNow(p, Date.now());
          return { ...p, hearts: Math.max(0, cur.hearts - 1), heartsUpdatedAt: cur.hearts >= MAX_HEARTS ? Date.now() : cur.heartsUpdatedAt };
        }),
      completeLevel: (levelId, mistakes) => {
        const stars = starsFor(mistakes);
        const first = !progress?.levels[levelId];
        const gain = first ? XP_FIRST_PASS : XP_REPEAT;
        update((p) => ({
          ...p,
          ...bumpStreak(p, new Date()),
          xp: p.xp + gain,
          levels: {
            ...p.levels,
            [levelId]: { stars: Math.max(stars, p.levels[levelId]?.stars ?? 0), completedAt: new Date().toISOString() },
          },
        }));
        return { stars, gain };
      },
      completeStory: (storyId) => {
        if (!progress || progress.stories[storyId]) return false;
        update((p) => ({
          ...p,
          ...bumpStreak(p, new Date()),
          xp: p.xp + XP_STORY,
          stories: { ...p.stories, [storyId]: { completedAt: new Date().toISOString() } },
        }));
        return true;
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        save(null);
      },
    };
  }, [ready, content, session, progress, toast, now, showToast, update, save]);

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore(): Store {
  const s = use(StoreContext);
  if (!s) throw new Error('useStore вне StoreProvider');
  return s;
}
