// Вход по номеру телефона или почте: отправляем одноразовый код
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Bubble, Button, ProgressBar, T, TopBar, ui } from '@/components/ui';
import { supabase, testAuth } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

type Mode = 'phone' | 'email';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('phone');
  const [code, setCode] = useState('+7');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    setError('');
    let to: string;
    if (mode === 'phone') {
      const digits = (code + phone).replace(/[^\d]/g, '');
      if (digits.length < 10) return setError('Проверьте номер: не хватает цифр');
      to = `+${digits}`;
    } else {
      to = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return setError('Проверьте адрес почты');
    }
    if (supabase && !testAuth) {
      setBusy(true);
      const { error: e } = await supabase.auth.signInWithOtp(mode === 'phone' ? { phone: to } : { email: to });
      setBusy(false);
      if (e) return setError(`Не получилось отправить код: ${e.message}`);
    }
    router.push({ pathname: '/verify', params: { mode, to } });
  }

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <TopBar onPress={() => router.back()}><ProgressBar value={1 / 3} /></TopBar>
      </View>
      <ScrollView contentContainerStyle={[ui.pad, { flexGrow: 1, gap: 20, paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={[ui.row, { alignItems: 'flex-end', gap: 12 }]}>
          <Avatar who="raihan" width={76} height={96} style={{ borderRadius: 18 }} />
          <Bubble style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.bold }}>Давай познакомимся! Как с тобой связаться?</T>
          </Bubble>
        </View>

        <View style={s.seg} accessibilityRole="tablist">
          {(['phone', 'email'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              onPress={() => { setMode(m); setError(''); }}
              style={[s.segBtn, mode === m && s.segOn]}>
              <Text style={[s.segText, mode === m && { color: colors.blueDark }]}>{m === 'phone' ? 'Телефон' : 'Почта'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'phone' ? (
          <View style={{ gap: 8 }}>
            <Text style={ui.label}>Номер телефона</Text>
            <View style={[ui.row, { gap: 8 }]}>
              <TextInput
                accessibilityLabel="Код страны"
                value={code}
                onChangeText={(v) => setCode('+' + v.replace(/[^\d]/g, '').slice(0, 3))}
                keyboardType="phone-pad"
                style={[ui.field, { width: 76, textAlign: 'center', backgroundColor: colors.bg }]}
              />
              <TextInput
                accessibilityLabel="Номер телефона"
                value={phone}
                onChangeText={setPhone}
                placeholder="700 000 00 00"
                placeholderTextColor="#9AA8B6"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                autoFocus
                onSubmitEditing={send}
                style={[ui.field, { flex: 1 }]}
              />
            </View>
            <T variant="muted" style={{ fontSize: 13 }}>Пришлём SMS с кодом из 6 цифр</T>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={ui.label}>Электронная почта</Text>
            <TextInput
              accessibilityLabel="Электронная почта"
              value={email}
              onChangeText={setEmail}
              placeholder="name@mail.ru"
              placeholderTextColor="#9AA8B6"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              onSubmitEditing={send}
              style={ui.field}
            />
            <T variant="muted" style={{ fontSize: 13 }}>Пришлём письмо с кодом из 6 цифр</T>
          </View>
        )}

        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <View style={{ flex: 1 }} />
        <View style={{ gap: 12 }}>
          <Button title={busy ? 'Отправляем…' : 'Получить код'} onPress={send} disabled={busy} />
          {testAuth && (
            <T variant="muted" style={{ fontSize: 12, textAlign: 'center' }}>
              Тестовый режим: код никуда не отправляется, на следующем шаге введите 000000.
            </T>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 999, padding: 4 },
  segBtn: { flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.card },
  segText: { fontFamily: fonts.black, fontSize: 16, color: colors.muted },
});
