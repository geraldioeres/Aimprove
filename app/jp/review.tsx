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
import { Feather } from '@expo/vector-icons';
import { GLYPH_SHADOW, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
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
            Reviews complete
          </Text>
          <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>
            {totalInitialCount > 0
              ? `You answered all ${totalInitialCount} prompts in this session.`
              : 'Nothing is due right now. Check the forecast on Today, or start some lessons.'}
          </Text>

          <View style={styles.summaryBtnRow}>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.jpRadical },
                TILE_LIP,
              ]}
            >
              <Text style={styles.primaryBtnText}>Back to Today</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/jp/lessons')}
              accessibilityRole="button"
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                Open lessons
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

  const kindLabel =
    currentTask.kind === 'vocab'
      ? 'Vocabulary'
      : currentTask.kind.charAt(0).toUpperCase() + currentTask.kind.slice(1);
  const questionLabel =
    currentTask.promptType === 'cloze' ? 'Grammar' : kindLabel;
  const questionKind =
    currentTask.promptType === 'meaning' ? 'Meaning' : currentTask.promptType === 'cloze' ? 'Fill the blank' : 'Reading';
  const pct =
    totalInitialCount > 0 ? Math.round((completedCount / totalInitialCount) * 100) : 0;
  const graded = feedback?.status;
  const inputBg =
    graded === 'correct' ? colors.success : graded === 'incorrect' ? colors.danger : colors.bgSurface;
  const inputFg = graded ? '#FFFFFF' : colors.textPrimary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Character band */}
      <View style={[styles.band, { backgroundColor: getBannerColor() }]}>
        <View style={styles.bandStats}>
          <Text style={styles.bandStat}>{pct}%</Text>
          <Text style={styles.bandStat}>
            {completedCount} done · {queue.length} left
          </Text>
        </View>
        <View style={[styles.bandProgress]}>
          <View style={[styles.bandProgressFill, { width: `${Math.min(100, pct)}%` }]} />
        </View>

        {currentTask.promptType === 'cloze' && currentTask.clozePrompt ? (
          <View style={styles.clozePromptWrap}>
            <Text style={[styles.clozeSentenceText, GLYPH_SHADOW]}>
              {currentTask.clozePrompt.sentenceBefore}
              <Text style={styles.clozeBlankHighlight}> ＿＿＿ </Text>
              {currentTask.clozePrompt.sentenceAfter}
            </Text>
            <Text style={styles.clozeNuanceText}>Hint: {currentTask.clozePrompt.nuanceHint}</Text>
            <Text style={styles.clozeTranslationText}>“{currentTask.clozePrompt.fullTranslation}”</Text>
          </View>
        ) : (
          <Text
            style={[styles.mainCharacters, GLYPH_SHADOW]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {currentTask.characters}
          </Text>
        )}
        {currentTask.isMined ? <Text style={styles.minedNote}>Mined from your reading</Text> : null}
      </View>

      {/* Question type bar: dark for reading, light for meaning */}
      <View
        style={[
          styles.questionBar,
          isKanaPrompt
            ? { backgroundColor: '#2B2B2B', borderColor: '#2B2B2B' }
            : { backgroundColor: '#E9E9E9', borderColor: colors.border },
        ]}
      >
        <Text style={[styles.questionText, { color: isKanaPrompt ? '#FFFFFF' : colors.textPrimary }]}>
          {questionLabel} <Text style={styles.questionStrong}>{questionKind}</Text>
        </Text>
      </View>

      <View style={styles.body}>
        {/* Answer field */}
        <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: graded ? inputBg : colors.borderStrong }]}>
          <TextInput
            value={inputValue}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmitOrNext}
            placeholder={isKanaPrompt ? '答え' : 'Your response'}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            accessibilityLabel={`${questionLabel} ${questionKind}`}
            style={[styles.answerInput, { color: inputFg }]}
          />
          <Pressable
            onPress={handleSubmitOrNext}
            accessibilityRole="button"
            accessibilityLabel={feedback ? 'Next item' : 'Submit answer'}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: graded ? 'rgba(0,0,0,0.18)' : colors.bgMuted, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="arrow-right" size={20} color={graded ? '#FFFFFF' : colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.inputHint, { color: colors.textMuted }]}>
          {isKanaPrompt ? 'Type in romaji. It turns into kana as you type.' : 'Type the English meaning.'}
        </Text>

        {/* Result */}
        {feedback ? (
          <View style={[styles.result, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <View style={styles.resultTop}>
              <Text
                style={[styles.resultStatus, { color: graded === 'correct' ? colors.success : colors.danger }]}
              >
                {graded === 'correct' ? 'Correct' : 'Incorrect'}
              </Text>
              {feedback.stageChange ? (
                <View style={[styles.stageChip, { backgroundColor: colors.srsGuru }]}>
                  <Text style={styles.stageChipText}>{feedback.stageChange.replace('->', '→')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.resultMessage, { color: colors.textPrimary }]}>{feedback.message}</Text>

            {feedback.unlockedItems && feedback.unlockedItems.length > 0 ? (
              <View style={[styles.unlockedBox, { backgroundColor: colors.successBg }]}>
                <Text style={[styles.unlockedTitle, { color: colors.success }]}>Unlocked for lessons</Text>
                <Text style={[styles.unlockedItems, { color: colors.textPrimary }]}>
                  {feedback.unlockedItems.join(' · ')}
                </Text>
              </View>
            ) : null}

            <View style={styles.resultActions}>
              <Pressable
                onPress={() => setShowItemInfo((v) => !v)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.ghostBtn,
                  { borderColor: colors.borderStrong, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name={showItemInfo ? 'chevron-up' : 'info'} size={15} color={colors.textPrimary} />
                <Text style={[styles.ghostBtnText, { color: colors.textPrimary }]}>
                  {showItemInfo ? 'Hide item info' : 'Item info'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitOrNext}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.solidBtn,
                  TILE_LIP,
                  { backgroundColor: colors.textPrimary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.solidBtnText}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Item info */}
        {showItemInfo && feedback ? (
          <View style={[styles.infoDrawer, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <View style={styles.infoSection}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Meaning</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{currentTask.meanings.join(', ')}</Text>
            </View>
            {currentTask.readings.length > 0 ? (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reading</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {currentTask.readings.join(' · ')}
                </Text>
              </View>
            ) : null}
            {currentTask.pitchAccent ? (
              <Text style={[styles.infoSub, { color: colors.textSecondary }]}>Pitch accent: {currentTask.pitchAccent}</Text>
            ) : null}
            {currentTask.grammarStructure ? (
              <Text style={[styles.infoSub, { color: colors.jpGrammar }]}>Structure: {currentTask.grammarStructure}</Text>
            ) : null}
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <Text style={[styles.infoMnemonic, { color: colors.textSecondary }]}>{currentTask.mnemonic}</Text>
            {currentTask.readingMnemonic ? (
              <Text style={[styles.infoMnemonic, { color: colors.textSecondary }]}>
                Reading hint: {currentTask.readingMnemonic}
              </Text>
            ) : null}
            {currentTask.contextSentence ? (
              <View style={[styles.contextBox, { backgroundColor: colors.bgMuted }]}>
                <Text style={[styles.contextJa, { color: colors.textPrimary }]}>{currentTask.contextSentence.ja}</Text>
                <Text style={[styles.contextEn, { color: colors.textSecondary }]}>{currentTask.contextSentence.en}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: SPACING.xxl },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: RADII.sm,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  summaryHeadline: { fontSize: 20, fontWeight: '700' },
  summaryBody: { fontSize: 14, lineHeight: 21 },
  summaryBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  primaryBtn: {
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },

  band: {
    minHeight: 240,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandStats: {
    position: 'absolute',
    top: 10,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bandStat: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bandProgress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  bandProgressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)' },
  mainCharacters: {
    color: '#FFFFFF',
    fontSize: 96,
    lineHeight: 120,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  minedNote: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 4 },
  clozePromptWrap: {
    width: '100%',
    maxWidth: 640,
    gap: 8,
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  clozeSentenceText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 38,
    textAlign: 'center',
  },
  clozeBlankHighlight: { textDecorationLine: 'underline', fontWeight: '700' },
  clozeNuanceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  clozeTranslationText: { color: '#FFFFFF', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },

  questionBar: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  questionText: { fontSize: 16 },
  questionStrong: { fontWeight: '700' },

  body: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.sm,
    overflow: 'hidden',
  },
  answerInput: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 56,
    fontSize: 22,
    textAlign: 'center',
    outlineStyle: 'none',
  } as any,
  submitBtn: {
    position: 'absolute',
    right: 6,
    width: 44,
    height: 44,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: { fontSize: 12, textAlign: 'center', marginTop: -6 },

  result: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: SPACING.md,
    gap: 10,
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resultStatus: { fontSize: 16, fontWeight: '700' },
  stageChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.xs },
  stageChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  resultMessage: { fontSize: 14, lineHeight: 20 },
  unlockedBox: { padding: 10, borderRadius: RADII.sm, gap: 2 },
  unlockedTitle: { fontSize: 13, fontWeight: '700' },
  unlockedItems: { fontSize: 14 },
  resultActions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: RADII.sm,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '600' },
  solidBtn: {
    flex: 1,
    minWidth: 120,
    minHeight: 44,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  infoDrawer: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: SPACING.md,
    gap: 10,
  },
  infoSection: { gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: '700' },
  infoValue: { fontSize: 17, fontWeight: '600' },
  infoSub: { fontSize: 13, fontWeight: '600' },
  rule: { height: 1 },
  infoMnemonic: { fontSize: 14, lineHeight: 21 },
  contextBox: { padding: 12, borderRadius: RADII.sm, gap: 4 },
  contextJa: { fontSize: 16, lineHeight: 24 },
  contextEn: { fontSize: 13, lineHeight: 19 },
});
