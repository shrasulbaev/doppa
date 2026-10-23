// Выбор учителя (Алим или Райхан) и имени
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { CheckIcon } from '@/components/icons';
import { Button, ProgressBar, T, TopBar, ui } from '@/components/ui';
import { newProgress, useStore } from '@/lib/store';
import { avatarNames, colors, fonts } from '@/lib/theme';
import type { AvatarId } from '@/lib/types';

export default function AvatarPick() {
  const insets = useSafeAreaInsets();
  const { startProgress } = useStore();
  const [pick, setPick] = useState<AvatarId>('raihan');
  const [name, setName] = useState('');

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <TopBar onPress={() => router.back()}><ProgressBar value={1} /></TopBar>
      </View>
      <ScrollView contentContainerStyle={[ui.pad, { flexGrow: 1, gap: 18, paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <T variant="h1">Выбери, кто будет учить тебя</T>
          <T variant="muted">Друга можно поменять потом в профиле</T>
        </View>
        <View style={s.grid} accessibilityRole="radiogroup">
          <Card who="alim" on={pick === 'alim'} color={colors.blue} tint={colors.tint} onPress={() => setPick('alim')} />
          <Card who="raihan" on={pick === 'raihan'} color={colors.red} tint={colors.redTint} onPress={() => setPick('raihan')} />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={ui.label}>Как тебя зовут?</Text>
          <TextInput
            accessibilityLabel="Имя"
            value={name}
            onChangeText={setName}
            placeholder="Имя"
            placeholderTextColor="#9AA8B6"
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={24}
            style={ui.field}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Готово" onPress={() => startProgress(newProgress(name.trim() || 'Друг', pick))} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Card({ who, on, color, tint, onPress }: {
  who: AvatarId; on: boolean; color: string; tint: string; onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={avatarNames[who]}
      onPress={onPress}
      style={[s.card, { borderColor: on ? color : colors.line, backgroundColor: on ? tint : colors.card, shadowColor: on ? color : colors.line }]}>
      <Avatar who={who} width={130} height={200} framed={false} />
      <Text style={s.name}>{avatarNames[who]}</Text>
      {on && (
        <View style={[s.tick, { backgroundColor: color }]}>
          <CheckIcon size={18} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1, alignItems: 'center', gap: 6, paddingTop: 12, paddingBottom: 10, borderRadius: 22, borderWidth: 3,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  name: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  tick: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
