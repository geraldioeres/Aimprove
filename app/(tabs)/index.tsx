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
import { Ionicons } from '@expo/vector-icons';
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
          Filling your daily study cup...
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

  const totalDueNow = dueJP.totalCount + dueQuran.totalDue;

  // Calculate today's completed study count from review logs
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const completedToday = state.reviewLogs.filter(
    (log) => log.reviewedAt && log.reviewedAt.slice(0, 10) === todayDateStr
  ).length;

  // Waterllama-style Daily Goal Fill calculation
  const dailyTarget = Math.max(15, completedToday + totalDueNow);
  const fillPercentage = Math.min(
    100,
    Math.round((completedToday / dailyTarget) * 100)
  );

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

      {/* Waterllama Header: Cheerful Greeting & Streak Badge */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
            Daily Knowledge Tracker
          </Text>
          <Text style={[styles.greetingHeadline, { color: colors.textPrimary }]}>
            Ready to learn! ✨
          </Text>
        </View>

        <View
          style={[
            styles.streakBadge,
            { backgroundColor: colors.streakFlameBg, borderColor: colors.streakFlame },
          ]}
        >
          <Ionicons name="flame" size={18} color={colors.streakFlame} />
          <Text style={[styles.streakText, { color: colors.streakFlame }]}>
            {Math.max(1, completedToday > 0 ? 3 : 1)} Day Streak
          </Text>
        </View>
      </View>

      {/* Waterllama Central Hero: The Daily Goal Fill Vessel */}
      <View
        style={[
          styles.vesselHeroCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.vesselContentRow}>
          {/* Visual Round Fluid Meter */}
          <View
            style={[
              styles.vesselCircleOuter,
              { backgroundColor: colors.bgMuted, borderColor: colors.progressFluid },
            ]}
          >
            {/* Fluid fill layer */}
            <View
              style={[
                styles.vesselFluidFill,
                {
                  height: `${Math.max(12, fillPercentage)}%`,
                  backgroundColor: colors.progressFluid,
                },
              ]}
            />
            {/* Center percentage badge */}
            <View style={styles.vesselCenterBadge}>
              <Text style={[styles.vesselPercentText, { color: colors.textPrimary }]}>
                {fillPercentage}%
              </Text>
              <Text style={[styles.vesselPercentLabel, { color: colors.textSecondary }]}>
                Filled
              </Text>
            </View>
          </View>

          {/* Right motivation info */}
          <View style={styles.vesselInfoCol}>
            <View
              style={[
                styles.goalPill,
                { backgroundColor: colors.progressFluidBg },
              ]}
            >
              <Text style={[styles.goalPillText, { color: colors.jpRadical }]}>
                DAILY STUDY GOAL
              </Text>
            </View>

            <Text style={[styles.vesselHeadline, { color: colors.textPrimary }]}>
              {completedToday} of {dailyTarget} completed
            </Text>

            <Text style={[styles.vesselSub, { color: colors.textSecondary }]}>
              {totalDueNow > 0
                ? `${totalDueNow} items waiting to fill your cup today.`
                : 'Your cup is filled! Amazing consistency today.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Domain Card 1: Japanese Learning Queue */}
      <View
        style={[
          styles.chunkyCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: colors.jpVocabBg },
              ]}
            >
              <Ionicons name="language" size={20} color={colors.jpVocab} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Japanese Study
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Level {state.currentJPLevel} • WaniKani 9-Stage SRS
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/japanese')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.chunkyPillBtn,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.chunkyPillBtnText, { color: colors.textPrimary }]}>
              Explore 60 Lvls
            </Text>
          </Pressable>
        </View>

        {/* Playful Item Chips */}
        <View style={styles.chipRow}>
          <View style={[styles.playfulChip, { backgroundColor: colors.jpRadicalBg }]}>
            <Text style={[styles.playfulChipText, { color: colors.jpRadical }]}>
              💧 Radicals: {dueRadicals}
            </Text>
          </View>
          <View style={[styles.playfulChip, { backgroundColor: colors.jpKanjiBg }]}>
            <Text style={[styles.playfulChipText, { color: colors.jpKanji }]}>
              🌸 Kanji: {dueKanji}
            </Text>
          </View>
          <View style={[styles.playfulChip, { backgroundColor: colors.jpVocabBg }]}>
            <Text style={[styles.playfulChipText, { color: colors.jpVocab }]}>
              🍇 Vocab: {dueVocab + dueMined}
            </Text>
          </View>
          <View style={[styles.playfulChip, { backgroundColor: colors.jpGrammarBg }]}>
            <Text style={[styles.playfulChipText, { color: colors.jpGrammar }]}>
              ⚡ Grammar: {dueGrammar}
            </Text>
          </View>
        </View>

        {/* Tactile Action Grid */}
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => router.push('/japanese/review')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionSquircle,
              {
                backgroundColor:
                  dueJP.totalCount > 0 ? colors.jpKanji : colors.bgMuted,
                borderColor:
                  dueJP.totalCount > 0 ? colors.jpKanji : colors.border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={styles.actionTopRow}>
              <Text
                style={[
                  styles.actionBigNumber,
                  {
                    color: dueJP.totalCount > 0 ? '#FFFFFF' : colors.textPrimary,
                  },
                ]}
              >
                {dueJP.totalCount}
              </Text>
              <View
                style={[
                  styles.actionMiniIconWrap,
                  {
                    backgroundColor:
                      dueJP.totalCount > 0
                        ? 'rgba(255,255,255,0.25)'
                        : colors.bgSurface,
                  },
                ]}
              >
                <Ionicons
                  name="play"
                  size={16}
                  color={dueJP.totalCount > 0 ? '#FFFFFF' : colors.textSecondary}
                />
              </View>
            </View>
            <Text
              style={[
                styles.actionTitleText,
                {
                  color: dueJP.totalCount > 0 ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {dueJP.totalCount > 0 ? 'Start Reviews' : 'All Caught Up!'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/japanese/lessons')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionSquircle,
              {
                backgroundColor:
                  availableLessons.length > 0 ? colors.jpVocab : colors.bgMuted,
                borderColor:
                  availableLessons.length > 0 ? colors.jpVocab : colors.border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={styles.actionTopRow}>
              <Text
                style={[
                  styles.actionBigNumber,
                  {
                    color:
                      availableLessons.length > 0
                        ? '#FFFFFF'
                        : colors.textPrimary,
                  },
                ]}
              >
                {availableLessons.length}
              </Text>
              <View
                style={[
                  styles.actionMiniIconWrap,
                  {
                    backgroundColor:
                      availableLessons.length > 0
                        ? 'rgba(255,255,255,0.25)'
                        : colors.bgSurface,
                  },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={
                    availableLessons.length > 0 ? '#FFFFFF' : colors.textSecondary
                  }
                />
              </View>
            </View>
            <Text
              style={[
                styles.actionTitleText,
                {
                  color:
                    availableLessons.length > 0
                      ? '#FFFFFF'
                      : colors.textSecondary,
                },
              ]}
            >
              {availableLessons.length > 0 ? 'New Lessons' : 'No Lessons'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Domain Card 2: Quran Hafalan Queue */}
      <View
        style={[
          styles.chunkyCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: colors.quranSabaqBg },
              ]}
            >
              <Ionicons name="book" size={20} color={colors.quranSabaq} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Quran Hafalan
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                604-Page Mushaf • Sabaq & Sabqi
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/quran/heatmap')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.chunkyPillBtn,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.chunkyPillBtnText, { color: colors.textPrimary }]}>
              Heatmap
            </Text>
          </Pressable>
        </View>

        {/* Quran Scheduled List */}
        <View style={styles.quranList}>
          {/* Sabaq Row */}
          {dueQuran.sabaqPages.length > 0 ? (
            dueQuran.sabaqPages.map((p) => (
              <Pressable
                key={`sabaq-${p.pageNumber}`}
                onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.quranSquircleRow,
                  {
                    backgroundColor: colors.quranSabaqBg,
                    borderColor: colors.quranSabaq,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={styles.quranRowInfo}>
                  <Text style={[styles.quranStageTag, { color: colors.quranSabaq }]}>
                    SABAQ • NEW TARGET
                  </Text>
                  <Text style={[styles.quranPageName, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.chunkyPillAction,
                    { backgroundColor: colors.quranSabaq },
                  ]}
                >
                  <Text style={styles.chunkyPillActionText}>Recite</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Pressable
              onPress={() => router.push('/(tabs)/quran')}
              accessibilityRole="button"
              style={[
                styles.emptyQuranCard,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.emptyQuranText, { color: colors.textSecondary }]}>
                + Assign your Sabaq page for today (Pages 1-604)
              </Text>
            </Pressable>
          )}

          {/* Sabqi Rows */}
          {dueQuran.sabqiPages.map((p) => (
            <Pressable
              key={`sabqi-${p.pageNumber}`}
              onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quranSquircleRow,
                {
                  backgroundColor: colors.quranSabqiBg,
                  borderColor: colors.quranSabqi,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={styles.quranRowInfo}>
                <Text style={[styles.quranStageTag, { color: colors.quranSabqi }]}>
                  SABQI • RECENT REVISION ({p.sabqiDaysCompleted}/{p.sabqiTargetDays}D)
                </Text>
                <Text style={[styles.quranPageName, { color: colors.textPrimary }]}>
                  Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                </Text>
              </View>

              <View
                style={[
                  styles.chunkyPillAction,
                  { backgroundColor: colors.quranSabqi },
                ]}
              >
                <Text style={styles.chunkyPillActionText}>Test</Text>
              </View>
            </Pressable>
          ))}

          {/* Manzil Rows */}
          {dueQuran.manzilPages.map((p) => (
            <Pressable
              key={`manzil-${p.pageNumber}`}
              onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quranSquircleRow,
                {
                  backgroundColor: colors.quranManzilBg,
                  borderColor: colors.quranManzil,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={styles.quranRowInfo}>
                <Text style={[styles.quranStageTag, { color: colors.quranManzil }]}>
                  MANZIL • FSRS ({p.stability}D STABILITY)
                </Text>
                <Text style={[styles.quranPageName, { color: colors.textPrimary }]}>
                  Page {p.pageNumber} • {getSurahSummaryForPage(p.pageNumber)}
                </Text>
              </View>

              <View
                style={[
                  styles.chunkyPillAction,
                  { backgroundColor: colors.quranManzil },
                ]}
              >
                <Text style={styles.chunkyPillActionText}>Revise</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 24-Hour Review Timeline: Friendly Round Bars */}
      <View
        style={[
          styles.chunkyCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          24-Hour Review Wave
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Upcoming review batches over the next 24 hours
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
                <Text style={[styles.forecastLabel, { color: colors.textSecondary }]}>
                  {bucket.label}
                </Text>
                <View
                  style={[
                    styles.forecastTrack,
                    { backgroundColor: colors.bgMuted },
                  ]}
                >
                  {windowAdded > 0 ? (
                    <View
                      style={[
                        styles.forecastBar,
                        {
                          width: `${Math.max(12, widthPct)}%`,
                          backgroundColor:
                            bucket.quranCount > 0 && bucket.jpCount === 0
                              ? colors.quranSabaq
                              : colors.jpVocab,
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.forecastDelta, { color: colors.textPrimary }]}>
                  +{windowAdded}
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
  container: { flex: 1 },
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
    fontWeight: '700',
  },
  errorBanner: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 4,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorBannerSub: {
    fontSize: 13,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  greetingHeadline: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
  },
  vesselHeroCard: {
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  vesselContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  vesselCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  vesselFluidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  vesselCenterBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vesselPercentText: {
    fontSize: 22,
    fontWeight: '900',
  },
  vesselPercentLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  vesselInfoCol: {
    flex: 1,
    gap: 4,
  },
  goalPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  vesselHeadline: {
    fontSize: 17,
    fontWeight: '800',
  },
  vesselSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  chunkyCard: {
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  chunkyPillBtn: {
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chunkyPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playfulChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  playfulChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionSquircle: {
    flex: 1,
    minHeight: 88,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'space-between',
  },
  actionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBigNumber: {
    fontSize: 30,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  actionMiniIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  quranList: {
    gap: 10,
  },
  quranSquircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 10,
  },
  quranRowInfo: {
    flex: 1,
    gap: 3,
  },
  quranStageTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quranPageName: {
    fontSize: 15,
    fontWeight: '800',
  },
  chunkyPillAction: {
    paddingHorizontal: 16,
    minHeight: 38,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chunkyPillActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyQuranCard: {
    padding: 16,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  emptyQuranText: {
    fontSize: 14,
    fontWeight: '700',
  },
  forecastList: {
    gap: 10,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  forecastLabel: {
    width: 86,
    fontSize: 12,
    fontWeight: '700',
  },
  forecastTrack: {
    flex: 1,
    height: 14,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  forecastBar: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  forecastDelta: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
  },
});
