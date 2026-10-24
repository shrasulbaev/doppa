// Ежедневные уведомления: утром пословица дня, вечером напоминание об уроке.
// Ставятся на телефоне на несколько дней вперёд при каждом открытии приложения, поэтому сервер не нужен.
// Кто перестал заходить, тому после ACTIVE_DAYS дней уведомления сами перестают приходить.
import { dailyIndex, dayKey } from './rules.ts';

export const ACTIVE_DAYS = 7;
export const PROVERB_HOUR = 9;
export const REMINDER_HOUR = 19;

export type Proverb = { ug: string; ru: string };
export type Planned = { kind: 'proverb' | 'reminder'; at: Date; title: string; body: string };

export function planReminders({ now, proverbs, lastActiveOn, streak, teacher }: {
  now: Date;
  proverbs: Proverb[];
  /** День последнего урока (YYYY-MM-DD): если урок сегодня уже был, вечером не напоминаем */
  lastActiveOn: string | null;
  /** Текущая серия дней (currentStreak) */
  streak: number;
  teacher: string;
}): Planned[] {
  const out: Planned[] = [];
  for (let d = 0; d < ACTIVE_DAYS; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const morning = new Date(day.getFullYear(), day.getMonth(), day.getDate(), PROVERB_HOUR);
    const evening = new Date(day.getFullYear(), day.getMonth(), day.getDate(), REMINDER_HOUR);
    const p = proverbs[dailyIndex(day, proverbs.length)];
    if (p && morning > now) out.push({ kind: 'proverb', at: morning, title: 'Пословица дня', body: `${p.ug}\n${p.ru}` });
    const playedToday = d === 0 && lastActiveOn === dayKey(now);
    if (evening > now && !playedToday) {
      // Про серию говорим только сегодня: что будет с ней завтра, заранее неизвестно
      const days = d === 0 ? streak : 0;
      out.push({
        kind: 'reminder', at: evening, title: `${teacher} ждёт тебя на уроке`,
        body: days > 0 ? `Серия ${days} дн. Пройди урок сегодня, чтобы её не потерять 🔥` : 'Пять минут уйгурского, и день не прошёл зря.',
      });
    }
  }
  return out;
}
