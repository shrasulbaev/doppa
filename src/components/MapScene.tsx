// Карта раздела: дорога Шёлкового пути, восьмиугольные плитки уровней и декорации Кашгара.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Polygon, SvgXml } from 'react-native-svg';

import { colors, fonts } from '@/lib/theme';
import type { AvatarId, Level } from '@/lib/types';
import { Avatar } from './Avatar';
import { CheckIcon, LockIcon, StarIcon } from './icons';
import { kashgarDecor } from './sceneArt';

const W = 390;
const XS = [195, 110, 230, 150];
const OCT = '29,0 71,0 100,29 100,71 71,100 29,100 0,71 0,29';

type NodeState = 'done' | 'cur' | 'lock';

function layout(count: number) {
  const points = Array.from({ length: count }, (_, i) => ({ x: XS[i % XS.length], y: 70 + i * 130 }));
  const height = Math.max(600, 70 + count * 130 + 140);
  return { points, height };
}

function roadPath(points: { x: number; y: number }[], end?: { x: number; y: number }) {
  if (!points.length) return '';
  let d = `M${points[0].x} -20 L${points[0].x} ${points[0].y}`;
  const all = end ? [...points, end] : points;
  for (let i = 1; i < all.length; i++) {
    const a = all[i - 1];
    const b = all[i];
    d += ` C${a.x} ${a.y + 70} ${b.x} ${b.y - 70} ${b.x} ${b.y}`;
  }
  if (end) d += ` L${end.x} ${end.y + 200}`;
  return d;
}

function sceneXml(points: { x: number; y: number }[], height: number, current: number) {
  const road = roadPath(points, { x: 190, y: height - 150 });
  const done = roadPath(points.slice(0, Math.min(current, points.length - 1) + 1));
  return `<svg viewBox="0 0 ${W} ${height}">` +
    `<path d="${road}" fill="none" stroke="${colors.road}" stroke-width="40" stroke-linecap="round"/>` +
    `<path d="${road}" fill="none" stroke="#F4DFB2" stroke-width="30" stroke-linecap="round"/>` +
    `<path d="${road}" fill="none" stroke="#D9B26A" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>` +
    (current > 0 ? `<path d="${done}" fill="none" stroke="${colors.gold}" stroke-width="6" stroke-linecap="round"/>` : '') +
    kashgarDecor +
    '</svg>';
}

const palette: Record<NodeState, { c: string; rim: string; sh: string; fg: string }> = {
  done: { c: colors.blue, rim: colors.gold, sh: colors.blueDark, fg: '#fff' },
  cur: { c: colors.red, rim: colors.gold, sh: colors.redDark, fg: '#fff' },
  lock: { c: '#EEF1EA', rim: '#C8CFC2', sh: '#B9C2B3', fg: '#6E7F81' },
};

function Tile({ state, size }: { state: NodeState; size: number }) {
  const p = palette[state];
  const inset = (k: number) => `translate(${k} ${k}) scale(${(100 - 2 * k) / 100})`;
  return (
    <Svg width={size} height={size + 5} viewBox="-12 -12 124 129">
      {state === 'cur' && <Polygon points={OCT} fill="#fff" opacity={0.5} transform="translate(-11 -11) scale(1.22)" />}
      <Polygon points={OCT} fill={p.sh} transform="translate(0 5)" />
      <Polygon points={OCT} fill={p.rim} />
      <G transform={inset(8)}><Polygon points={OCT} fill={p.c} /></G>
      <G transform={inset(22)}><Polygon points={OCT} fill="#fff" opacity={0.14} /></G>
    </Svg>
  );
}

export function MapScene({ levels, current, done, who, nextCity, onOpen }: {
  levels: Level[];
  current: number;
  done: Record<string, unknown>;
  who: AvatarId;
  nextCity?: string;
  onOpen: (level: Level, state: NodeState) => void;
}) {
  const [width, setWidth] = useState(0);
  const { points, height } = layout(levels.length);
  const k = width / W;

  return (
    <View
      style={{ width: '100%', aspectRatio: W / height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <>
          <SvgXml xml={sceneXml(points, height, current)} width={width} height={height * k} style={StyleSheet.absoluteFill} />
          {levels.map((l, i) => {
            const state: NodeState = done[l.id] ? 'done' : i === current ? 'cur' : 'lock';
            const size = (state === 'cur' ? 86 : 74) * k;
            const p = points[i];
            const right = p.x < 160;
            const Icon = state === 'done' ? CheckIcon : state === 'cur' ? StarIcon : LockIcon;
            const status = state === 'done' ? 'пройден' : state === 'cur' ? 'текущий' : 'закрыт';
            return (
              <View key={l.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Уровень ${i + 1}: ${l.title}, ${status}`}
                  onPress={() => onOpen(l, state)}
                  style={({ pressed }) => [
                    s.node,
                    { left: p.x * k - size / 2, top: p.y * k - size / 2 + (pressed ? 3 : 0), width: size, height: size + 5 },
                  ]}>
                  <Tile state={state} size={size} />
                  <View style={[s.icon, { width: size, height: size }]}>
                    <Icon size={state === 'cur' ? 34 * k : 28 * k} color={state === 'cur' ? '#fff' : palette[state].fg} />
                  </View>
                </Pressable>
                <View
                  pointerEvents="none"
                  style={[
                    s.labelPos,
                    right
                      ? { left: (p.x + 46) * k, top: p.y * k - 24 }
                      : { left: (p.x - 90) * k, width: 180 * k, top: (p.y + 46) * k, alignItems: 'center' },
                  ]}>
                  <View style={[s.label, state === 'cur' && s.labelCur]}>
                    <Text style={[s.num, state === 'done' && { color: colors.blue }, state === 'cur' && { color: '#fff' }]}>
                      Уровень {i + 1}
                    </Text>
                    <Text style={[s.title, state === 'cur' && { color: '#fff' }]} numberOfLines={1}>
                      {l.title}{state === 'cur' ? ' · начать' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View pointerEvents="none" style={[s.friend, { left: 0.81 * width, top: 0.23 * width * (600 / W), width: 0.17 * width }]}>
            <Text style={s.hello}>Салам!</Text>
            <Avatar who={who} width={0.14 * width} height={0.14 * width * 1.6} framed={false} />
          </View>
          {nextCity && (
            <View pointerEvents="none" style={[s.next, { top: (height - 70) * k }]}>
              <Text style={s.nextText}>Дальше: {nextCity} · скоро</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  node: { position: 'absolute' },
  icon: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  labelPos: { position: 'absolute' },
  label: {
    alignItems: 'center', backgroundColor: colors.card, borderRadius: 12,
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 5,
    shadowColor: colors.road, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  labelCur: { backgroundColor: colors.red, shadowColor: colors.redDark },
  num: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted },
  title: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
  friend: { position: 'absolute', alignItems: 'center', gap: 4 },
  hello: {
    fontFamily: fonts.bold, fontSize: 14, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 9, paddingVertical: 5, color: colors.ink,
  },
  next: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  nextText: {
    fontFamily: fonts.black, fontSize: 14, color: colors.muted, backgroundColor: colors.card, borderRadius: 12,
    overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5,
  },
});
