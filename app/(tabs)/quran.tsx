import React, { useMemo, useState } from 'react';
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
import { SURAHS } from '../../src/data/surahs';
import { selectDueWords, selectWordLessons, selectWordLevel, useQuranWords } from '../../src/store/useQuranWords';

// "Al-Baqarah" -> "albaqarah", so "baqarah" or "al baqara" both match.
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function QuranHafalanHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const startSabaqPage = useLearningStore((s) => s.startQuranSabaqPage);

  const [jumpPageInput, setJumpPageInput] = useState('582');
  const [pageInputError, setPageInputError] = useState<string | null>(null);
  const [surahQuery, setSurahQuery] = useState('');
  const [showAllSurahs, setShowAllSurahs] = useState(false);

  const surahMatches = useMemo(() => {
    const all = SURAHS.map((s, i) => ({ ...s, number: i + 1 }));
    const q = squash(surahQuery);
    if (!q) return all;
    return all.filter((s) => (/^[0-9]+$/.test(q) ? String(s.number) === q : squash(s.name).includes(q)));
  }, [surahQuery]);
  const surahList = surahQuery || showAllSurahs ? surahMatches : surahMatches.slice(0, 8);

  const dueQuran = selectDueQuranPages(state);
  const wordProgress = useQuranWords((s) => s.progress);
  const wordsDue = selectDueWords(wordProgress).length;
  const wordsLessons = selectWordLessons(wordProgress).length;
  const wordsLevel = selectWordLevel(wordProgress);
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

      {/* Ayah by prayer: 3 ayah before and 3 after each of the five prayers */}
      <Pressable
        onPress={() => router.push('/mushaf/prayer')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heatmapBanner,
          TILE_LIP,
          { backgroundColor: colors.bgSurface },
          pressed && PRESSED_BASE,
        ]}
      >
        <View style={styles.heatmapLeft}>
          <Text style={[styles.heatmapTitle, { color: colors.textPrimary }]}>Ayah by prayer</Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            3 new ayah before each prayer and 3 after, 30 a day
          </Text>
        </View>
        <View style={styles.heatmapBtn}>
          <Feather name="chevron-right" size={22} color={colors.ink} />
        </View>
      </Pressable>

      {/* Quran words: vocabulary SRS, most frequent words first */}
      <Pressable
        onPress={() => router.push('/qwords')}
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
            Quran words · level {wordsLevel}
          </Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            {wordsDue > 0 || wordsLessons > 0
              ? `${wordsDue} reviews · ${wordsLessons} lessons. Most common words first.`
              : 'Learn the words of the Quran, most common first.'}
          </Text>
        </View>
        <View style={styles.heatmapBtn}>
          <Feather name="chevron-right" size={22} color={colors.ink} />
        </View>
      </Pressable>

      {/* Tajweed lookup: every rule with an example */}
      <Pressable
        onPress={() => router.push('/mushaf/tajweed')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heatmapBanner,
          TILE_LIP,
          { backgroundColor: colors.bgSurface },
          pressed && PRESSED_BASE,
        ]}
      >
        <View style={styles.heatmapLeft}>
          <Text style={[styles.heatmapTitle, { color: colors.textPrimary }]}>Tajweed · التجويد</Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            Izhar, ikhfa, idgham, qalqalah, mad and more, with examples
          </Text>
        </View>
        <View style={styles.heatmapBtn}>
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

      {/* Arabic numbers: the digits used for pages and ayat */}
      <Pressable
        onPress={() => router.push('/mushaf/numbers')}
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
            Arabic numbers · ١٢٣
          </Text>
          <Text style={[styles.heatmapSub, { color: colors.textSecondary }]}>
            The digits the Mushaf uses for pages and ayat, with their names
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
      {/* Read: find a surah and read it with tajweed colours and meaning */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Read</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Find a surah and read it ayah by ayah. Turn tajweed colours and the Indonesian meaning on or off as you read.
        </Text>
        <View style={[styles.searchBox, { borderColor: colors.ink, backgroundColor: colors.bgSurface }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={surahQuery}
            onChangeText={setSurahQuery}
            placeholder="Surah name or number"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (surahMatches.length === 1) router.push(`/mushaf/surah/${surahMatches[0].number}`);
            }}
            accessibilityLabel="Find a surah"
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {surahQuery ? (
            <Pressable onPress={() => setSurahQuery('')} accessibilityRole="button" accessibilityLabel="Clear" hitSlop={10}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View>
          {surahList.map((s) => (
            <Pressable
              key={s.number}
              onPress={() => router.push(`/mushaf/surah/${s.number}`)}
              accessibilityRole="button"
              accessibilityLabel={`Read surah ${s.number}, ${s.name}`}
              style={({ pressed }) => [
                styles.surahRow,
                { borderColor: colors.border },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.surahNum, { color: colors.textMuted }]}>{s.number}</Text>
              <Text style={[styles.surahRowName, { color: colors.textPrimary }]} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={[styles.surahRowMeta, { color: colors.textSecondary }]}>{s.ayahs} ayah</Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
          {surahList.length === 0 ? (
            <Text style={[styles.emptyQueueText, { color: colors.textMuted, paddingTop: 4 }]}>
              No surah matches “{surahQuery}”.
            </Text>
          ) : null}
        </View>
        {!surahQuery ? (
          <Pressable
            onPress={() => setShowAllSurahs((v) => !v)}
            accessibilityRole="button"
            hitSlop={6}
            style={styles.showAll}
          >
            <Text style={[styles.openBtnText, { color: colors.indigo }]}>
              {showAllSurahs ? 'Show fewer' : 'Show all 114 surahs'}
            </Text>
            <Feather name={showAllSurahs ? 'chevron-up' : 'chevron-down'} size={16} color={colors.indigo} />
          </Pressable>
        ) : null}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderWidth: 2,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 16, minHeight: 44 },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    borderTopWidth: 1,
  },
  surahNum: { width: 28, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  surahRowName: { flex: 1, fontSize: 15, fontWeight: '700' },
  surahRowMeta: { fontSize: 12, fontVariant: ['tabular-nums'] },
  showAll: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, alignSelf: 'flex-start' },
  bookmarkChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

