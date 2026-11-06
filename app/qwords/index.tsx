import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
import { PressBlock } from '../../src/components/Stamp';
import { useStageColor } from '../../src/components/QuranWordCard';
import {
  selectDueWords,
  selectKnownCoverage,
  selectLevelProgress,
  selectUpcomingWords,
  selectWordLessons,
  selectWordLevel,
  useQuranWords,
} from '../../src/store/useQuranWords';
import { QW_BY_LEVEL, QW_LEVELS, QW_MAX_LEVEL, mainMeaning } from '../../src/data/quran-words';

export default function QuranWordsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = useQuranWords((s) => s.progress);
  const stageColor = useStageColor();

  const level = selectWordLevel(progress);
  const lessons = selectWordLessons(progress).length;
  const due = selectDueWords(progress).length;
  const upcoming = selectUpcomingWords(progress).length;
  const known = selectKnownCoverage(progress);
  const lp = selectLevelProgress(progress, level);
  const [shown, setShown] = useState(level);
  // Follow the current level once progress loads or a level opens.
  useEffect(() => setShown(level), [level]);

  const shownWords = QW_BY_LEVEL[shown] || [];
  const locked = shown > level;

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <View style={[styles.hero, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.heroTop}>
          <Text style={[styles.level, { color: colors.ink }]}>Level {level}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>of {QW_MAX_LEVEL}</Text>
        </View>
        <Text style={[styles.body, { color: colors.ink }]}>
          You know <Text style={styles.strong}>{(known * 100).toFixed(1)}%</Text> of the words in the Quran.
        </Text>
        <View style={[styles.track, { borderColor: colors.ink }]}>
          <View
            style={[styles.trackFill, { width: `${Math.min(100, (lp.guru / lp.needed) * 100)}%`, backgroundColor: colors.srsGuru }]}
          />
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {lp.guru} of {lp.needed} words at Guru to open level {Math.min(QW_MAX_LEVEL, level + 1)}
        </Text>
      </View>

      <View style={styles.tiles}>
        <Pressable
          disabled={lessons === 0}
          onPress={() => router.push('/qwords/lessons')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.tile,
            lessons > 0 ? [TILE_LIP, { backgroundColor: colors.marigold }] : { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.bgSurface },
            pressed && PRESSED_BASE,
          ]}
        >
          <Text style={[styles.tileTitle, { color: colors.ink }]}>Lessons</Text>
          <Text style={[styles.tileCount, { color: lessons > 0 ? colors.ink : colors.textMuted }]}>{lessons}</Text>
          <Text style={[styles.tileHint, { color: lessons > 0 ? colors.ink : colors.textMuted }]}>
            {lessons > 0 ? 'New words, 5 at a time.' : 'All learned for now.'}
          </Text>
        </Pressable>
        <Pressable
          disabled={due === 0}
          onPress={() => router.push('/qwords/review')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.tile,
            due > 0 ? [TILE_LIP, { backgroundColor: colors.indigo }] : { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.bgSurface },
            pressed && PRESSED_BASE,
          ]}
        >
          <Text style={[styles.tileTitle, { color: due > 0 ? '#FFFFFF' : colors.ink }]}>Reviews</Text>
          <Text style={[styles.tileCount, { color: due > 0 ? '#FFFFFF' : colors.textMuted }]}>{due}</Text>
          <Text style={[styles.tileHint, { color: due > 0 ? '#FFFFFF' : colors.textMuted }]}>
            {due > 0 ? 'Waiting for you.' : 'All caught up.'}
          </Text>
        </Pressable>
      </View>
      {upcoming > 0 ? (
        <PressBlock
          onPress={() => router.push('/qwords/review?ahead=1')}
          accessibilityRole="button"
          accessibilityLabel={`Review ahead: ${upcoming} reviews not due yet`}
          style={[styles.ahead, { backgroundColor: colors.bgSurface }]}
        >
          <Feather name="fast-forward" size={18} color={colors.ink} />
          <Text style={[styles.aheadText, { color: colors.ink }]}>Review ahead</Text>
          <Text style={[styles.aheadMeta, { color: colors.textSecondary }]}>{upcoming} not due yet</Text>
        </PressBlock>
      ) : null}

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.levelHead}>
          <Pressable
            disabled={shown <= 1}
            onPress={() => setShown(shown - 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous level"
            style={styles.stepBtn}
          >
            <Feather name="chevron-left" size={22} color={shown <= 1 ? colors.textMuted : colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.h3, { color: colors.ink }]}>Level {shown}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {shownWords.length} words · up to {QW_LEVELS[shown - 1]?.coverage}% of the Quran
            </Text>
          </View>
          <Pressable
            disabled={shown >= QW_MAX_LEVEL}
            onPress={() => setShown(shown + 1)}
            accessibilityRole="button"
            accessibilityLabel="Next level"
            style={styles.stepBtn}
          >
            <Feather name="chevron-right" size={22} color={shown >= QW_MAX_LEVEL ? colors.textMuted : colors.ink} />
          </Pressable>
        </View>
        {locked ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Locked. Opens after level {shown - 1}.
          </Text>
        ) : null}
        <View style={styles.grid}>
          {shownWords.map((w) => {
            const p = progress[w.i];
            const c = stageColor(p);
            const started = p && p.stage >= 1;
            return (
              <Pressable
                key={w.i}
                onPress={() => router.push(`/qwords/word/${encodeURIComponent(w.i)}`)}
                accessibilityRole="button"
                accessibilityLabel={`${w.a}, ${mainMeaning(w)}`}
                style={({ pressed }) => [
                  styles.chip,
                  started ? { backgroundColor: c, borderColor: c } : { borderColor: c, borderStyle: p ? 'solid' : 'dashed' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.chipArabic, { color: started ? '#FFFFFF' : colors.ink }]} numberOfLines={1}>
                  {w.a}
                </Text>
                <Text style={[styles.chipMeaning, { color: started ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={1}>
                  {mainMeaning(w)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}>
          {[
            ['Lesson', colors.marigold],
            ['Apprentice', colors.srsApprentice],
            ['Guru', colors.srsGuru],
            ['Master', colors.srsMaster],
            ['Enlightened', colors.srsEnlightened],
            ['Burned', colors.srsBurned],
          ].map(([label, c]) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.credit, { color: colors.textMuted }]}>
        Word list and roots from the Quranic Arabic Corpus (corpus.quran.com, GNU GPL). Meanings from Quran.com's word by
        word translation.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hero: { borderRadius: RADII.sm, padding: 16, gap: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  level: { fontSize: 34, lineHeight: 40, fontWeight: '900' },
  body: { fontSize: 15, lineHeight: 22 },
  strong: { fontWeight: '900' },
  meta: { fontSize: 13, lineHeight: 18 },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%' },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, minHeight: 140, padding: 16, borderRadius: RADII.sm, gap: 4 },
  tileTitle: { fontSize: 16, fontWeight: '900' },
  tileCount: { fontSize: 40, lineHeight: 46, fontWeight: '900', fontVariant: ['tabular-nums'] },
  tileHint: { fontSize: 12 },
  ahead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14 },
  aheadText: { fontSize: 15, fontWeight: '900' },
  aheadMeta: { flex: 1, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  h3: { fontSize: 17, fontWeight: '900' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderRadius: RADII.xs, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', maxWidth: 150 },
  chipArabic: { fontSize: 22, lineHeight: 42 },
  chipMeaning: { fontSize: 11, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  credit: { fontSize: 11, lineHeight: 16 },
});
