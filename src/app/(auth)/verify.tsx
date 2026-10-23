// Подтверждение кода. Вернувшийся ученик сразу попадает на карту, новый — к выбору учителя.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ProgressBar, T, TopBar, ui } from '@/components/ui';
import { pullProgress, useStore } from '@/lib/store';
import { TEST_CODE, supabase, testAuth } from '@/lib/supabase';
import { fonts } from '@/lib/theme';

const CODE_LENGTH = 6;

export default function Verify() {
  const insets = useSafeAreaInsets();
  const { mode, to } = useLocalSearchParams<{ mode: 'phone' | 'email'; to: string }>();
  const { startProgress } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError('');
    if (code.length !== CODE_LENGTH) return setError(`Введите все ${CODE_LENGTH} цифр`);
    if (testAuth || !supabase) {
      if (code !== TEST_CODE) return setError(`В тестовом режиме код: ${TEST_CODE}`);
      return router.push('/avatar');
    }
    setBusy(true);
    const { data, error: e } = await supabase.auth.verifyOtp(
      mode === 'phone' ? { phone: to, token: code, type: 'sms' } : { email: to, token: code, type: 'email' },
    );
    if (e || !data.user) {
      setBusy(false);
      return setError('Код не подошёл. Проверьте цифры или запросите новый.');
    }
    const existing = await pullProgress(data.user.id).catch(() => null);
    setBusy(false);
    if (existing) startProgress(existing);
    else router.push('/avatar');
  }

  async function resend() {
    if (!supabase || testAuth) return;
    const { error: e } = await supabase.auth.signInWithOtp(mode === 'phone' ? { phone: to } : { email: to });
    setError(e ? `Не получилось отправить код: ${e.message}` : 'Отправили новый код');
  }

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <TopBar onPress={() => router.back()}><ProgressBar value={2 / 3} /></TopBar>
      </View>
      <ScrollView contentContainerStyle={[ui.pad, { flexGrow: 1, gap: 20, paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <T variant="h1">Введите код</T>
          <T variant="muted">{mode === 'phone' ? `Мы отправили SMS на ${to}` : `Мы отправили письмо на ${to}`}</T>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={ui.label}>Код из {CODE_LENGTH} цифр</Text>
          <TextInput
            accessibilityLabel="Код подтверждения"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={CODE_LENGTH}
            placeholder="••••••"
            autoFocus
            onSubmitEditing={confirm}
            style={[ui.field, { height: 64, fontSize: 30, fontFamily: fonts.black, letterSpacing: 12, textAlign: 'center' }]}
          />
        </View>
        {testAuth ? (
          <T variant="muted" style={{ fontSize: 14 }}>Тестовый режим: введите {TEST_CODE}.</T>
        ) : (
          <Text onPress={resend} accessibilityRole="button" style={[ui.label, { color: '#1872B8' }]}>Отправить код ещё раз</Text>
        )}
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <View style={{ flex: 1 }} />
        <Button title={busy ? 'Проверяем…' : 'Подтвердить'} onPress={confirm} disabled={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
