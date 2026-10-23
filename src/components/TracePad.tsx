// Поле прописи: ученик пишет букву пальцем поверх подсказки.
import { useState, type Dispatch, type SetStateAction } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { Glyph, Pt, TraceMode } from '@/lib/trace';
import { firstHalf } from '@/lib/trace';
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
  const [size, setSize] = useState(0);
  const toPt = (x: number, y: number): Pt => {
    const k = 100 / (size || 1);
    return [Math.max(0, Math.min(100, x * k)), Math.max(0, Math.min(100, y * k))];
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

  const start = glyph.strokes[0]?.[0];
  const next = glyph.strokes[0]?.[2];
  return (
    <View
      style={s.pad}
      onLayout={(e) => setSize(e.nativeEvent.layout.width)}
      accessibilityLabel="Поле для письма"
      {...touch}>
      {size > 0 && (
        <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
          {/* Линейка как в прописи: строка и середина */}
          <Line x1="4" y1="61" x2="96" y2="61" stroke={colors.line} strokeWidth="0.8" />
          <Line x1="4" y1="36" x2="96" y2="36" stroke={colors.line} strokeWidth="0.5" strokeDasharray="2 2" />
          {mode === 'trace' && (
            <>
              {glyph.strokes.map((l, i) => (
                <Path key={i} d={path(l)} stroke={colors.tint} strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {glyph.strokes.map((l, i) => (
                <Path key={`d${i}`} d={path(l)} stroke={colors.flag} strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
              ))}
              {glyph.dots.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r="4.5" fill={colors.tint} stroke={colors.flag} strokeWidth="1" strokeDasharray="2 2" />)}
            </>
          )}
          {mode === 'half' && firstHalf(glyph).map((l, i) => (
            <Path key={i} d={path(l)} stroke={colors.blue} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
          ))}
          {mode !== 'free' && start && next && (
            // Откуда начинать и куда вести
            <>
              <Circle cx={start[0]} cy={start[1]} r="4" fill={colors.ok} />
              <Path d={`M${start[0]} ${start[1]} L${next[0]} ${next[1]}`} stroke={colors.ok} strokeWidth="1.5" fill="none" />
            </>
          )}
          {ghost && (
            <>
              {glyph.strokes.map((l, i) => (
                <Path key={`g${i}`} d={path(l)} stroke={colors.red} strokeWidth="2" strokeDasharray="3 3" fill="none" opacity={0.7} />
              ))}
              {glyph.dots.map(([x, y], i) => <Circle key={`gd${i}`} cx={x} cy={y} r="3.5" fill="none" stroke={colors.red} strokeWidth="1.5" />)}
            </>
          )}
          {ink.map((l, i) => (l.length > 1
            ? <Path key={`i${i}`} d={path(l)} stroke={colors.ink} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            : <Circle key={`i${i}`} cx={l[0][0]} cy={l[0][1]} r="2.6" fill={colors.ink} />))}
        </Svg>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pad: {
    width: '100%', maxWidth: 340, aspectRatio: 1, alignSelf: 'center', backgroundColor: colors.card,
    borderRadius: 22, borderWidth: 2, borderColor: colors.line, overflow: 'hidden',
  },
});
