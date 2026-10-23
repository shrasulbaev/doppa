// Профиль: статистика, смена учителя, выход
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Bubble, Button, T, TopBar, ui } from '@/components/ui';
import { currentStreak } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { isDemo, testAuth } from '@/lib/supabase';
import { avatarNames, colors, fonts } from '@/lib/theme';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { progress, content, session, update, signOut } = useStore();
  if (!progress) return null;
  const other = progress.avatar === 'alim' ? 'raihan' : 'alim';
  const account = session?.user.email || session?.user.phone;

  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <TopBar onPress={() => router.back()}><T variant="h2">Профиль</T></TopBar>
      <ScrollView contentContainerStyle={[ui.pad, { gap: 18, paddingBottom: insets.bottom + 24 }]}>
        <View style={[ui.row, { gap: 16 }]}>
          <Avatar who={progress.avatar} width={96} height={120} />
          <View style={{ flex: 1, gap: 4 }}>
            <T variant="h1">{progress.name}</T>
            <T variant="muted">Учитель: {avatarNames[progress.avatar]}</T>
            <T variant="muted" style={{ fontSize: 13 }}>
              {account ? `Вход: ${account}` : isDemo ? 'Демо-режим: прогресс хранится на этом устройстве' : 'Прогресс хранится на этом устройстве'}
            </T>
          </View>
        </View>
        <View style={[ui.row, { gap: 10 }]}>
          <Stat value={String(progress.xp)} label="абрикосов" />
          <Stat value={`${Object.keys(progress.levels).length} из ${content.levels.length}`} label="уровней" />
          <Stat value={String(currentStreak(progress, new Date()))} label="дн. подряд" />
        </View>
        <Button
          variant="ghost"
          title={`Сменить учителя на ${other === 'alim' ? 'Алима' : 'Райхан'}`}
          onPress={() => update((p) => ({ ...p, avatar: other }))}
        />
        {testAuth && (
          <Button
            variant="ghost"
            title={progress.unlockAll ? 'Тест: закрыть непройденные уровни' : 'Тест: открыть все уровни'}
            onPress={() => update((p) => ({ ...p, unlockAll: !p.unlockAll }))}
          />
        )}
        <Button variant="ghost" color={colors.redDark} title="Выйти" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Bubble style={{ flex: 1, alignItems: 'center', borderRadius: 16, paddingHorizontal: 8 }}>
      <Text style={s.value}>{value}</Text>
      <T variant="muted" style={{ fontSize: 13 }}>{label}</T>
    </Bubble>
  );
}

const s = StyleSheet.create({
  value: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
});
