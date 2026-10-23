// Карта раздела: дорога Шёлкового пути, восьмиугольные плитки уровней и декорации города.
// Разделы стоят друг под другом, дорога одного переходит в дорогу следующего.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Polygon, SvgXml } from 'react-native-svg';

import { colors, fonts } from '@/lib/theme';
import type { LevelState } from '@/lib/rules';
import type { AvatarId, Level } from '@/lib/types';
import { Avatar } from './Avatar';
import { CheckIcon, LockIcon, StarIcon } from './icons';
import type { CityScene } from './cityArt';

const W = 390;
const XS = [195, 110, 230, 150];
/** Сверху раздела место под табличку города */
const TOP = 150;
const STEP = 130;
const DECOR_TOP = 100;
const OCT = '29,0 71,0 100,29 100,71 71,100 29,100 0,71 0,29';

type NodeState = LevelState;

function layout(count: number) {
  const points = Array.from({ length: count }, (_, i) => ({ x: XS[i % XS.length], y: TOP + i * STEP }));
  const height = Math.max(600, TOP + count * STEP + 20);
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
  if (end) d += ` L${end.x} ${end.y + 40}`;
  return d;
}

function sceneXml(points: { x: number; y: number }[], height: number, current: number, scene: CityScene) {
  // Дорога уходит вниз к первому уровню следующего города
  const road = roadPath(points, { x: XS[0], y: height });
  const done = roadPath(points.slice(0, current + 1));
  return `<svg viewBox="0 0 ${W} ${height}">` +
    `<rect width="${W}" height="${height}" fill="${scene.ground}"/>` +
    `<path d="${road}" fill="none" stroke="${colors.road}" stroke-width="40" stroke-linecap="round"/>` +
    `<path d="${road}" fill="none" stroke="#F4DFB2" stroke-width="30" stroke-linecap="round"/>` +
    `<path d="${road}" fill="none" stroke="#D9B26A" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>` +
    (current > 0 ? `<path d="${done}" fill="none" stroke="${colors.gold}" stroke-width="6" stroke-linecap="round"/>` : '') +
    // Декорации начинаются под табличкой города и повторяются каждые 600 единиц, через раз зеркально.
    // Неполный блок внизу не рисуем, иначе рисунки обрезаются на границе со следующим городом.
    Array.from({ length: Math.max(1, Math.floor((height - DECOR_TOP + 60) / 600)) }, (_, k) =>
      `<g transform="translate(${k % 2 ? W : 0} ${DECOR_TOP + k * 600}) scale(${k % 2 ? -1 : 1} 1)">${scene.decor}</g>`).join('') +
    '</svg>';
}

const palette: Record<NodeState, { c: string; rim: string; sh: string; fg: string }> = {
  done: { c: colors.blue, rim: colors.gold, sh: colors.blueDark, fg: '#fff' },
  cur: { c: colors.red, rim: colors.gold, sh: colors.redDark, fg: '#fff' },
  open: { c: colors.tint, rim: colors.blue, sh: colors.blueDark, fg: colors.blue },
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

export type CitySign = { eyebrow: string; title: string; tone: 'blue' | 'ok' | 'lock' };
/** Учитель стоит напротив уровня index и говорит фразу из его темы */
export type Teacher = { index: number; ug: string; ru?: string };

const signTone = {
  blue: { bg: colors.blue, sh: colors.blueDark, fg: '#fff' },
  ok: { bg: colors.ok, sh: colors.okDark, fg: '#fff' },
  lock: { bg: colors.card, sh: colors.line, fg: colors.muted },
};

export function MapScene({ levels, states, who, scene, sign, teacher, onOpen }: {
  levels: Level[];
  states: NodeState[];
  who: AvatarId;
  scene: CityScene;
  sign: CitySign;
  teacher?: Teacher;
  onOpen: (level: Level, state: NodeState) => void;
}) {
  const [width, setWidth] = useState(0);
  const { points, height } = layout(levels.length);
  const k = width / W;
  // Золотая дорожка доходит до последнего пройденного или текущего уровня
  const current = states.reduce((m, st, i) => (st === 'done' || st === 'cur' ? i : m), -1);

  return (
    <View
      style={{ width: '100%', aspectRatio: W / height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <>
          <SvgXml xml={sceneXml(points, height, current, scene)} width={width} height={height * k} style={StyleSheet.absoluteFill} />
          {levels.map((l, i) => {
            const state = states[i] ?? 'lock';
            const size = (state === 'cur' ? 86 : 74) * k;
            const p = points[i];
            const right = p.x < 160;
            const Icon = state === 'done' ? CheckIcon : state === 'lock' ? LockIcon : StarIcon;
            const status = { done: 'пройден', cur: 'текущий', open: 'открыт', lock: 'закрыт' }[state];
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
                      {l.title}{state === 'cur' ? ' · начать' : state === 'open' ? ' · новый' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View pointerEvents="none" style={[s.signPos, { top: 26 * k }]}>
            <View style={[s.sign, { backgroundColor: signTone[sign.tone].bg, shadowColor: signTone[sign.tone].sh }]}>
              <Text style={[s.signEyebrow, { color: signTone[sign.tone].fg }]} numberOfLines={1}>{sign.eyebrow}</Text>
              <Text style={[s.signTitle, { color: signTone[sign.tone].fg }]} numberOfLines={2}>{sign.title}</Text>
            </View>
          </View>
          {teacher && points[teacher.index] && (() => {
            const p = points[teacher.index];
            // Плитки слева подписаны справа, поэтому учитель встаёт с другой стороны
            const onRight = p.x >= 160;
            const avatarW = 0.14 * width;
            const boxW = 0.3 * width;
            return (
              <View
                pointerEvents="none"
                style={[s.friend, {
                  width: boxW,
                  left: onRight ? width - boxW - 0.01 * width : 0.01 * width,
                  // Не залезаем на табличку города над первым уровнем
                  top: Math.max(118 * k, p.y * k - avatarW * 1.6 - 18 * k),
                }]}>
                <View style={s.hello}>
                  <Text style={s.helloUg} numberOfLines={2}>{teacher.ug}</Text>
                  {teacher.ru ? <Text style={s.helloRu} numberOfLines={1}>{teacher.ru}</Text> : null}
                </View>
                <Avatar who={who} width={avatarW} height={avatarW * 1.6} framed={false} />
              </View>
            );
          })()}
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
  hello: { backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center' },
  helloUg: { fontFamily: fonts.black, fontSize: 14, color: colors.ink, textAlign: 'center' },
  helloRu: { fontFamily: fonts.semi, fontSize: 11, color: colors.muted },
  signPos: { position: 'absolute', left: 20, right: 20 },
  sign: {
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 12, gap: 2,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  signEyebrow: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase', opacity: 0.9 },
  signTitle: { fontFamily: fonts.black, fontSize: 19 },
});
