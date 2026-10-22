// Алим или Райхан. Пока нет анимации губ, «речь» показываем покачиванием и звуковыми волнами.
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { avatarNames, colors } from '@/lib/theme';
import type { AvatarId } from '@/lib/types';

export const avatarImages = {
  alim: require('../../assets/avatars/alim.webp'),
  raihan: require('../../assets/avatars/raihan.webp'),
};

export function Avatar({ who, width, height, talking, framed = true, style }: {
  who: AvatarId;
  width: number;
  height: number;
  talking?: boolean;
  /** Цветная подложка со скруглением, как в уроке */
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!talking) {
      t.stopAnimation();
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [talking, t]);

  const bob = t.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={avatarNames[who]}
      style={[
        { width, height },
        framed && [s.frame, { backgroundColor: who === 'alim' ? colors.tint : colors.redTint }],
        style,
      ]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: bob }] }]}>
        <Image
          source={avatarImages[who]}
          style={StyleSheet.absoluteFill}
          contentFit={framed ? 'cover' : 'contain'}
          contentPosition="top"
        />
      </Animated.View>
      {talking && (
        <View style={s.waves} pointerEvents="none">
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[s.wave, {
                transform: [{ scaleY: t.interpolate({ inputRange: [0, 1], outputRange: i === 1 ? [1, 0.4] : [0.4, 1] }) }],
              }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  frame: { borderRadius: 24, overflow: 'hidden' },
  waves: { position: 'absolute', right: 8, top: 8, flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 22 },
  wave: { width: 4, height: 22, borderRadius: 2, backgroundColor: colors.blue },
});
