// Имена файлов записей для фраз, пословиц, букв и реплик учителя (content/audio.json,
// создаётся scripts/audio_manifest.py). У слов словаря имя файла лежит в самом слове.
import manifest from '../../content/audio.json' with { type: 'json' };

/** Тот же ключ, что в scripts/audio_manifest.py: без регистра, знаков препинания и лишних пробелов */
export function audioKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:«»"()—–-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

const phrases = manifest.phrases as Record<string, string>;

/** Файл записи фразы по её кириллической записи или null, если такой фразы нет в списке */
export function phraseAudio(text: string): string | null {
  return phrases[audioKey(text)] ?? null;
}
