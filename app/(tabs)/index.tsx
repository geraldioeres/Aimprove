import React, { useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import {
  build24HourForecast,
  localDayKey,
  selectAvailableJapaneseLessons,
  selectDueJapaneseReviews,
  selectUpcomingJapaneseReviews,
  selectDueQuranPages,
  selectStreak,
  useLearningStore,
} from '../../src/store/useLearningStore';
import { getSurahSummaryForPage } from '../../src/data/quran-seed';
import { PressBlock, StampCard, StampSeal } from '../../src/components/Stamp';
import { planToday, usePrayerTrack } from '../../src/store/usePrayerTrack';
import { rangeLabel } from '../../src/data/surahs';
import { PRAYERS } from '../../src/lib/prayer-times';

// Today's seal slams in once per app session, the first time Today shows it.
let sealShownFor: string | null = null;

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useLearningStore();
  const prayerTrack = usePrayerTrack();
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  const todayKey = localDayKey(new Date());
  const streak = selectStreak(state);
  const slam = streak.goalMet && sealShownFor !== todayKey;
  useEffect(() => {
    if (streak.goalMet) sealShownFor = todayKey;
  }, [streak.goalMet, todayKey]);

  if (!state.isHydrated) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={[styles.stateTitle, { color: colors.textSecondary }]}>Getting your card…</Text>
      </View>
    );
  }

  const dueJP = selectDueJapaneseReviews(state);
  const upcoming = selectUpcomingJapaneseReviews(state).totalCount;
  const availableLessons = selectAvailableJapaneseLessons(state);
  const dueQuran = selectDueQuranPages(state);
  const forecast = build24HourForecast(state);

  const count = (kind: string) => dueJP.subjects.filter((s) => s.kind === kind).length;
  const breakdown = [
    [count('radical'), 'radical'],
    [count('kanji'), 'kanji'],
    [count('vocab') + dueJP.minedCards.length, 'vocab'],
    [count('grammar'), 'grammar'],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, l]) => `${n} ${l}`)
    .join(' · ');

  const lessonsOn = availableLessons.length > 0;
  const reviewsOn = dueJP.totalCount > 0;
  const lessonLevels = Array.from(new Set(availableLessons.map((s: any) => s.level))).sort((a, b) => a - b);

  const recitedToday = state.reviewLogs.filter(
    (l) => l.domain === 'quran' && localDayKey(new Date(l.reviewedAt)) === todayKey
  );
  const recitedPages = new Set(recitedToday.map((l) => Number(l.itemId)));

  // Every page due today, plus pages already recited today, in stage order.
  // A recited page keeps its row and stage tag and gets stamped in place.
  const STAGE_ORDER = { sabaq: 0, sabqi: 1, manzil: 2, unstarted: 3 } as const;
  const duePages = new Set([
    ...dueQuran.sabaqPages.map((p) => p.pageNumber),
    ...dueQuran.sabqiPages.map((p) => p.pageNumber),
    ...dueQuran.manzilPages.map((p) => p.pageNumber),
  ]);
  const prayerOpen =
    prayerTrack.startIndex !== null && prayerTrack.loadedFor === state.userId
      ? planToday(prayerTrack).find((p) => p.isNext) || null
      : null;

  const setoran = Array.from(new Set([...duePages, ...recitedPages]))
    .map((page) => {
      const prog = state.quranProgress[page];
      const stage = (prog?.stage || 'sabaq') as keyof typeof STAGE_ORDER;
      const done = recitedPages.has(page) && !duePages.has(page);
      const note = done
        ? 'Recited today'
        : stage === 'sabaq'
          ? 'New page'
          : stage === 'sabqi'
            ? `Day ${prog?.sabqiDaysCompleted ?? 1} of ${prog?.sabqiTargetDays ?? state.sabqiWindowDays}`
            : 'Long-term revision';
      const color =
        stage === 'sabqi' ? colors.quranSabqi : stage === 'manzil' ? colors.quranManzil : colors.quranSabaq;
      const label = stage === 'unstarted' ? 'Sabaq' : stage.charAt(0).toUpperCase() + stage.slice(1);
      return { page, stage, label, note, color, done };
    })
    .sort((x, y) => STAGE_ORDER[x.stage] - STAGE_ORDER[y.stage] || x.page - y.page);

  const maxForecast = Math.max(1, ...forecast.map((b) => b.jpCount + b.quranCount));
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }, wide && styles.contentWide]}
    >
      <View style={styles.header}>
        <Text style={[styles.h1, { color: colors.ink }]} accessibilityRole="header">
          Today
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{dateLabel}</Text>
      </View>

      {state.syncError ? (
        <View style={[styles.banner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
          <Text style={[styles.bannerTitle, { color: colors.danger }]}>Couldn't sync: {state.syncError}</Text>
          <Text style={[styles.bannerSub, { color: colors.ink }]}>
            Your progress is safe on this phone. Check Cloud sync in Settings, then try again.
          </Text>
        </View>
      ) : null}

      <View style={[styles.cols, wide && styles.twoCol]}>
        <View style={[styles.col, wide && styles.colItem]}>
          <StampCard streak={streak} slamToday={slam} />

          <View style={styles.launchRow}>
            <PressBlock
              disabled={!reviewsOn}
              onPress={() => router.push('/jp/review')}
              accessibilityRole="button"
              accessibilityLabel={`${dueJP.totalCount} reviews due`}
              style={[styles.launch, { backgroundColor: reviewsOn ? colors.indigo : colors.bgSurface }]}
            >
              <View style={styles.launchHead}>
                <Text style={[styles.launchLabel, { color: reviewsOn ? '#FFFFFF' : colors.textSecondary }]}>Reviews</Text>
                {reviewsOn ? <Feather name="arrow-right" size={20} color="#FFFFFF" /> : null}
              </View>
              <Text style={[styles.launchCount, { color: reviewsOn ? '#FFFFFF' : colors.textMuted }]}>{dueJP.totalCount}</Text>
              <Text numberOfLines={1} style={[styles.launchHint, { color: reviewsOn ? '#E6E8F5' : colors.textMuted }]}>
                {reviewsOn ? breakdown : 'All caught up'}
              </Text>
            </PressBlock>

            <PressBlock
              disabled={!lessonsOn}
              onPress={() => router.push('/jp/lessons')}
              accessibilityRole="button"
              accessibilityLabel={`${availableLessons.length} lessons waiting`}
              style={[styles.launch, { backgroundColor: lessonsOn ? colors.marigold : colors.bgSurface }]}
            >
              <View style={styles.launchHead}>
                <Text style={[styles.launchLabel, { color: lessonsOn ? colors.ink : colors.textSecondary }]}>Lessons</Text>
                {lessonsOn ? <Feather name="arrow-right" size={20} color={colors.ink} /> : null}
              </View>
              <Text style={[styles.launchCount, { color: lessonsOn ? colors.ink : colors.textMuted }]}>
                {availableLessons.length}
              </Text>
              <Text numberOfLines={1} style={[styles.launchHint, { color: lessonsOn ? colors.ink : colors.textMuted }]}>
                {lessonsOn ? `Level ${lessonLevels.join(', ')}` : 'Clear reviews to unlock more'}
              </Text>
            </PressBlock>
          </View>

          {upcoming > 0 ? (
            <PressBlock
              onPress={() => router.push('/jp/review?ahead=1')}
              accessibilityRole="button"
              accessibilityLabel={`Review ahead: ${upcoming} reviews not due yet`}
              style={[styles.aheadBtn, { backgroundColor: colors.bgSurface }]}
            >
              <Feather name="fast-forward" size={18} color={colors.ink} />
              <Text style={[styles.aheadText, { color: colors.ink }]}>Review ahead</Text>
              <Text style={[styles.aheadMeta, { color: colors.textSecondary }]}>{upcoming} not due yet</Text>
            </PressBlock>
          ) : null}
        </View>

        <View style={[styles.col, wide && styles.colItem]}>
          <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>Setoran today</Text>
              <Pressable onPress={() => router.push('/mushaf/heatmap')} accessibilityRole="link" hitSlop={10}>
                <Text style={[styles.link, { color: colors.indigo }]}>Mushaf map</Text>
              </Pressable>
            </View>

            {prayerOpen ? (
              <Pressable
                onPress={() => router.push('/mushaf/prayer')}
                accessibilityRole="button"
                accessibilityLabel={`Ayah by prayer: ${rangeLabel(prayerOpen.from, prayerOpen.count)}`}
                style={({ pressed }) => [styles.qRow, pressed && { backgroundColor: colors.bgMuted }]}
              >
                <View style={[styles.tag, { backgroundColor: colors.quranSabaq }]}>
                  <Text style={[styles.tagText, { color: '#FFFFFF' }]}>Ayah</Text>
                </View>
                <View style={styles.qInfo}>
                  <Text numberOfLines={1} style={[styles.qTitle, { color: colors.ink }]}>
                    {rangeLabel(prayerOpen.from, prayerOpen.count)}
                  </Text>
                  <Text style={[styles.qNote, { color: colors.textMuted }]}>
                    {prayerOpen.phase === 'before' ? 'Before' : 'After'}{' '}
                    {PRAYERS.find((p) => p.key === prayerOpen.prayer)?.name}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.ink} />
              </Pressable>
            ) : null}

            {setoran.length === 0 && !prayerOpen ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>Nothing due. Pick a new Sabaq page to start.</Text>
            ) : null}

            {setoran.map((r, i) => (
              <Pressable
                key={r.page}
                onPress={() => router.push(`/mushaf/page/${r.page}`)}
                accessibilityRole="button"
                accessibilityLabel={`Page ${r.page}, ${r.label}, ${r.done ? 'recited today' : 'due'}`}
                style={({ pressed }) => [
                  styles.qRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed' },
                  pressed && { backgroundColor: colors.bgMuted },
                ]}
              >
                <View style={[styles.tag, { backgroundColor: r.color }]}>
                  <Text style={[styles.tagText, { color: '#FFFFFF' }]}>{r.label}</Text>
                </View>
                <View style={styles.qInfo}>
                  <Text numberOfLines={1} style={[styles.qTitle, { color: colors.ink }]}>
                    Page {r.page} · {getSurahSummaryForPage(r.page)}
                  </Text>
                  <Text style={[styles.qNote, { color: colors.textMuted }]}>{r.note}</Text>
                </View>
                {r.done ? (
                  <StampSeal size={34} seed={`${todayKey}-${r.page}`} />
                ) : (
                  <View style={[styles.slot, { borderColor: colors.textMuted }]} />
                )}
              </Pressable>
            ))}

            {dueQuran.sabaqPages.length === 0 ? (
              <Pressable
                onPress={() => router.push('/(tabs)/quran')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.addRow, { borderColor: colors.ink }, pressed && { backgroundColor: colors.bgMuted }]}
              >
                <Feather name="plus" size={16} color={colors.ink} />
                <Text style={[styles.addText, { color: colors.ink }]}>Choose a new Sabaq page</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>Coming up</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>Next 24 hours</Text>
            </View>
            {forecast.map((b, i) => {
              const n = b.jpCount + b.quranCount;
              return (
                <View key={b.hourOffset} style={[styles.fRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.fLabel, { color: colors.textSecondary }]}>
                    {b.label.replace(/^\+\d+h \((.*)\)$/, '$1')}
                  </Text>
                  <View style={styles.fBarArea}>
                    {b.jpCount > 0 ? (
                      <View style={[styles.fBar, { width: `${(b.jpCount / maxForecast) * 100}%`, backgroundColor: colors.indigo }]} />
                    ) : null}
                    {b.quranCount > 0 ? (
                      <View style={[styles.fBar, { width: `${(b.quranCount / maxForecast) * 100}%`, backgroundColor: colors.quranSabaq }]} />
                    ) : null}
                  </View>
                  <Text style={[styles.fDelta, { color: n > 0 ? colors.ink : colors.textMuted }]}>+{n}</Text>
                  <Text style={[styles.fTotal, { color: colors.textMuted }]}>{b.cumulativeTotal}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: SPACING.xxl, gap: 16 },
  contentWide: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 24 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  stateTitle: { fontSize: 14 },

  header: { gap: 2, marginBottom: 2 },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '900' },
  date: { fontSize: 14, fontWeight: '500' },

  banner: { padding: 14, borderRadius: RADII.sm, borderWidth: 2, gap: 4 },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerSub: { fontSize: 13, lineHeight: 19 },

  cols: { gap: 16 },
  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 16 },
  colItem: { flex: 1 },

  launchRow: { flexDirection: 'row', gap: 12 },
  aheadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14 },
  aheadText: { fontSize: 15, fontWeight: '900' },
  aheadMeta: { flex: 1, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
  launch: { flex: 1, minHeight: 150, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'space-between' },
  launchHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  launchLabel: { fontSize: 16, fontWeight: '900' },
  launchCount: { fontSize: 56, lineHeight: 62, fontWeight: '900', fontVariant: ['tabular-nums'] },
  launchHint: { fontSize: 13, fontWeight: '500' },

  card: { borderRadius: RADII.sm, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  meta: { fontSize: 12, fontWeight: '500' },
  link: { fontSize: 14, fontWeight: '700' },
  empty: { fontSize: 14, paddingVertical: 8 },

  qRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  tag: { width: 66, paddingVertical: 5, borderRadius: RADII.xs, alignItems: 'center' },
  tagText: { fontSize: 12, fontWeight: '700' },
  qInfo: { flex: 1, minWidth: 0, gap: 1 },
  qTitle: { fontSize: 15, fontWeight: '700' },
  qNote: { fontSize: 12 },
  slot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderStyle: 'dashed', marginHorizontal: 2 },
  addRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: RADII.sm,
  },
  addText: { fontSize: 14, fontWeight: '700' },

  fRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  fLabel: { width: 54, fontSize: 12, fontWeight: '500', fontVariant: ['tabular-nums'] },
  fBarArea: { flex: 1, flexDirection: 'row', height: 10, gap: 2 },
  fBar: { height: '100%', borderRadius: 2 },
  fDelta: { width: 32, textAlign: 'right', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  fTotal: { width: 28, textAlign: 'right', fontSize: 12, fontVariant: ['tabular-nums'] },
});
