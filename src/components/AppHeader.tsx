// Верхняя панель вкладок: логотип, пиала (серия), абрикосы (опыт), аватар-профиль.
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentStreak } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { avatarImages } from './Avatar';
import { ApricotIcon, LogoIcon, PialaIcon, PomegranateIcon } from './icons';

export function AppHeader() {
  const { progress, hearts, showToast } = useStore();
  const insets = useSafeAreaInsets();
  if (!progress) return null;
  const streak = currentStreak(progress, new Date());
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={s.brand}>
        <LogoIcon size={30} />
        <Text style={s.brandText}>Doppa</Text>
      </View>
      <View style={s.stats}>
        <Stat
          label={`Серия: ${streak} дн. подряд`}
          color={colors.blueDark}
          value={streak}
          icon={<PialaIcon />}
          onPress={() => showToast('Пиала — твоя серия: сколько дней подряд ты занимаешься.')}
        />
        <Stat
          label={`Гранатов: ${hearts}`}
          color={colors.redDark}
          value={hearts}
          icon={<PomegranateIcon />}
          onPress={() => showToast('Гранаты — это жизни. За ошибку отдаёшь один, за полчаса вырастает новый.')}
        />
        <Stat
          label={`Опыт: ${progress.xp} абрикосов`}
          color={colors.apricotInk}
          value={progress.xp}
          icon={<ApricotIcon />}
          onPress={() => showToast('Абрикосы — это опыт: 20 за новый уровень, 5 за повтор и за историю.')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Профиль"
          onPress={() => router.push('/profile')}
          style={[s.me, { backgroundColor: progress.avatar === 'alim' ? colors.tint : colors.redTint }]}>
          <Image source={avatarImages[progress.avatar]} style={s.meImg} contentFit="cover" contentPosition="top" />
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ icon, value, color, label, onPress }: {
  icon: React.ReactNode; value: number; color: string; label: string; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.stat} hitSlop={4}>
      {icon}
      <Text style={[s.statText, { color }]}>{value}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
    paddingBottom: 10, backgroundColor: colors.card, borderBottomWidth: 2, borderColor: colors.line,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: fonts.black, fontSize: 22, color: colors.blue },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, minHeight: 40 },
  statText: { fontFamily: fonts.black, fontSize: 17 },
  me: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: colors.line, marginLeft: 2 },
  meImg: { width: '100%', height: '220%' },
});
