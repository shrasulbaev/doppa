// Поле прописи: ученик пишет пальцем поверх серой буквы, слова или связки.
import { useState, type Dispatch, type SetStateAction } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, Path, Rect } from 'react-native-svg';

import type { Glyph, Pt, TraceMode } from '@/lib/trace';
import { halfOf } from '@/lib/trace';
import { colors } from '@/lib/theme';

const path = (line: Pt[]) => line.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

export function TracePad({ glyph, mode, ink, onInk, ghost, disabled }: {
  glyph: Glyph;
  mode: TraceMode;
  ink: Pt[][];
  onInk: Dispatch<SetStateAction<Pt[][]>>;
  /** После неудачи показываем эталон поверх написанного */
  ghost?: boolean;
  disabled?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const { w } = glyph;
  // Высота поля всегда 100 единиц, ширина своя: у фразы поле длиннее и ниже
  const toPt = (x: number, y: number): Pt => {
    const k = w / (width || 1);
    return [Math.max(0, Math.min(w, x * k)), Math.max(0, Math.min(100, y * k))];
  };
  // Касания обрабатываем самим View: новый штрих при касании, точки добавляются при движении
  const touch = {
    onStartShouldSetResponder: () => !disabled,
    onMoveShouldSetResponder: () => !disabled,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const p = toPt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      onInk((all) => [...all, [p]]);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const p = toPt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      onInk((all) => [...all.slice(0, -1), [...(all[all.length - 1] ?? []), p]]);
    },
  };

  const half = halfOf(glyph);
  const { start, dir } = glyph;
  const arrow = Math.hypot(dir[0] - start[0], dir[1] - start[1]) > 1;
  return (
    <View
      style={[s.pad, { maxWidth: w > 100 ? 560 : 340, aspectRatio: w / 100 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityLabel="Поле для письма"
      {...touch}>
      {width > 0 && (
        <Svg width={width} height={(width * 100) / w} viewBox={`0 0 ${w} 100`} pointerEvents="none">
          <Defs>
            {/* На шаге «Половина» подсказка видна только там, откуда начинают писать */}
            <ClipPath id="trace-half">
              {half.axis === 'x' ? <Rect x={half.at} y="0" width={w - half.at} height="100" /> : <Rect x="0" y="0" width={w} height={half.at} />}
            </ClipPath>
          </Defs>
          {/* Строка, на которой стоят буквы */}
          <Line x1="3" y1={glyph.base} x2={w - 3} y2={glyph.base} stroke={colors.line} strokeWidth="0.8" />
          {mode === 'trace' && (
            <Path d={glyph.outline} fill={colors.tint} stroke={colors.flag} strokeWidth="0.6" strokeDasharray="1.5 1.5" fillRule="evenodd" />
          )}
          {mode === 'half' && (
            <Path d={glyph.outline} fill={colors.tint} stroke={colors.flag} strokeWidth="0.6" strokeDasharray="1.5 1.5" fillRule="evenodd" clipPath="url(#trace-half)" />
          )}
          {mode !== 'free' && (
            // Откуда начинать и куда вести
            <>
              <Circle cx={start[0]} cy={start[1]} r="2.6" fill={colors.ok} />
              {arrow && <Path d={`M${start[0]} ${start[1]} L${dir[0]} ${dir[1]}`} stroke={colors.ok} strokeWidth="1.2" fill="none" />}
            </>
          )}
          {ghost && <Path d={glyph.outline} fill="none" stroke={colors.red} strokeWidth="0.9" strokeDasharray="2 1.5" fillRule="evenodd" opacity={0.8} />}
          {ink.map((l, i) => (l.length > 1
            ? <Path key={i} d={path(l)} stroke={colors.ink} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            : <Circle key={i} cx={l[0][0]} cy={l[0][1]} r="2" fill={colors.ink} />))}
        </Svg>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pad: {
    width: '100%', alignSelf: 'center', backgroundColor: colors.card,
    borderRadius: 22, borderWidth: 2, borderColor: colors.line, overflow: 'hidden',
  },
});
