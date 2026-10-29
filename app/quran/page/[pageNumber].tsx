import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../../src/theme/tokens';
import {
  fetchMushafPageFromQuranApi,
  MushafPageData,
  SEEDED_MUSHAF_PAGES,
} from '../../../src/data/quran-seed';
import { useLearningStore } from '../../../src/store/useLearningStore';
import { mistakesToFSRSGrade } from '../../../src/lib/srs-fsrs';

type HideMode = 'none' | 'first_word_cue' | 'hide_all';

export default function MushafPageReaderScreen() {
  const { pageNumber } = useLocalSearchParams<{ pageNumber: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const pageNum = Math.min(604, Math.max(1, parseInt(pageNumber || '1', 10) || 1));

  const pageProgress = useLearningStore((s) => s.quranProgress[pageNum]);
  const submitRecitation = useLearningStore((s) => s.submitQuranPageRecitation);
  const startSabaqPage = useLearningStore((s) => s.startQuranSabaqPage);

  const [pageData, setPageData] = useState<MushafPageData | null>(
    SEEDED_MUSHAF_PAGES[pageNum] || null
  );
  const [loading, setLoading] = useState<boolean>(!SEEDED_MUSHAF_PAGES[pageNum]);
  const [error, setError] = useState<string | null>(null);

  const [hideMode, setHideMode] = useState<HideMode>('none');
  const [revealedWordIds, setRevealedWordIds] = useState<Set<string>>(new Set());
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [flaggedAyahs, setFlaggedAyahs] = useState<Set<string>>(new Set());
  const [showTranslations, setShowTranslations] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRevealedWordIds(new Set());
    setMistakesCount(0);
    setFlaggedAyahs(new Set());
    setCompletionMessage(null);

    if (SEEDED_MUSHAF_PAGES[pageNum]) {
      setPageData(SEEDED_MUSHAF_PAGES[pageNum]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchMushafPageFromQuranApi(pageNum)
      .then((res) => {
        if (active) {
          setPageData(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(
            err?.message ||
              `Could not fetch Mushaf page ${pageNum}. Check your internet connection.`
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pageNum]);

  const handleTapWord = (wordId: string, ayahKey: string, isHidden: boolean) => {
    if (!isHidden) return;
    const nextRevealed = new Set(revealedWordIds);
    nextRevealed.add(wordId);
    setRevealedWordIds(nextRevealed);

    // Every peek during Hide-Mode counts as a hesitation and flags the Ayah for review
    setMistakesCount((m) => m + 1);
    const nextFlagged = new Set(flaggedAyahs);
    nextFlagged.add(ayahKey);
    setFlaggedAyahs(nextFlagged);
  };

  const handleFinishPageRecitation = async () => {
    const updated = await submitRecitation(
      pageNum,
      mistakesCount,
      Array.from(flaggedAyahs)
    );
    const grade = mistakesToFSRSGrade(mistakesCount);
    const gradeLabel =
      grade === 4
        ? 'Flawless (Easy)'
        : grade === 3
        ? 'Solid (Good)'
        : grade === 2
        ? 'Hesitant (Hard)'
        : 'Needs Consolidation (Again)';

    setCompletionMessage(
      `Saved Page ${pageNum} (${gradeLabel}). Stage is now ${updated.stage.toUpperCase()} (Stability: ${updated.stability}d).`
    );
  };

  const currentStage = pageProgress?.stage || 'unstarted';
  const gradePreview = mistakesToFSRSGrade(mistakesCount);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Page Navigation Bar */}
      <View
        style={[
          styles.pageNavRow,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Pressable
          disabled={pageNum <= 1}
          onPress={() => router.replace(`/quran/page/${pageNum - 1}`)}
          accessibilityRole="button"
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.bgMuted,
              borderColor: colors.border,
              opacity: pageNum <= 1 ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>
            Prev Page
          </Text>
        </Pressable>

        <View style={styles.pageCenterMeta}>
          <Text style={[styles.pageTitleText, { color: colors.textPrimary }]}>
            Mushaf Page {pageNum} of 604
          </Text>
          <Text style={[styles.pageSubText, { color: colors.textSecondary }]}>
            {pageData
              ? `Juz ${pageData.juz} • Hizb ${pageData.hizb} • ${pageData.surahSummary}`
              : `Juz • Page ${pageNum}`}
          </Text>
        </View>

        <Pressable
          disabled={pageNum >= 604}
          onPress={() => router.replace(`/quran/page/${pageNum + 1}`)}
          accessibilityRole="button"
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.bgMuted,
              borderColor: colors.border,
              opacity: pageNum >= 604 ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>
            Next Page
          </Text>
        </Pressable>
      </View>

      {/* Hide-Mode Controls for Self-Testing */}
      <View
        style={[
          styles.controlsCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.controlsTopRow}>
          <Text style={[styles.controlsHeading, { color: colors.textPrimary }]}>
            Hide-Mode Recall Test
          </Text>
          <View
            style={[
              styles.stageChip,
              {
                backgroundColor:
                  currentStage === 'sabaq'
                    ? colors.quranSabaqBg
                    : currentStage === 'sabqi'
                    ? colors.quranSabqiBg
                    : currentStage === 'manzil'
                    ? colors.quranManzilBg
                    : colors.bgMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.stageChipText,
                {
                  color:
                    currentStage === 'sabaq'
                      ? colors.quranSabaq
                      : currentStage === 'sabqi'
                      ? colors.quranSabqi
                      : currentStage === 'manzil'
                      ? colors.quranManzil
                      : colors.textSecondary,
                },
              ]}
            >
              STAGE: {currentStage.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.hideModeButtonRow}>
          {(
            [
              { key: 'none', label: 'Full View' },
              { key: 'first_word_cue', label: 'First-Word Cue' },
              { key: 'hide_all', label: 'Hide All (Tap to Peek)' },
            ] as const
          ).map((mode) => {
            const active = hideMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => {
                  setHideMode(mode.key);
                  setRevealedWordIds(new Set());
                }}
                accessibilityRole="button"
                style={[
                  styles.hideModeBtn,
                  {
                    backgroundColor: active
                      ? colors.quranSabaq
                      : colors.bgMuted,
                    borderColor: active ? colors.quranSabaq : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hideModeBtnText,
                    { color: active ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Authentic 15-Line Madani Mushaf Page Frame */}
      {loading ? (
        <View
          style={[
            styles.stateCard,
            { backgroundColor: colors.mushafPaper, borderColor: colors.mushafBorder },
          ]}
        >
          <ActivityIndicator size="large" color={colors.quranSabaq} />
          <Text style={[styles.stateText, { color: colors.textPrimary }]}>
            Loading 15-line Uthmani Mushaf Page {pageNum}...
          </Text>
        </View>
      ) : error ? (
        <View
          style={[
            styles.stateCard,
            { backgroundColor: colors.dangerBg, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.stateErrorTitle, { color: colors.danger }]}>
            Could Not Load Mushaf Page {pageNum}
          </Text>
          <Text style={[styles.stateText, { color: colors.textPrimary }]}>
            {error}
          </Text>
          <Pressable
            onPress={() => router.replace(`/quran/page/1`)}
            accessibilityRole="button"
            style={[
              styles.retryBtn,
              { backgroundColor: colors.quranSabaq },
            ]}
          >
            <Text style={styles.retryBtnText}>Open Offline Seeded Page 1</Text>
          </Pressable>
        </View>
      ) : pageData ? (
        <View
          style={[
            styles.mushafFrame,
            {
              backgroundColor: colors.mushafPaper,
              borderColor: colors.mushafBorder,
            },
          ]}
        >
          {pageData.lines.map((line) => {
            if (line.lineType === 'surah_header') {
              return (
                <View
                  key={line.lineNumber}
                  style={[
                    styles.surahBanner,
                    {
                      backgroundColor: colors.bgMuted,
                      borderColor: colors.mushafBorder,
                    },
                  ]}
                >
                  <Text style={[styles.surahArabicTitle, { color: colors.textPrimary }]}>
                    {line.surahNameArabic}
                  </Text>
                  <Text style={[styles.surahLatinTitle, { color: colors.textSecondary }]}>
                    {line.surahNameLatin}
                  </Text>
                </View>
              );
            }

            if (line.lineType === 'bismillah') {
              return (
                <View key={line.lineNumber} style={styles.bismillahRow}>
                  <Text style={[styles.bismillahText, { color: colors.textPrimary }]}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </Text>
                </View>
              );
            }

            return (
              <View
                key={line.lineNumber}
                style={[
                  styles.mushafLineRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.lineNumBadge, { color: colors.textMuted }]}>
                  {line.lineNumber}
                </Text>

                <View style={styles.arabicWordsFlow}>
                  {line.words.map((word) => {
                    const isRevealed = revealedWordIds.has(word.id);
                    const isMasked =
                      !word.isEndMarker &&
                      !isRevealed &&
                      (hideMode === 'hide_all' ||
                        (hideMode === 'first_word_cue' && word.wordIndex > 1));

                    const wasPreviouslyFlagged =
                      pageProgress?.flaggedAyahKeys?.includes(word.ayahKey) ||
                      flaggedAyahs.has(word.ayahKey);

                    return (
                      <Pressable
                        key={word.id}
                        onPress={() =>
                          handleTapWord(word.id, word.ayahKey, isMasked)
                        }
                        accessibilityRole="button"
                        style={[
                          styles.wordCell,
                          isMasked && {
                            backgroundColor: colors.bgMuted,
                            borderColor: colors.borderStrong,
                            borderWidth: 1,
                          },
                          !isMasked &&
                            wasPreviouslyFlagged &&
                            !word.isEndMarker && {
                              borderBottomColor: colors.warning,
                              borderBottomWidth: 2,
                            },
                        ]}
                      >
                        <Text
                          style={[
                            word.isEndMarker
                              ? styles.ayahEndMarkerText
                              : styles.uthmaniWordText,
                            {
                              color: isMasked
                                ? 'transparent'
                                : word.isEndMarker
                                ? colors.quranSabaq
                                : colors.textPrimary,
                            },
                          ]}
                        >
                          {word.textUthmani}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Recitation Grading & Lifecycle Transition Bar */}
      <View
        style={[
          styles.gradingCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.mistakeCounterRow}>
          <View>
            <Text style={[styles.gradingTitle, { color: colors.textPrimary }]}>
              Peeks & Hesitations on Page {pageNum}: {mistakesCount}
            </Text>
            <Text style={[styles.gradingSub, { color: colors.textSecondary }]}>
              FSRS Rating: {gradePreview === 4 ? 'Easy (0 mistakes)' : gradePreview === 3 ? 'Good (1-2 peeks)' : gradePreview === 2 ? 'Hard (3-4 mistakes)' : 'Again (5+ mistakes)'}
            </Text>
          </View>

          <View style={styles.counterBtns}>
            <Pressable
              onPress={() => setMistakesCount((m) => Math.max(0, m - 1))}
              accessibilityRole="button"
              style={[
                styles.stepBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>
                -1
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMistakesCount((m) => m + 1)}
              accessibilityRole="button"
              style={[
                styles.stepBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>
                +1 Mistake
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.submitRow}>
          {currentStage === 'unstarted' ? (
            <Pressable
              onPress={() => startSabaqPage(pageNum)}
              accessibilityRole="button"
              style={[
                styles.secondaryActionBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.quranSabaq },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: colors.quranSabaq }]}>
                Assign as Sabaq
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleFinishPageRecitation}
            accessibilityRole="button"
            style={[
              styles.completeRecitationBtn,
              { backgroundColor: colors.quranSabaq },
            ]}
          >
            <Text style={styles.completeRecitationBtnText}>
              Record Page Recitation & Schedule Next Review
            </Text>
          </Pressable>
        </View>

        {completionMessage ? (
          <View
            style={[
              styles.completionBanner,
              { backgroundColor: colors.successBg, borderColor: colors.success },
            ]}
          >
            <Text style={[styles.completionText, { color: colors.success }]}>
              {completionMessage}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Expandable Translations Sheet (Indonesian Kemenag & English Saheeh) */}
      {pageData && pageData.translations.length > 0 ? (
        <View
          style={[
            styles.translationCard,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => setShowTranslations((v) => !v)}
            accessibilityRole="button"
            style={styles.translationToggleHeader}
          >
            <Text style={[styles.controlsHeading, { color: colors.textPrimary }]}>
              Ayah Translations (Indonesian & English)
            </Text>
            <Text style={[styles.toggleLinkText, { color: colors.quranManzil }]}>
              {showTranslations ? 'Hide Translations' : 'Show Translations'}
            </Text>
          </Pressable>

          {showTranslations ? (
            <View style={styles.translationList}>
              {pageData.translations.map((tr) => (
                <View
                  key={tr.ayahKey}
                  style={[
                    styles.translationItem,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.trAyahKey, { color: colors.quranSabaq }]}>
                    {tr.surahName} ({tr.ayahKey})
                  </Text>
                  <Text style={[styles.trArabic, { color: colors.textPrimary }]}>
                    {tr.arabicText}
                  </Text>
                  {tr.translationId ? (
                    <Text style={[styles.trId, { color: colors.textPrimary }]}>
                      ID: {tr.translationId}
                    </Text>
                  ) : null}
                  {tr.translationEn ? (
                    <Text style={[styles.trEn, { color: colors.textSecondary }]}>
                      EN: {tr.translationEn}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
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
  pageNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pageCenterMeta: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pageTitleText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pageSubText: {
    fontSize: 11,
    textAlign: 'center',
  },
  controlsCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  controlsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  hideModeButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hideModeBtn: {
    flex: 1,
    minWidth: 100,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hideModeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateCard: {
    minHeight: 220,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stateErrorTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    minHeight: 46,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  mushafFrame: {
    borderRadius: 28,
    borderWidth: 2,
    padding: SPACING.md,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  surahBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  surahArabicTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  surahLatinTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  bismillahRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 24,
    fontWeight: '700',
  },
  mushafLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  lineNumBadge: {
    width: 22,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  arabicWordsFlow: {
    flex: 1,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  wordCell: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  uthmaniWordText: {
    fontSize: 25,
    lineHeight: 42,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  ayahEndMarkerText: {
    fontSize: 20,
    lineHeight: 38,
    fontWeight: '800',
  },
  gradingCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  mistakeCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gradingTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gradingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  counterBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  submitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  secondaryActionBtn: {
    paddingHorizontal: 20,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  completeRecitationBtn: {
    flex: 1,
    minWidth: 220,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeRecitationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  completionBanner: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  translationCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  translationToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  toggleLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  translationList: {
    gap: SPACING.md,
    marginTop: 4,
  },
  translationItem: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: 4,
  },
  trAyahKey: {
    fontSize: 12,
    fontWeight: '800',
  },
  trArabic: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'right',
  },
  trId: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  trEn: {
    fontSize: 13,
    lineHeight: 19,
  },
});

