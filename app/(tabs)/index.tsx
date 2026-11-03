import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { GLYPH_SHADOW, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
import {
  build24HourForecast,
  selectAvailableJapaneseLessons,
  selectDueJapaneseReviews,
  selectDueQuranPages,
  useLearningStore,
} from '../../src/store/useLearningStore';
import { getSurahSummaryForPage } from '../../src/data/quran-seed';

export default function UnifiedHomeQueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  if (!state.isHydrated) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.jpRadical} />
        <Text style={[styles.stateTitle, { color: colors.textSecondary }]}>
          Loading your queue…
        </Text>
      </View>
    );
  }

  const dueJP = selectDueJapaneseReviews(state);
  const availableLessons = selectAvailableJapaneseLessons(state);
  const dueQuran = selectDueQuranPages(state);
  const forecast = build24HourForecast(state);

  const dueRadicals = dueJP.subjects.filter((s) => s.kind === 'radical').length;
  const dueKanji = dueJP.subjects.filter((s) => s.kind === 'kanji').length;
  const dueVocab = dueJP.subjects.filter((s) => s.kind === 'vocab').length + dueJP.minedCards.length;
  const dueGrammar = dueJP.subjects.filter((s) => s.kind === 'grammar').length;

  const totalDueNow = dueJP.totalCount + dueQuran.totalDue;
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const completedToday = state.reviewLogs.filter(
    (log) => log.reviewedAt && log.reviewedAt.slice(0, 10) === todayDateStr
  ).length;
  const dayTotal = completedToday + totalDueNow;
  const dayPct = dayTotal === 0 ? 100 : Math.round((completedToday / dayTotal) * 100);

  const maxForecast = Math.max(1, ...forecast.map((b) => b.jpCount + b.quranCount));

  const lessonsOn = availableLessons.length > 0;
  const reviewsOn = dueJP.totalCount > 0;

  const quranRows = [
    ...dueQuran.sabaqPages.map((p) => ({
      key: `sabaq-${p.pageNumber}`,
      page: p.pageNumber,
      stage: 'Sabaq',
      note: 'New page',
      action: 'Recite',
      color: colors.quranSabaq,
    })),
    ...dueQuran.sabqiPages.map((p) => ({
      key: `sabqi-${p.pageNumber}`,
      page: p.pageNumber,
      stage: 'Sabqi',
      note: `Day ${p.sabqiDaysCompleted} of ${p.sabqiTargetDays}`,
      action: 'Test',
      color: colors.quranSabqi,
    })),
    ...dueQuran.manzilPages.map((p) => ({
      key: `manzil-${p.pageNumber}`,
      page: p.pageNumber,
      stage: 'Manzil',
      note: `${p.stability}d stability`,
      action: 'Revise',
      color: colors.quranManzil,
    })),
  ];

  const breakdown = [
    { label: 'Radicals', n: dueRadicals, color: colors.jpRadical },
    { label: 'Kanji', n: dueKanji, color: colors.jpKanji },
    { label: 'Vocabulary', n: dueVocab, color: colors.jpVocab },
    { label: 'Grammar', n: dueGrammar, color: colors.jpGrammar },
  ];

  const addSabaq = (extra?: object) => (
    <Pressable
      onPress={() => router.push('/(tabs)/quran')}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.emptyRow,
        { borderColor: colors.borderStrong },
        extra,
        pressed && styles.pressed,
      ]}
    >
      <Feather name="plus" size={16} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Choose today's Sabaq page
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={[styles.content, wide && styles.contentWide]}
    >
      {state.syncError ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
          <Text style={[styles.errorBannerTitle, { color: colors.danger }]}>
            Couldn't sync: {state.syncError}
          </Text>
          <Text style={[styles.errorBannerSub, { color: colors.textPrimary }]}>
            Your progress is saved on this device. Check the Supabase connection in Settings, then retry.
          </Text>
        </View>
      ) : null}

      {/* Lessons / Reviews */}
      <View style={styles.launchRow}>
        <Pressable
          disabled={!lessonsOn}
          onPress={() => router.push('/jp/lessons')}
          accessibilityRole="button"
          accessibilityLabel={`${availableLessons.length} lessons available`}
          style={({ pressed }) => [
            styles.launchTile,
            lessonsOn
              ? [TILE_LIP, { backgroundColor: colors.jpKanji }]
              : { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.launchLabel, { color: lessonsOn ? '#FFFFFF' : colors.textSecondary }]}>
            Lessons
          </Text>
          <Text
            style={[
              styles.launchCount,
              lessonsOn ? [GLYPH_SHADOW, { color: '#FFFFFF' }] : { color: colors.textMuted },
            ]}
          >
            {availableLessons.length}
          </Text>
          <Text style={[styles.launchHint, { color: lessonsOn ? '#FFFFFF' : colors.textMuted }]}>
            {lessonsOn ? 'Start lessons' : 'Finish reviews to unlock more'}
          </Text>
        </Pressable>

        <Pressable
          disabled={!reviewsOn}
          onPress={() => router.push('/jp/review')}
          accessibilityRole="button"
          accessibilityLabel={`${dueJP.totalCount} reviews available`}
          style={({ pressed }) => [
            styles.launchTile,
            reviewsOn
              ? [TILE_LIP, { backgroundColor: colors.jpRadical }]
              : { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.launchLabel, { color: reviewsOn ? '#FFFFFF' : colors.textSecondary }]}>
            Reviews
          </Text>
          <Text
            style={[
              styles.launchCount,
              reviewsOn ? [GLYPH_SHADOW, { color: '#FFFFFF' }] : { color: colors.textMuted },
            ]}
          >
            {dueJP.totalCount}
          </Text>
          <Text style={[styles.launchHint, { color: reviewsOn ? '#FFFFFF' : colors.textMuted }]}>
            {reviewsOn ? 'Start reviews' : 'Nothing due right now'}
          </Text>
        </Pressable>
      </View>

      {/* Due breakdown by item type + today's progress */}
      <View style={[styles.panel, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <View style={styles.breakdownRow}>
          {breakdown.map((b) => (
            <View key={b.label} style={styles.breakdownCell}>
              <View style={styles.breakdownTop}>
                <View style={[styles.swatch, { backgroundColor: b.color }]} />
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{b.label}</Text>
              </View>
              <Text style={[styles.breakdownCount, { color: b.n > 0 ? colors.textPrimary : colors.textMuted }]}>
                {b.n}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <View style={styles.dayRow}>
          <Text style={[styles.dayText, { color: colors.textPrimary }]}>
            <Text style={styles.dayStrong}>{completedToday}</Text> of {dayTotal} done today
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/japanese')} accessibilityRole="link" hitSlop={8}>
            <Text style={[styles.link, { color: colors.jpRadical }]}>Level {state.currentJPLevel} ›</Text>
          </Pressable>
        </View>
        <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
          <View style={[styles.fill, { width: `${dayPct}%`, backgroundColor: colors.success }]} />
        </View>
      </View>

      <View style={[styles.cols, wide && styles.twoCol]}>
        {/* Quran */}
        <View style={[styles.panel, wide && styles.colItem, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <View style={styles.panelHead}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Quran Hafalan</Text>
            <Pressable onPress={() => router.push('/mushaf/heatmap')} accessibilityRole="link" hitSlop={8}>
              <Text style={[styles.link, { color: colors.quranSabaq }]}>604-page map ›</Text>
            </Pressable>
          </View>

          {dueQuran.sabaqPages.length === 0 ? addSabaq(quranRows.length > 0 ? { marginBottom: 8 } : undefined) : null}
          {quranRows.map((r, i) => (
            <Pressable
              key={r.key}
              onPress={() => router.push(`/mushaf/page/${r.page}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.qRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                pressed && { backgroundColor: colors.bgMuted },
              ]}
            >
              <View style={[styles.stageTag, TILE_LIP, { backgroundColor: r.color }]}>
                <Text style={[styles.stageTagText, GLYPH_SHADOW]}>{r.stage}</Text>
              </View>
              <View style={styles.qInfo}>
                <Text numberOfLines={1} style={[styles.qTitle, { color: colors.textPrimary }]}>
                  Page {r.page} · {getSurahSummaryForPage(r.page)}
                </Text>
                <Text style={[styles.qNote, { color: colors.textMuted }]}>{r.note}</Text>
              </View>
              <Text style={[styles.qAction, { color: r.color }]}>{r.action} ›</Text>
            </Pressable>
          ))}
        </View>

        {/* Forecast */}
        <View style={[styles.panel, wide && styles.colItem, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <View style={styles.panelHead}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Review Forecast</Text>
            <Text style={[styles.panelMeta, { color: colors.textMuted }]}>Next 24 hours</Text>
          </View>
          {forecast.map((b, i) => {
            const n = b.jpCount + b.quranCount;
            return (
              <View
                key={b.hourOffset}
                style={[styles.fRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
              >
                <Text style={[styles.fLabel, { color: colors.textSecondary }]}>
                  {b.label.replace(/^\+\d+h \((.*)\)$/, '$1')}
                </Text>
                <View style={styles.fBarArea}>
                  {b.jpCount > 0 ? (
                    <View
                      style={[styles.fBar, { width: `${(b.jpCount / maxForecast) * 100}%`, backgroundColor: colors.jpRadical }]}
                    />
                  ) : null}
                  {b.quranCount > 0 ? (
                    <View
                      style={[styles.fBar, { width: `${(b.quranCount / maxForecast) * 100}%`, backgroundColor: colors.quranSabaq }]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.fDelta, { color: n > 0 ? colors.textPrimary : colors.textMuted }]}>+{n}</Text>
                <Text style={[styles.fTotal, { color: colors.textMuted }]}>{b.cumulativeTotal}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  contentWide: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    padding: SPACING.lg,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stateTitle: { fontSize: 14 },
  pressed: { opacity: 0.85 },
  errorBanner: {
    padding: SPACING.md,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 4,
  },
  errorBannerTitle: { fontSize: 14, fontWeight: '700' },
  errorBannerSub: { fontSize: 13, lineHeight: 19 },

  launchRow: { flexDirection: 'row', gap: SPACING.sm },
  launchTile: {
    flex: 1,
    minHeight: 132,
    borderRadius: RADII.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  launchLabel: { fontSize: 15, fontWeight: '700' },
  launchCount: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  launchHint: { fontSize: 12, fontWeight: '600' },

  panel: {
    borderRadius: RADII.sm,
    borderWidth: 1,
    padding: SPACING.md,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  panelTitle: { fontSize: 16, fontWeight: '700' },
  panelMeta: { fontSize: 12 },
  link: { fontSize: 13, fontWeight: '700' },

  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: SPACING.sm },
  breakdownCell: { flexGrow: 1, flexBasis: 120, gap: 2 },
  breakdownTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  breakdownLabel: { fontSize: 12, fontWeight: '600' },
  breakdownCount: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rule: { height: 1, marginVertical: SPACING.md },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: { fontSize: 13 },
  dayStrong: { fontWeight: '700' },
  track: { height: 6, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },

  cols: { gap: SPACING.md },
  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },
  colItem: { flex: 1 },

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADII.sm,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
  },
  stageTag: {
    width: 64,
    paddingVertical: 4,
    borderRadius: RADII.xs,
    alignItems: 'center',
  },
  stageTagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  qInfo: { flex: 1, minWidth: 0, gap: 1 },
  qTitle: { fontSize: 14, fontWeight: '700' },
  qNote: { fontSize: 12 },
  qAction: { fontSize: 13, fontWeight: '700' },

  fRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  fLabel: { width: 52, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  fBarArea: { flex: 1, flexDirection: 'row', height: 10, gap: 1 },
  fBar: { height: '100%', borderRadius: 1 },
  fDelta: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fTotal: { width: 28, textAlign: 'right', fontSize: 12, fontVariant: ['tabular-nums'] },
});
