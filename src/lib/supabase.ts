import 'expo-sqlite/localStorage/install';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null — проект Supabase ещё не подключён: приложение работает в демо-режиме без сервера. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isDemo = supabase === null;

/** Тестовый вход: письма и SMS не отправляются, подходит код 000000. Выключить: убрать EXPO_PUBLIC_TEST_AUTH из .env. */
export const testAuth = isDemo || process.env.EXPO_PUBLIC_TEST_AUTH === '1';
export const TEST_CODE = '000000';

/** Публичная ссылка на запись слова в хранилище Supabase (бакет audio). */
export function audioUrl(file: string | null): string | null {
  if (!url || !file) return null;
  return `${url}/storage/v1/object/public/audio/${encodeURIComponent(file)}`;
}

// Обновляем токен, только пока приложение на экране
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
