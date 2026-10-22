// Озвучка слов. Записи носителей лежат в Supabase Storage (бакет audio, файлы ug_0001.mp3 …).
// Пока записи не загружены, аватар «проговаривает» слово анимацией, а приложение подсказывает, что голос появится позже.
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useStore } from './store';
import { audioUrl } from './supabase';
import type { Word } from './types';

const FALLBACK_TALK_MS = 1400;
let hintShown = false;

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export function useSpeech() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const { showToast } = useStore();
  const [fallbackTalking, setFallbackTalking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);

  const fakeTalk = useCallback(() => {
    setFallbackTalking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFallbackTalking(false), FALLBACK_TALK_MS);
  }, []);

  const noRecording = useCallback(() => {
    fakeTalk();
    if (!hintShown) {
      hintShown = true;
      showToast('Здесь будет голос носителя. Записи добавим, когда их сделают.');
    }
  }, [fakeTalk, showToast]);

  // Файла нет в хранилище или сеть недоступна
  useEffect(() => {
    if (status.error && pending.current) {
      pending.current = false;
      noRecording();
    }
  }, [status.error, noRecording]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const speak = useCallback(
    (word: Word | undefined) => {
      const uri = audioUrl(word?.audio ?? null);
      if (!uri) {
        noRecording();
        return;
      }
      pending.current = true;
      player.replace({ uri });
      player.seekTo(0).catch(() => {});
      player.play();
    },
    [player, noRecording],
  );

  return { speak, talking: status.playing || fallbackTalking };
}
