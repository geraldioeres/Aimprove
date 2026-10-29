import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  selectDueQuranPages,
  useLearningStore,
} from '../../src/store/useLearningStore';
import {
  getJuzForPage,
  getSurahSummaryForPage,
} from '../../src/data/quran-seed';

export default function QuranHafalanHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const startSabaqPage = useLearningStore((s) => s.startQuranSabaqPage);

  const [jumpPageInput, setJumpPageInput] = useState('582');
  const [pageInputError, setPageInputError] = useState<string | null>(null);

  const dueQuran = selectDueQuranPages(state);
  const allProgress = Object.values(state.quranProgress);

  const sabaqTotal = allProgress.filter((p) => p.stage === 'sabaq').length;
  const sabqiTotal = allProgress.filter((p) => p.stage === 'sabqi').length;
  const manzilTotal = allProgress.filter((p) => p.stage === 'manzil').length;

  const handleOpenOrAssignPage = async (assignAsSabaq: boolean) => {
    const num = parseInt(jumpPageInput.trim(), 10);
    if (isNaN(num) || num < 1 || num > 604) {
      setPageInputError('Enter a valid Madani Mushaf page between 1 and 604.');
      return;
    }
    setPageInputError(null);
    if (assignAsSabaq) {
      await startSabaqPage(num);
    }
    router.push(`/quran/page/${num}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Lifecycle Summary Row */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.quranSabaqBg, borderColor: colors.quranSabaq },
          ]}
        >
          <Text style={[styles.summaryCount, { color: colors.quranSabaq }]}>
            {sabaqTotal}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textPrimary }]}>
            Sabaq (New)
          </Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
            Active Pages
          </Text>
        </View>

        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.quranSabqiBg, borderColor: colors.quranSabqi },
          ]}
        >
          <Text style={[styles.summaryCount, { color: colors.quranSabqi }]}>
            {sabqiTotal}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textPrimary }]}>
            Sabqi ({state.sabqiWindowDays}d)
          </Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
            Recent Window
          </Text>
        </View>

        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.quranManzilBg, borderColor: colors.quranManzil },
          ]}
        >
          <Text style={[styles.summaryCount, { color: colors.quranManzil }]}>
            {manzilTotal}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textPrimary }]}>
            Manzil (FSRS)
          </Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
            of 604 Pages
          </Text>
        </View>
      </View>

      {/* 604-Page Mastery Heatmap Callout */}
      <Pressable
        onPress={() => router.push('/quran/heatmap')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heatmapBanner,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderStrong,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.heatmapLeft}>
          <Text style={[styles.heatmapTitle, { color: colors.textPrimary }]}>
            30-Juz & 604-Page Mastery Heatmap
          </Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            Inspect memorization stability across all 604 Madani Mushaf pages
          </Text>
        </View>
        <View
          style={[
            styles.heatmapBtn,
            { backgroundColor: colors.quranManzil },
          ]}
        >
          <Text style={styles.heatmapBtnText}>View 604 Grid</Text>
        </View>
      </Pressable>

      {/* Automated Daily Lifecycle Queue: Sabaq -> Sabqi -> Manzil */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Today's Scheduled Mushaf Queue
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          New pages begin in Sabaq, consolidate daily in Sabqi for {state.sabqiWindowDays} days, then graduate to FSRS Manzil intervals.
        </Text>

        {/* 1. Sabaq Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranSabaq }]}>
            1. SABAQ (NEW MEMORIZATION TARGET)
          </Text>
          {dueQuran.sabaqPages.length > 0 ? (
            dueQuran.sabaqPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.quranSabaqBg,
                    borderColor: colors.quranSabaq,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} • Juz {getJuzForPage(p.pageNumber)}
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)} • Pass with 0-1 mistakes to graduate to Sabqi
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    { backgroundColor: colors.quranSabaq },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Open Page</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              No page currently in Sabaq. Assign any Mushaf page (1-604) below.
            </Text>
          )}
        </View>

        {/* 2. Sabqi Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranSabqi }]}>
            2. SABQI (RECENT {state.sabqiWindowDays}-DAY CONSOLIDATION)
          </Text>
          {dueQuran.sabqiPages.length > 0 ? (
            dueQuran.sabqiPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.quranSabqiBg,
                    borderColor: colors.quranSabqi,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} • Day {p.sabqiDaysCompleted} of {p.sabqiTargetDays}
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)}
                    {p.flaggedAyahKeys.length > 0
                      ? ` • Watch Ayah ${p.flaggedAyahKeys.join(', ')}`
                      : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    { backgroundColor: colors.quranSabqi },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Recite</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              All Sabqi consolidation pages for today are complete.
            </Text>
          )}
        </View>

        {/* 3. Manzil Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranManzil }]}>
            3. MANZIL (DUE FSRS LONG-TERM REVISION)
          </Text>
          {dueQuran.manzilPages.length > 0 ? (
            dueQuran.manzilPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/quran/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.quranManzilBg,
                    borderColor: colors.quranManzil,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} • Stability {p.stability}d
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)} • Difficulty {p.difficulty.toFixed(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    { backgroundColor: colors.quranManzil },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Test Page</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              No Manzil pages due right now.
            </Text>
          )}
        </View>
      </View>

      {/* Direct Mushaf Page Navigator (Pages 1-604) & Sabaq Starter */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Open or Assign Any Mushaf Page (1-604)
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Standard 15-Line Madani Mushaf. Enter any page number or pick a bookmark below.
        </Text>

        <View style={styles.jumpRow}>
          <TextInput
            value={jumpPageInput}
            onChangeText={(txt) => {
              setPageInputError(null);
              setJumpPageInput(txt);
            }}
            keyboardType="number-pad"
            placeholder="Page (1-604)"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.pageInput,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.borderStrong,
                color: colors.textPrimary,
              },
            ]}
          />
          <Pressable
            onPress={() => handleOpenOrAssignPage(false)}
            accessibilityRole="button"
            style={[
              styles.openBtn,
              { backgroundColor: colors.textPrimary },
            ]}
          >
            <Text style={[styles.openBtnText, { color: colors.bgPrimary }]}>
              Read Page
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleOpenOrAssignPage(true)}
            accessibilityRole="button"
            style={[
              styles.assignSabaqBtn,
              { backgroundColor: colors.quranSabaq },
            ]}
          >
            <Text style={styles.assignSabaqBtnText}>Set as Sabaq</Text>
          </Pressable>
        </View>

        {pageInputError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {pageInputError}
          </Text>
        ) : null}

        {/* Quick Bookmarks */}
        <View style={styles.bookmarkGrid}>
          {[
            { page: 1, label: 'P. 1 • Al-Fatihah' },
            { page: 2, label: 'P. 2 • Al-Baqarah 1-5' },
            { page: 293, label: 'P. 293 • Al-Kahf' },
            { page: 562, label: 'P. 562 • Al-Mulk' },
            { page: 582, label: 'P. 582 • An-Naba' },
            { page: 602, label: 'P. 602 • Al-Kafirun' },
            { page: 604, label: 'P. 604 • Al-Ikhlas/Nas' },
          ].map((bm) => (
            <Pressable
              key={bm.page}
              onPress={() => router.push(`/quran/page/${bm.page}`)}
              accessibilityRole="button"
              style={[
                styles.bookmarkChip,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bookmarkChipText, { color: colors.textPrimary }]}>
                {bm.label}
              </Text>
            </Pressable>
          ))}
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
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  summaryBox: {
    flex: 1,
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 3,
  },
  summaryCount: {
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11,
    fontWeight: '600',
  },
  heatmapBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  heatmapLeft: {
    flex: 1,
    gap: 2,
  },
  heatmapTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  heatmapSub: {
    fontSize: 12,
  },
  heatmapBtn: {
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  stageGroup: {
    gap: 8,
  },
  stageHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  pageCardLeft: {
    flex: 1,
    gap: 2,
  },
  pageCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pageCardSub: {
    fontSize: 12,
  },
  actionBadge: {
    paddingHorizontal: 16,
    minHeight: 38,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyQueueText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  jumpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageInput: {
    width: 120,
    minHeight: 46,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  openBtn: {
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  assignSabaqBtn: {
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignSabaqBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bookmarkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookmarkChip: {
    paddingHorizontal: 14,
    minHeight: 38,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  bookmarkChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

