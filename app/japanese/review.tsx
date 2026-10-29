import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  selectDueJapaneseReviews,
  useLearningStore,
} from '../../src/store/useLearningStore';
import {
  checkEnglishMeaning,
  checkJapaneseReading,
  convertRomajiToHiraganaLive,
  finalizeKanaInput,
} from '../../src/lib/romaji-kana';
import { JPSubject, UserJPMinedCard } from '../../src/data/jp-seed';

interface ReviewPromptTask {
  key: string;
  subjectId: string;
  isMined: boolean;
  promptType: 'meaning' | 'reading' | 'cloze';
  kind: 'radical' | 'kanji' | 'vocab' | 'grammar';
  characters: string;
  meanings: string[];
  readings: string[];
  mnemonic: string;
  readingMnemonic?: string;
  pitchAccent?: string;
  grammarStructure?: string;
  clozePrompt?: JPSubject['clozePrompt'];
  contextSentence?: { ja: string; en: string };
}

export default function JapaneseTypedReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const submitReview = useLearningStore((s) => s.submitJPReviewOutcome);

  const initialTasks = useMemo(() => {
    const due = selectDueJapaneseReviews(state);
    const list: ReviewPromptTask[] = [];

    for (const subj of due.subjects) {
      if (subj.kind === 'grammar' && subj.clozePrompt) {
        list.push({
          key: `${subj.id}-cloze`,
          subjectId: subj.id,
          isMined: false,
          promptType: 'cloze',
          kind: 'grammar',
          characters: subj.characters,
          meanings: subj.meanings,
          readings: subj.clozePrompt.acceptedInputs,
          mnemonic: subj.mnemonic,
          grammarStructure: subj.grammarStructure,
          clozePrompt: subj.clozePrompt,
        });
      } else {
        // Meaning task
        list.push({
          key: `${subj.id}-meaning`,
          subjectId: subj.id,
          isMined: false,
          promptType: 'meaning',
          kind: subj.kind,
          characters: subj.characters,
          meanings: subj.meanings,
          readings: subj.readings,
          mnemonic: subj.mnemonic,
          readingMnemonic: subj.readingMnemonic,
          pitchAccent: subj.pitchAccent,
          contextSentence: subj.contextSentences[0]
            ? { ja: subj.contextSentences[0].ja, en: subj.contextSentences[0].en }
            : undefined,
        });
        // Reading task for Kanji & Vocab
        if (subj.readings.length > 0) {
          list.push({
            key: `${subj.id}-reading`,
            subjectId: subj.id,
            isMined: false,
            promptType: 'reading',
            kind: subj.kind,
            characters: subj.characters,
            meanings: subj.meanings,
            readings: subj.readings,
            mnemonic: subj.mnemonic,
            readingMnemonic: subj.readingMnemonic,
            pitchAccent: subj.pitchAccent,
            contextSentence: subj.contextSentences[0]
              ? { ja: subj.contextSentences[0].ja, en: subj.contextSentences[0].en }
              : undefined,
          });
        }
      }
    }

    for (const mined of due.minedCards) {
      list.push({
        key: `${mined.id}-meaning`,
        subjectId: mined.id,
        isMined: true,
        promptType: 'meaning',
        kind: 'vocab',
        characters: mined.characters,
        meanings: [mined.meaning],
        readings: [mined.reading],
        mnemonic: `Mined from reading passage: ${mined.contextSentenceJa}`,
        contextSentence: {
          ja: mined.contextSentenceJa,
          en: mined.contextSentenceEn,
        },
      });
      list.push({
        key: `${mined.id}-reading`,
        subjectId: mined.id,
        isMined: true,
        promptType: 'reading',
        kind: 'vocab',
        characters: mined.characters,
        meanings: [mined.meaning],
        readings: [mined.reading],
        mnemonic: `Mined from reading passage: ${mined.contextSentenceJa}`,
        contextSentence: {
          ja: mined.contextSentenceJa,
          en: mined.contextSentenceEn,
        },
      });
    }

    return list;
    // Freeze initial queue on mount of the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [queue, setQueue] = useState<ReviewPromptTask[]>(initialTasks);
  const [completedTaskKeys, setCompletedTaskKeys] = useState<Set<string>>(new Set());
  const [subjectMistakeMap, setSubjectMistakeMap] = useState<Record<string, number>>({});
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'incorrect';
    message: string;
    stageChange?: string;
    unlockedItems?: string[];
  } | null>(null);
  const [showItemInfo, setShowItemInfo] = useState(false);

  const currentTask = queue[0];
  const totalInitialCount = initialTasks.length;
  const completedCount = completedTaskKeys.size;

  if (!currentTask) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bgPrimary }]}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryHeadline, { color: colors.textPrimary }]}>
            Review Session Complete
          </Text>
          <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>
            {totalInitialCount > 0
              ? `You completed all ${totalInitialCount} typed review prompts in this batch.`
              : 'There are no Japanese items due for review right now. Check back at the next hour mark or start a new lesson batch.'}
          </Text>

          <View style={styles.summaryBtnRow}>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.jpVocab },
              ]}
            >
              <Text style={styles.primaryBtnText}>Return to Today's Queue</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/japanese/lessons')}
              accessibilityRole="button"
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                Open Lessons
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const isKanaPrompt =
    currentTask.promptType === 'reading' || currentTask.promptType === 'cloze';

  const handleTextChange = (text: string) => {
    if (feedback) return;
    if (isKanaPrompt) {
      setInputValue(convertRomajiToHiraganaLive(text));
    } else {
      setInputValue(text);
    }
  };

  const handleSubmitOrNext = async () => {
    // If already graded, advance to next item in queue
    if (feedback) {
      setFeedback(null);
      setInputValue('');
      setShowItemInfo(false);
      if (feedback.status === 'correct') {
        setQueue((prev) => prev.slice(1));
      } else {
        // Re-append incorrect prompt to the end of the active queue (WaniKani style)
        setQueue((prev) => [...prev.slice(1), prev[0]]);
      }
      return;
    }

    const rawTrimmed = inputValue.trim();
    if (!rawTrimmed) return;

    const check = isKanaPrompt
      ? checkJapaneseReading(rawTrimmed, currentTask.readings)
      : checkEnglishMeaning(rawTrimmed, currentTask.meanings);

    if (isKanaPrompt) {
      setInputValue(finalizeKanaInput(rawTrimmed));
    }

    if (check.isCorrect) {
      const nextCompleted = new Set(completedTaskKeys);
      nextCompleted.add(currentTask.key);
      setCompletedTaskKeys(nextCompleted);

      // Check if all prompts for this subjectId are now completed
      const remainingForSubject = queue
        .slice(1)
        .some((t) => t.subjectId === currentTask.subjectId);

      let stageSummary: string | undefined;
      let unlockedNames: string[] = [];

      if (!remainingForSubject) {
        const mistakes = subjectMistakeMap[currentTask.subjectId] || 0;
        const outcome = await submitReview(
          currentTask.subjectId,
          mistakes,
          currentTask.isMined
        );
        stageSummary = `${outcome.previousStageName} -> ${outcome.newStageName}`;
        if (outcome.newlyUnlockedIds.length > 0) {
          unlockedNames = outcome.newlyUnlockedIds.map((id) => {
            const s = state.jpSubjects.find((item) => item.id === id);
            return s ? `${s.characters} (${s.meanings[0]})` : id;
          });
        }
      }

      setFeedback({
        status: 'correct',
        message: check.isSlightlyOff
          ? `Accepted (minor typo). Exact answer: ${currentTask.meanings.join(', ')}`
          : isKanaPrompt
          ? `Correct reading: ${currentTask.readings.join(' • ')}`
          : `Correct meaning: ${currentTask.meanings.join(', ')}`,
        stageChange: stageSummary,
        unlockedItems: unlockedNames,
      });
    } else {
      const prevMistakes = subjectMistakeMap[currentTask.subjectId] || 0;
      setSubjectMistakeMap({
        ...subjectMistakeMap,
        [currentTask.subjectId]: prevMistakes + 1,
      });
      setShowItemInfo(true);
      setFeedback({
        status: 'incorrect',
        message: isKanaPrompt
          ? `Expected reading: ${currentTask.readings.join(' • ')}`
          : `Expected meaning: ${currentTask.meanings.join(', ')}`,
      });
    }
  };

  const getBannerColor = () => {
    switch (currentTask.kind) {
      case 'radical':
        return colors.jpRadical;
      case 'kanji':
        return colors.jpKanji;
      case 'vocab':
        return colors.jpVocab;
      case 'grammar':
        return colors.jpGrammar;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Progress Bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressTextRow}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Completed {completedCount} of {totalInitialCount} Prompts
          </Text>
          <View style={[styles.remainingBadge, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Text style={[styles.remainingLabel, { color: colors.textPrimary }]}>
              {queue.length} left
            </Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.bgMuted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.jpVocab,
                width: `${totalInitialCount > 0 ? Math.min(100, Math.round((completedCount / totalInitialCount) * 100)) : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Main Prompt Stage Banner */}
      <View
        style={[
          styles.promptBanner,
          { backgroundColor: getBannerColor() },
        ]}
      >
        <View style={styles.kindTagWrap}>
          <Text style={styles.kindTag}>
            {currentTask.kind.toUpperCase()}
            {currentTask.isMined ? ' • MINED CARD' : ''}
          </Text>
        </View>

        {currentTask.promptType === 'cloze' && currentTask.clozePrompt ? (
          <View style={styles.clozePromptWrap}>
            <Text style={styles.clozeSentenceText}>
              {currentTask.clozePrompt.sentenceBefore}
              <Text style={styles.clozeBlankHighlight}> [ ＿＿＿ ] </Text>
              {currentTask.clozePrompt.sentenceAfter}
            </Text>
            <Text style={styles.clozeNuanceText}>
              Hint: {currentTask.clozePrompt.nuanceHint}
            </Text>
            <Text style={styles.clozeTranslationText}>
              "{currentTask.clozePrompt.fullTranslation}"
            </Text>
          </View>
        ) : (
          <Text style={styles.mainCharacters}>{currentTask.characters}</Text>
        )}
      </View>

      {/* Prompt Type Bar (Black/Dark bar for Reading, Light bar for Meaning, just like WaniKani) */}
      <View
        style={[
          styles.questionTypeBar,
          {
            backgroundColor: isKanaPrompt ? '#18181B' : colors.bgMuted,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.questionTypeText,
            { color: isKanaPrompt ? '#FAF7F2' : colors.textPrimary },
          ]}
        >
          {currentTask.promptType === 'meaning'
            ? `${currentTask.kind.toUpperCase()} MEANING (ENGLISH)`
            : currentTask.promptType === 'cloze'
            ? 'GRAMMAR CLOZE INPUT (TYPE ROMAJI -> KANA)'
            : `${currentTask.kind.toUpperCase()} READING (TYPE ROMAJI -> KANA)`}
        </Text>
      </View>

      {/* Strict Typed Input Field */}
      <View style={styles.inputRow}>
        <TextInput
          value={inputValue}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmitOrNext}
          placeholder={
            isKanaPrompt
              ? 'Type romaji (e.g. hito -> ひと)...'
              : 'Type English meaning...'
          }
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.answerInput,
            {
              backgroundColor:
                feedback?.status === 'correct'
                  ? colors.successBg
                  : feedback?.status === 'incorrect'
                  ? colors.dangerBg
                  : colors.bgSurface,
              borderColor:
                feedback?.status === 'correct'
                  ? colors.success
                  : feedback?.status === 'incorrect'
                  ? colors.danger
                  : colors.borderStrong,
              color: colors.textPrimary,
            },
          ]}
        />
        <Pressable
          onPress={handleSubmitOrNext}
          accessibilityRole="button"
          style={[
            styles.submitBtn,
            {
              backgroundColor: feedback
                ? colors.textPrimary
                : colors.jpVocab,
            },
          ]}
        >
          <Text
            style={[
              styles.submitBtnText,
              { color: feedback ? colors.bgPrimary : '#FFFFFF' },
            ]}
          >
            {feedback ? 'Next' : 'Check'}
          </Text>
        </Pressable>
      </View>

      {/* Answer Feedback & Stage Transition Banner */}
      {feedback ? (
        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor:
                feedback.status === 'correct'
                  ? colors.successBg
                  : colors.dangerBg,
              borderColor:
                feedback.status === 'correct' ? colors.success : colors.danger,
            },
          ]}
        >
          <View style={styles.feedbackTopRow}>
            <Text
              style={[
                styles.feedbackStatusText,
                {
                  color:
                    feedback.status === 'correct'
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              {feedback.status === 'correct' ? 'PASS' : 'NEEDS RETRY'}
            </Text>
            {feedback.stageChange ? (
              <Text style={[styles.stagePillText, { color: colors.textPrimary }]}>
                SRS: {feedback.stageChange}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.feedbackMessage, { color: colors.textPrimary }]}>
            {feedback.message}
          </Text>

          {feedback.unlockedItems && feedback.unlockedItems.length > 0 ? (
            <View
              style={[
                styles.unlockedAlertBox,
                { backgroundColor: colors.bgSurface, borderColor: colors.success },
              ]}
            >
              <Text style={[styles.unlockedAlertTitle, { color: colors.success }]}>
                Guru I Reached! Newly Unlocked in Lesson Queue:
              </Text>
              <Text style={[styles.unlockedAlertItems, { color: colors.textPrimary }]}>
                {feedback.unlockedItems.join(' • ')}
              </Text>
            </View>
          ) : null}

          <View style={styles.feedbackActionsRow}>
            <Pressable
              onPress={() => setShowItemInfo((v) => !v)}
              accessibilityRole="button"
              style={[
                styles.toggleInfoBtn,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.toggleInfoBtnText, { color: colors.textPrimary }]}>
                {showItemInfo ? 'Hide Item Breakdown' : 'Inspect Mnemonic & Context'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmitOrNext}
              accessibilityRole="button"
              style={[
                styles.nextPromptBtn,
                { backgroundColor: colors.textPrimary },
              ]}
            >
              <Text style={[styles.nextPromptBtnText, { color: colors.bgPrimary }]}>
                Continue Queue
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Expandable Item Information Drawer */}
      {showItemInfo && feedback ? (
        <View
          style={[
            styles.infoDrawer,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.infoHeading, { color: colors.textPrimary }]}>
            {currentTask.characters} • {currentTask.meanings.join(', ')}
          </Text>
          {currentTask.readings.length > 0 ? (
            <Text style={[styles.infoReadings, { color: colors.jpVocab }]}>
              Readings: {currentTask.readings.join(' • ')}
            </Text>
          ) : null}
          {currentTask.pitchAccent ? (
            <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
              Pitch Accent: {currentTask.pitchAccent}
            </Text>
          ) : null}
          {currentTask.grammarStructure ? (
            <Text style={[styles.infoSub, { color: colors.jpGrammar }]}>
              Structure: {currentTask.grammarStructure}
            </Text>
          ) : null}
          <Text style={[styles.infoMnemonic, { color: colors.textSecondary }]}>
            {currentTask.mnemonic}
          </Text>
          {currentTask.readingMnemonic ? (
            <Text style={[styles.infoMnemonic, { color: colors.textSecondary }]}>
              Reading Hint: {currentTask.readingMnemonic}
            </Text>
          ) : null}
          {currentTask.contextSentence ? (
            <View
              style={[
                styles.contextBox,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.contextJa, { color: colors.textPrimary }]}>
                {currentTask.contextSentence.ja}
              </Text>
              <Text style={[styles.contextEn, { color: colors.textSecondary }]}>
                {currentTask.contextSentence.en}
              </Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  summaryCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  summaryHeadline: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  primaryBtn: {
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressHeader: {
    gap: 6,
    marginBottom: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  remainingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  promptBanner: {
    minHeight: 180,
    borderRadius: 28,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  kindTagWrap: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  kindTag: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mainCharacters: {
    color: '#FFFFFF',
    fontSize: 62,
    fontWeight: '900',
    textAlign: 'center',
  },
  clozePromptWrap: {
    alignItems: 'center',
    gap: 8,
  },
  clozeSentenceText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  clozeBlankHighlight: {
    color: '#FEF08A',
    fontWeight: '800',
  },
  clozeNuanceText: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '600',
  },
  clozeTranslationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  questionTypeBar: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  answerInput: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '700',
  },
  submitBtn: {
    paddingHorizontal: 24,
    minHeight: 54,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackBox: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: SPACING.md + 2,
    gap: SPACING.sm,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackStatusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stagePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackMessage: {
    fontSize: 15,
    fontWeight: '700',
  },
  unlockedAlertBox: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  unlockedAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  unlockedAlertItems: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 4,
  },
  toggleInfoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  toggleInfoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextPromptBtn: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPromptBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoDrawer: {
    borderRadius: 26,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 8,
  },
  infoHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  infoReadings: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoMnemonic: {
    fontSize: 14,
    lineHeight: 20,
  },
  contextBox: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  contextJa: {
    fontSize: 15,
    fontWeight: '700',
  },
  contextEn: {
    fontSize: 13,
  },
});

