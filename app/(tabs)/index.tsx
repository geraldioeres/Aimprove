import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
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

  if (!state.isHydrated) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.jpVocab} />
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          Loading your daily study queue...
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
  const dueVocab = dueJP.subjects.filter((s) => s.kind === 'vocab').length;
  const dueGrammar = dueJP.subjects.filter((s) => s.kind === 'grammar').length;
  const dueMined = dueJP.minedCards.length;

  const maxForecastWindow = Math.max(
    4,
    ...forecast.map((b) => b.jpCount + b.quranCount)
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {state.syncError ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.dangerBg, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.errorBannerTitle, { color: colors.danger }]}>
            Storage Notice: {state.syncError}
          </Text>
          <Text style={[styles.errorBannerSub, { color: colors.textPrimary }]}>
            Open Cloud & Settings to verify your Supabase connection or retry sync.
          </Text>
        </View>
      ) : null}

      {/* Top Focal Header: Today's Action Summary */}
      <View style={styles.headerBlock}>
        <Text style={[styles.screenHeadline, { color: colors.textPrimary }]}>
          Today's Study Queue
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          {dueJP.totalCount + dueQuran.totalDue > 0
            ? `${dueJP.totalCount} Japanese reviews and ${dueQuran.totalDue} Mushaf pages are ready for recall now.`
            : 'All scheduled reviews for this hour are complete. Start a new lesson or practice a Mushaf page below.'}
        </Text>
      </View>

      {/* Primary Domain Action Card 1: Japanese Learning Queue */}
      <View
        style={[
          styles.domainCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.domainHeaderRow}>
          <View>
            <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>
              Japanese • Level {state.currentJPLevel}
            </Text>
            <Text style={[styles.domainMeta, { color: colors.textSecondary }]}>
              WaniKani 9-Stage SRS + JLPT Cloze Grammar
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/japanese')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryLinkBtn,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryLinkText, { color: colors.textPrimary }]}>
              Level Map
            </Text>
          </Pressable>
        </View>

        {/* Due Breakdown Chips */}
        <View style={styles.chipRow}>
          <View style={[styles.typeChip, { backgroundColor: colors.jpRadicalBg }]}>
            <Text style={[styles.typeChipText, { color: colors.jpRadical }]}>
              Radicals: {dueRadicals}
            </Text>
          </View>
          <View style={[styles.typeChip, { backgroundColor: colors.jpKanjiBg }]}>
            <Text style={[styles.typeChipText, { color: colors.jpKanji }]}>
              Kanji: {dueKanji}
            </Text>
          </View>
          <View style={[styles.typeChip, { backgroundColor: colors.jpVocabBg }]}>
            <Text style={[styles.typeChipText, { color: colors.jpVocab }]}>
              Vocab: {dueVocab + dueMined}
            </Text>
          </View>
          <View style={[styles.typeChip, { backgroundColor: colors.jpGrammarBg }]}>
            <Text style={[styles.typeChipText, { color: colors.jpGrammar }]}>
              Grammar: {dueGrammar}
            </Text>
          </View>
        </View>

        {/* Two Action Buttons: Reviews (Primary) & Lessons (Secondary) */}
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => router.push('/japanese/review')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryActionBox,
              {
                backgroundColor:
                  dueJP.totalCount > 0 ? colors.jpKanji : colors.bgMuted,
                borderColor:
                  dueJP.totalCount > 0 ? colors.jpKanji : colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.actionCountBig,
                {
                  color: dueJP.totalCount > 0 ? '#FFFFFF' : colors.textPrimary,
                },
              ]}
            >
              {dueJP.totalCount}
            </Text>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: dueJP.totalCount > 0 ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {dueJP.totalCount > 0
                ? 'Start Typed Reviews'
                : 'Reviews Caught Up'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/japanese/lessons')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryActionBox,
              {
                backgroundColor:
                  availableLessons.length > 0 ? colors.jpVocabBg : colors.bgMuted,
                borderColor:
                  availableLessons.length > 0 ? colors.jpVocab : colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.actionCountBig,
                {
                  color:
                    availableLessons.length > 0
                      ? colors.jpVocab
                      : colors.textPrimary,
                },
              ]}
            >
              {availableLessons.length}
            </Text>
            <Text
              style={[
                styles.actionLabel,
                {
                  color:
                    availableLessons.length > 0
                      ? colors.jpVocab
                      : colors.textSecondary,
                },
              ]}
            >
              {availableLessons.length > 0
                ? 'Learn New Items'
                : 'No Pending Lessons'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Primary Domain Action Card 2: Quran Hafalan Queue (Sabaq / Sabqi / Manzil) */}
      <View
        style={[
          styles.domainCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.domainHeaderRow}>
          <View>
            <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>
              Quran Hafalan • 604-Page Mushaf
            </Text>
            <Text style={[styles.domainMeta, { color: colors.textSecondary }]}>
              Sabaq (New) • Sabqi ({state.sabqiWindowDays}d Window) • Manzil (FSRS)
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/quran/heatmap')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryLinkBtn,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryLinkText, { color: colors.textPrimary }]}>
              604 Heatmap
            </Text>
          </Pressable>
        </View>

        {/* Three Quran Lifecycle Rows: Sabaq, Sabqi, Manzil */}
        <View style={styles.quranQueueList}>
          {/* 1. Sabaq */}
          {dueQuran.sabaqPages.length > 0 ? (
            dueQuran.sabaqPages.map((p) => (
              <Pressable
                key={`sabaq-${p.pageNumber}`}
                onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.quranQueueRow,
                  {
                    backgroundColor: colors.quranSabaqBg,
                    borderColor: colors.quranSabaq,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.quranRowLeft}>
                  <Text style={[styles.quranStageTag, { color: colors.quranSabaq }]}>
                    SABAQ (NEW MEMORIZATION)
                  </Text>
                  <Text style={[styles.quranPageTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.openMushafBtn,
                    { backgroundColor: colors.quranSabaq },
                  ]}
                >
                  <Text style={styles.openMushafBtnText}>Recite Page</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Pressable
              onPress={() => router.push('/(tabs)/quran')}
              accessibilityRole="button"
              style={[
                styles.quranEmptyRow,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.quranEmptyText, { color: colors.textSecondary }]}>
                No active Sabaq page assigned today. Tap to pick a new Mushaf page (1-604).
              </Text>
            </Pressable>
          )}

          {/* 2. Sabqi (Recent Consolidation) */}
          {dueQuran.sabqiPages.map((p) => (
            <Pressable
              key={`sabqi-${p.pageNumber}`}
              onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quranQueueRow,
                {
                  backgroundColor: colors.quranSabqiBg,
                  borderColor: colors.quranSabqi,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.quranRowLeft}>
                <Text style={[styles.quranStageTag, { color: colors.quranSabqi }]}>
                  SABQI (DAY {p.sabqiDaysCompleted} OF {p.sabqiTargetDays})
                </Text>
                <Text style={[styles.quranPageTitle, { color: colors.textPrimary }]}>
                  Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                </Text>
              </View>
              <View
                style={[
                  styles.openMushafBtn,
                  { backgroundColor: colors.quranSabqi },
                ]}
              >
                <Text style={styles.openMushafBtnText}>Test Recall</Text>
              </View>
            </Pressable>
          ))}

          {/* 3. Manzil (FSRS Scheduled Revision) */}
          {dueQuran.manzilPages.map((p) => (
            <Pressable
              key={`manzil-${p.pageNumber}`}
              onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quranQueueRow,
                {
                  backgroundColor: colors.quranManzilBg,
                  borderColor: colors.quranManzil,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.quranRowLeft}>
                <Text style={[styles.quranStageTag, { color: colors.quranManzil }]}>
                  MANZIL (FSRS STABILITY: {p.stability}D)
                </Text>
                <Text style={[styles.quranPageTitle, { color: colors.textPrimary }]}>
                  Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                </Text>
              </View>
              <View
                style={[
                  styles.openMushafBtn,
                  { backgroundColor: colors.quranManzil },
                ]}
              >
                <Text style={styles.openMushafBtnText}>Revise Page</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 24-Hour Review Forecast Timeline (Answers: When will my next reviews arrive over the next 24h?) */}
      <View
        style={[
          styles.forecastCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Incoming Reviews Over Next 24 Hours
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Hourly schedule combining Japanese SRS stages and Mushaf revision pages
        </Text>

        <View style={styles.forecastList}>
          {forecast.map((bucket) => {
            const windowAdded = bucket.jpCount + bucket.quranCount;
            const widthPct = Math.min(
              100,
              Math.round((windowAdded / maxForecastWindow) * 100)
            );
            return (
              <View key={bucket.hourOffset} style={styles.forecastRow}>
                <Text style={[styles.forecastTimeLabel, { color: colors.textSecondary }]}>
                  {bucket.label}
                </Text>
                <View
                  style={[
                    styles.forecastBarTrack,
                    { backgroundColor: colors.bgMuted },
                  ]}
                >
                  {windowAdded > 0 ? (
                    <View
                      style={[
                        styles.forecastBarFill,
                        {
                          width: `${Math.max(10, widthPct)}%`,
                          backgroundColor:
                            bucket.quranCount > 0 && bucket.jpCount === 0
                              ? colors.quranSabaq
                              : colors.jpVocab,
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.forecastDeltaText, { color: colors.textPrimary }]}>
                  +{windowAdded}
                </Text>
                <Text style={[styles.forecastCumText, { color: colors.textMuted }]}>
                  ({bucket.cumulativeTotal})
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: 4,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorBannerSub: {
    fontSize: 13,
  },
  headerBlock: {
    gap: 4,
    marginBottom: 2,
  },
  screenHeadline: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  domainCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  domainHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  domainMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  secondaryLinkBtn: {
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  secondaryLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryActionBox: {
    flex: 1,
    minHeight: 84,
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  secondaryActionBox: {
    flex: 1,
    minHeight: 84,
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  actionCountBig: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  quranQueueList: {
    gap: SPACING.sm,
  },
  quranQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  quranRowLeft: {
    flex: 1,
    gap: 2,
  },
  quranStageTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quranPageTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  openMushafBtn: {
    paddingHorizontal: 14,
    minHeight: 42,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openMushafBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quranEmptyRow: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  quranEmptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  forecastCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  forecastList: {
    gap: 10,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastTimeLabel: {
    width: 88,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  forecastBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  forecastBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  forecastDeltaText: {
    width: 32,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  forecastCumText: {
    width: 38,
    textAlign: 'right',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});

