// Экран приветствия
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { LogoIcon } from '@/components/icons';
import { Button, T, ui } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';

const backdrop = '<svg viewBox="0 0 390 470" preserveAspectRatio="xMidYMax slice">' +
  '<g fill="none" stroke="#6DB3E6" stroke-width="2"><path d="M-20 190 Q40 110 100 190"/><path d="M90 190 Q150 110 210 190"/><path d="M200 190 Q260 110 320 190"/><path d="M310 190 Q370 110 430 190"/><path d="M-20 250 Q40 170 100 250"/><path d="M90 250 Q150 170 210 250"/><path d="M200 250 Q260 170 320 250"/><path d="M310 250 Q370 170 430 250"/></g>' +
  '<g fill="#2F7FC0"><rect x="20" y="270" width="14" height="140"/><path d="M17 272 L27 240 L37 272Z"/><rect x="44" y="320" width="60" height="90"/><path d="M58 322 Q74 288 90 322Z"/><rect x="330" y="290" width="40" height="120"/><rect x="300" y="330" width="34" height="80"/></g>' +
  '<ellipse cx="195" cy="490" rx="300" ry="100" fill="#D6ECC8"/><ellipse cx="195" cy="496" rx="250" ry="80" fill="#C9E4B8"/></svg>';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}>
      <View style={[s.hero, { paddingTop: insets.top + 32 }]}>
        <SvgXml xml={backdrop} width="100%" height="100%" style={StyleSheet.absoluteFill} />
        <View style={s.brand}>
          <LogoIcon size={44} />
          <Text style={s.brandText}>Doppa</Text>
        </View>
        <View style={s.friends}>
          <Friend who="alim" hello="Салам!" color={colors.blueDark} />
          <Friend who="raihan" hello="Яхшимусиз!" color={colors.redDark} />
        </View>
      </View>
      <View style={[ui.pad, s.body]}>
        <View style={{ gap: 8 }}>
          <T variant="h1" style={{ textAlign: 'center' }}>Учим уйгурский вместе с Алимом и Райхан</T>
          <T variant="muted" style={{ textAlign: 'center' }}>Пять минут в день: слова, буквы, история и голоса носителей.</T>
        </View>
        <View style={{ gap: 12 }}>
          <Button title="Начать" onPress={() => router.push('/sign-in')} />
          <Button title="У меня уже есть аккаунт" variant="ghost" onPress={() => router.push('/sign-in')} />
        </View>
      </View>
    </ScrollView>
  );
}

function Friend({ who, hello, color }: { who: 'alim' | 'raihan'; hello: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text style={[s.hello, { color }]}>{hello}</Text>
      <Avatar who={who} width={150} height={240} framed={false} />
    </View>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: '#3D93D6', minHeight: 440, alignItems: 'center', overflow: 'hidden' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: fonts.black, fontSize: 40, color: '#fff', letterSpacing: -0.5 },
  friends: { position: 'absolute', left: 0, right: 0, bottom: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6 },
  hello: { fontFamily: fonts.black, fontSize: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6 },
  body: { flex: 1, justifyContent: 'space-between', gap: 24, paddingVertical: 24 },
});
