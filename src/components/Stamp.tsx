import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { CARD_EDGE, PRESSED_BASE, RADII, TILE_LIP } from '../theme/tokens';
import type { StreakSummary } from '../store/useLearningStore';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

// Seal artwork, drawn on a 100×100 grid: a hand-pressed ring broken in places,
// with a squared seal-style 済 ("done") or 正 ("correct") cut inside.
const SEAL_GLYPHS: Record<'sai' | 'sei', string[]> = {
  sai: [
    // 氵
    'M21 31 L29 37',
    'M19 47 L28 53',
    'M19 73 L31 59',
    // 斉
    'M61 20 L61 28',
    'M40 33 L81 33',
    'M47 38 L75 57',
    'M75 38 L44 59',
    'M49 63 L49 81',
    'M71 63 L71 82',
    'M49 63 L71 63',
    'M49 72 L71 72',
  ],
  sei: [
    'M27 28 L73 28',
    'M50 28 L50 75',
    'M50 51 L69 51',
    'M33 50 L33 75',
    'M24 75 L76 75',
  ],
};

// Ring arcs [start°, end°, stroke width]: uneven pressure, two hairline breaks.
const RING: [number, number, number][] = [
  [6, 96, 7.4],
  [99, 178, 6.1],
  [181, 266, 7.9],
  [271, 352, 6.6],
];

function arcPath(a0: number, a1: number, r = 42) {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x0 = 50 + r * Math.cos(rad(a0));
  const y0 = 50 + r * Math.sin(rad(a0));
  const x1 = 50 + r * Math.cos(rad(a1));
  const y1 = 50 + r * Math.sin(rad(a1));
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The red seal. Each seed (a day key, an item key) gets its own tilt and ink
 * speckle, so a week of stamps reads hand-pressed rather than cloned. With
 * `slam`, it lands like a stamp being pressed, with a haptic tap on landing.
 */
export function StampSeal({
  size = 34,
  slam = false,
  glyph = 'sai',
  seed = 'seal',
}: {
  size?: number;
  slam?: boolean;
  glyph?: 'sai' | 'sei';
  seed?: string;
}) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(slam ? 0 : 1)).current;

  const h = hash(seed);
  const tilt = -6 - (h % 15); // -6° to -20°
  const speckles = [0, 1, 2, 3, 4].map((i) => {
    const angle = ((h >>> (i * 5)) % 360) * (Math.PI / 180);
    const r = 39 + ((h >>> (i * 3)) % 7);
    return { cx: 50 + r * Math.cos(angle), cy: 50 + r * Math.sin(angle), r: 1.2 + ((h >>> i) % 3) * 0.5 };
  });

  useEffect(() => {
    if (!slam) return;
    if (reduce) {
      t.setValue(1);
      return;
    }
    Animated.timing(t, {
      toValue: 1,
      duration: 420,
      delay: 180,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    });
  }, [slam, reduce, t]);

  const style = {
    opacity: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 1] }),
    transform: [
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
      { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${tilt - 26}deg`, `${tilt}deg`] }) },
    ],
  };

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" opacity={0.94}>
        {RING.map(([a0, a1, w]) => (
          <Path key={a0} d={arcPath(a0, a1)} stroke={colors.hanko} strokeWidth={w} fill="none" strokeLinecap="butt" />
        ))}
        {SEAL_GLYPHS[glyph].map((d) => (
          <Path key={d} d={d} stroke={colors.hanko} strokeWidth={7.5} strokeLinecap="square" fill="none" />
        ))}
        {speckles.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#FFFFFF" />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Pressable with the stamp-block base: the thick ink base drops on press. */
export function PressBlock({
  style,
  children,
  disabled,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        disabled ? [CARD_EDGE, { borderColor: '#DCDAD3' }] : TILE_LIP,
        styles.block,
        style,
        pressed && !disabled && PRESSED_BASE,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** This week's attendance card: seven day boxes, streak and the daily goal. */
export function StampCard({
  streak,
  slamToday = false,
  compact = false,
}: {
  streak: StreakSummary;
  slamToday?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const left = Math.max(0, streak.goal - streak.todayCount);
  const pct = Math.min(100, Math.round((streak.todayCount / streak.goal) * 100));

  const note = streak.goalMet
    ? 'Today is stamped. See you tomorrow.'
    : streak.todayCount === 0
      ? `Finish ${streak.goal} items to earn today's stamp.`
      : `${left} more to earn today's stamp.`;

  return (
    <View
      style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}
      accessibilityRole="summary"
      accessibilityLabel={`${streak.current} day streak. ${streak.todayCount} of ${streak.goal} done today. ${note}`}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.ink }]}>Week {streak.weekNumber}</Text>
        <Text style={[styles.streak, { color: colors.hankoInk }]}>
          {streak.current > 0 ? `${streak.current}-day streak` : 'Start a streak today'}
        </Text>
      </View>

      <View style={styles.days}>
        {streak.week.map((d) => (
          <View
            key={d.key}
            style={[
              styles.day,
              { borderColor: d.isToday ? colors.indigo : colors.ink },
              d.isToday && !d.stamped && styles.dayToday,
              d.isFuture && { borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: d.isToday ? colors.indigo : d.isFuture ? colors.textMuted : colors.ink },
              ]}
            >
              {d.weekday}
            </Text>
            <View style={styles.daySeal}>
              {d.stamped ? (
                <StampSeal size={compact ? 28 : 32} slam={slamToday && d.isToday} seed={d.key} />
              ) : d.count > 0 && !d.isFuture ? (
                <Text style={[styles.dayCount, { color: colors.textMuted }]}>{d.count}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.goalRow}>
        <Text style={[styles.note, { color: colors.textSecondary }]}>{note}</Text>
        <Text style={[styles.goalNum, { color: colors.ink }]}>
          {Math.min(streak.todayCount, 999)}/{streak.goal}
        </Text>
      </View>
      <View style={[styles.track, { borderColor: colors.ink }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: streak.goalMet ? colors.hanko : colors.indigo },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seal: { alignItems: 'center', justifyContent: 'center' },
  block: { borderRadius: RADII.sm, overflow: 'hidden' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: 17, fontWeight: '900' },
  streak: { fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  days: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    aspectRatio: 0.7,
    borderWidth: 1.5,
    borderRadius: RADII.xs,
    paddingTop: 3,
    paddingLeft: 5,
  },
  dayToday: { borderStyle: 'dashed', borderWidth: 2 },
  dayLabel: { fontSize: 11, fontWeight: '700' },
  daySeal: { flex: 1, alignItems: 'center', justifyContent: 'center', marginLeft: -5, marginTop: 2 },
  dayCount: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  goalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  note: { flex: 1, fontSize: 13, fontWeight: '500' },
  goalNum: { fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
});
