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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, GLYPH_SHADOW, PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
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
      setPageInputError('Enter a page number from 1 to 604.');
      return;
    }
    setPageInputError(null);
    if (assignAsSabaq) {
      await startSabaqPage(num);
    }
    router.push(`/mushaf/page/${num}`);
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
            CARD_EDGE,
            { backgroundColor: colors.quranSabaq },
          ]}
        >
          <Text style={[styles.summaryCount, GLYPH_SHADOW]}>
            {sabaqTotal}
          </Text>
          <Text style={styles.summaryLabel}>
            Sabaq
          </Text>
          <Text style={styles.summarySub}>
            New pages
          </Text>
        </View>

        <View
          style={[
            styles.summaryBox,
            CARD_EDGE,
            { backgroundColor: colors.quranSabqi },
          ]}
        >
          <Text style={[styles.summaryCount, GLYPH_SHADOW]}>
            {sabqiTotal}
          </Text>
          <Text style={styles.summaryLabel}>
            Sabqi
          </Text>
          <Text style={styles.summarySub}>
            Last {state.sabqiWindowDays} days
          </Text>
        </View>

        <View
          style={[
            styles.summaryBox,
            CARD_EDGE,
            { backgroundColor: colors.quranManzil },
          ]}
        >
          <Text style={[styles.summaryCount, GLYPH_SHADOW]}>
            {manzilTotal}
          </Text>
          <Text style={styles.summaryLabel}>
            Manzil
          </Text>
          <Text style={styles.summarySub}>
            Long-term
          </Text>
        </View>
      </View>

      {/* 604-Page Mastery Heatmap Callout */}
      <Pressable
        onPress={() => router.push('/mushaf/heatmap')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heatmapBanner,
          TILE_LIP,
          { backgroundColor: colors.bgSurface },
          pressed && PRESSED_BASE,
        ]}
      >
        <View style={styles.heatmapLeft}>
          <Text style={[styles.heatmapTitle, { color: colors.textPrimary }]}>
            Mushaf map
          </Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            All 604 pages by memorisation stage, grouped by juz
          </Text>
        </View>
        <View
          style={styles.heatmapBtn}
        >
          <Feather name="chevron-right" size={22} color={colors.ink} />
        </View>
      </Pressable>

      {/* Makhraj lookup: where each letter is pronounced */}
      <Pressable
        onPress={() => router.push('/mushaf/makharij')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heatmapBanner,
          TILE_LIP,
          { backgroundColor: colors.bgSurface },
          pressed && PRESSED_BASE,
        ]}
      >
        <View style={styles.heatmapLeft}>
          <Text style={[styles.heatmapTitle, { color: colors.textPrimary }]}>
            Makhraj · مخارج الحروف
          </Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            Where each letter is made: throat, tongue, lips and nose
          </Text>
        </View>
        <View style={styles.heatmapBtn}>
          <Feather name="chevron-right" size={22} color={colors.ink} />
        </View>
      </Pressable>

      {/* Automated Daily Lifecycle Queue: Sabaq -> Sabqi -> Manzil */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Today's pages
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          New pages start in Sabaq, are revised daily in Sabqi for {state.sabqiWindowDays} days, then move to spaced Manzil revision.
        </Text>

        {/* 1. Sabaq Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranSabaq }]}>
            Sabaq · new
          </Text>
          {dueQuran.sabaqPages.length > 0 ? (
            dueQuran.sabaqPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/mushaf/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} · Juz {getJuzForPage(p.pageNumber)}
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)} · pass with 0–1 mistakes to move to Sabqi
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    TILE_LIP,
                    { backgroundColor: colors.quranSabaq },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Recite</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              No Sabaq page yet. Pick one below.
            </Text>
          )}
        </View>

        {/* 2. Sabqi Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranSabqi }]}>
            Sabqi · recent
          </Text>
          {dueQuran.sabqiPages.length > 0 ? (
            dueQuran.sabqiPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/mushaf/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} · day {p.sabqiDaysCompleted} of {p.sabqiTargetDays}
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)}
                    {p.flaggedAyahKeys.length > 0
                      ? ` · watch ayah ${p.flaggedAyahKeys.join(', ')}`
                      : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    TILE_LIP,
                    { backgroundColor: colors.quranSabqi },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Test</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              Sabqi is done for today.
            </Text>
          )}
        </View>

        {/* 3. Manzil Section */}
        <View style={styles.stageGroup}>
          <Text style={[styles.stageHeading, { color: colors.quranManzil }]}>
            Manzil · long-term
          </Text>
          {dueQuran.manzilPages.length > 0 ? (
            dueQuran.manzilPages.map((p) => (
              <Pressable
                key={p.pageNumber}
                onPress={() => router.push(`/mushaf/page/${p.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.pageCardLeft}>
                  <Text style={[styles.pageCardTitle, { color: colors.textPrimary }]}>
                    Page {p.pageNumber} · {p.stability}d stability
                  </Text>
                  <Text style={[styles.pageCardSub, { color: colors.textSecondary }]}>
                    {getSurahSummaryForPage(p.pageNumber)} · difficulty {p.difficulty.toFixed(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.actionBadge,
                    TILE_LIP,
                    { backgroundColor: colors.quranManzil },
                  ]}
                >
                  <Text style={styles.actionBadgeText}>Revise</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
              No Manzil pages due.
            </Text>
          )}
        </View>
      </View>

      {/* Direct Mushaf Page Navigator (Pages 1-604) & Sabaq Starter */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Go to a page
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          15-line Madani Mushaf, pages 1–604.
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
                backgroundColor: colors.bgSurface,
                borderColor: colors.ink,
                color: colors.textPrimary,
              },
            ]}
          />
          <Pressable
            onPress={() => handleOpenOrAssignPage(false)}
            accessibilityRole="button"
            style={[
              styles.openBtn,
              { backgroundColor: colors.bgSurface, borderColor: colors.ink },
            ]}
          >
            <Text style={[styles.openBtnText, { color: colors.textPrimary }]}>
              Read
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleOpenOrAssignPage(true)}
            accessibilityRole="button"
            style={[
              styles.assignSabaqBtn,
              TILE_LIP,
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
            { page: 1, label: '1 · Al-Fatihah' },
            { page: 2, label: '2 · Al-Baqarah' },
            { page: 293, label: '293 · Al-Kahf' },
            { page: 562, label: '562 · Al-Mulk' },
            { page: 582, label: '582 · An-Naba' },
            { page: 602, label: '602 · Al-Kafirun' },
            { page: 604, label: '604 · Al-Ikhlas' },
          ].map((bm) => (
            <Pressable
              key={bm.page}
              onPress={() => router.push(`/mushaf/page/${bm.page}`)}
              accessibilityRole="button"
              style={[
                styles.bookmarkChip,
                { backgroundColor: colors.bgSurface, borderColor: colors.ink },
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
    borderWidth: 2,
    gap: 3,
  },
  summaryCount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summarySub: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heatmapBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 2,
    gap: SPACING.sm,
  },
  heatmapLeft: {
    flex: 1,
    gap: 2,
  },
  heatmapTitle: {
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: RADII.lg,
    borderWidth: 2,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  stageGroup: {
    gap: 2,
  },
  stageHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  pageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  pageCardLeft: {
    flex: 1,
    gap: 2,
  },
  pageCardTitle: {
    fontSize: 15,
    fontWeight: '900',
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
    fontWeight: '700',
  },
  emptyQueueText: {
    fontSize: 13,
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
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  openBtn: {
    borderWidth: 2,
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '700',
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
    borderWidth: 2,
    justifyContent: 'center',
  },
  bookmarkChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

