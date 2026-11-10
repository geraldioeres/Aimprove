import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { CARD_EDGE, GLYPH_SHADOW, RADII, SPACING } from '../../src/theme/tokens';
import {
  JP_SUBJECT_BY_ID,
  selectDueJapaneseReviews,
  selectUpcomingJapaneseReviews,
  selectStreak,
  useLearningStore,
} from '../../src/store/useLearningStore';
import { hasReadingSplit, KanjiReadings, readingsText } from '../../src/components/KanjiReadings';
import { PressBlock, StampCard, StampSeal, useReduceMotion } from '../../src/components/Stamp';
import { useEnterKey } from '../../src/lib/use-enter-key';
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

/**
 * A fresh session per URL: "Review ahead" from the summary replaces this
 * screen with itself, so key on the params to rebuild the queue.
 */
export default function JapaneseTypedReviewScreen() {
  const { ahead, t } = useLocalSearchParams<{ ahead?: string; t?: string }>();
  return <ReviewSession key={`${ahead ?? ''}-${t ?? ''}`} />;
}

function ReviewSession() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const submitReview = useLearningStore((s) => s.submitJPReviewOutcome);

  const { ahead } = useLocalSearchParams<{ ahead?: string }>();
  const reviewingAhead = ahead === '1';

  const initialTasks = useMemo(() => {
    // Due reviews first; when reviewing ahead, also the ones still waiting.
    const dueNow = selectDueJapaneseReviews(state);
    const waiting = reviewingAhead
      ? selectUpcomingJapaneseReviews(state)
      : { subjects: [], minedCards: [], totalCount: 0 };
    const due = {
      subjects: [...dueNow.subjects, ...waiting.subjects],
      minedCards: [...dueNow.minedCards, ...waiting.minedCards],
    };
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
        mnemonic: `From your reading: ${mined.contextSentenceJa}`,
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
        mnemonic: `From your reading: ${mined.contextSentenceJa}`,
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
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  // Was today already stamped when the session began? The summary slams the
  // seal only when this session earned it.
  const goalMetAtStart = useMemo(() => selectStreak(state).goalMet, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reduceMotion = useReduceMotion();
  const shake = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const resultIn = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!feedback || reduceMotion) return;
    resultIn.setValue(0);
    Animated.timing(resultIn, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
    if (feedback.status === 'incorrect') {
      shake.setValue(0);
      Animated.sequence(
        [10, -8, 6, -4, 0].map((x) =>
          Animated.timing(shake, { toValue: x, duration: 55, useNativeDriver: true })
        )
      ).start();
    }
  }, [feedback, reduceMotion, resultIn, shake]);

  const currentTask = queue[0];
  const totalInitialCount = initialTasks.length;
  const completedCount = completedTaskKeys.size;

  // Enter moves on even when the answer field isn't focused (e.g. after
  // clicking Item info): set below for the summary and for each item.
  const enterAction = useRef<() => void>(() => {});
  useEnterKey(() => enterAction.current());

  if (!currentTask) {
    enterAction.current = () => router.replace('/(tabs)');
    const streak = selectStreak(state);
    const upcomingNow = selectUpcomingJapaneseReviews(state).totalCount;
    const itemsTotal = new Set(initialTasks.map((t) => t.subjectId)).size;
    const firstTry = Math.max(0, itemsTotal - Object.keys(subjectMistakeMap).length);
    const earnedStamp = streak.goalMet && !goalMetAtStart;
    const body =
      totalInitialCount === 0
        ? "Nothing is due right now. Check what's coming up on Today, or learn something new."
        : earnedStamp
          ? `That's today's stamp. ${streak.current}-day streak and counting.`
          : streak.goalMet
            ? 'Today was already stamped. Extra reps still count.'
            : `${streak.goal - streak.todayCount} more items to earn today's stamp.`;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        contentContainerStyle={styles.emptyContainer}
      >
        <View style={styles.summaryWrap}>
          {earnedStamp ? (
            <View style={styles.heroSeal}>
              <StampSeal size={148} slam seed={streak.week.find((d) => d.isToday)?.key} />
            </View>
          ) : null}
          <Text style={[styles.summaryHeadline, { color: colors.ink }]} accessibilityRole="header">
            {totalInitialCount === 0 ? 'All caught up' : earnedStamp ? 'Stamped!' : 'Session done'}
          </Text>
          <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>{body}</Text>

          {totalInitialCount > 0 ? (
            <Text style={[styles.statsLine, { color: colors.ink }]}>
              {itemsTotal} {itemsTotal === 1 ? 'item' : 'items'} · {firstTry} right first try
              {bestCombo >= 3 ? ` · best combo ×${bestCombo}` : ''}
            </Text>
          ) : null}

          <StampCard streak={streak} />

          <View style={styles.summaryBtnRow}>
            <PressBlock
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.indigo }]}
            >
              <Text style={styles.primaryBtnText}>Back to Today</Text>
            </PressBlock>
            <PressBlock
              onPress={() => router.replace('/jp/lessons')}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.bgSurface }]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.ink }]}>Learn new items</Text>
            </PressBlock>
          </View>
          {upcomingNow > 0 ? (
            <PressBlock
              onPress={() => router.replace(`/jp/review?ahead=1&t=${Date.now()}`)}
              accessibilityRole="button"
              style={[styles.primaryBtn, styles.aheadBtn, { backgroundColor: colors.bgSurface }]}
            >
              <Feather name="fast-forward" size={18} color={colors.ink} />
              <Text style={[styles.primaryBtnText, { color: colors.ink }]}>
                Review ahead · {upcomingNow} not due yet
              </Text>
            </PressBlock>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  const isKanaPrompt =
    currentTask.promptType === 'reading' || currentTask.promptType === 'cloze';
  // The full subject, for kanji readings split into on'yomi and kun'yomi.
  const subjectInfo = currentTask.isMined ? null : JP_SUBJECT_BY_ID[currentTask.subjectId];

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
      setTimeout(() => inputRef.current?.focus(), 0);
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
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
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
          ? `Close enough. Exact answer: ${currentTask.meanings.join(', ')}`
          : isKanaPrompt
          ? `Reading: ${readingsText(subjectInfo, currentTask.readings)}`
          : `Meaning: ${currentTask.meanings.join(', ')}`,
        stageChange: stageSummary,
        unlockedItems: unlockedNames,
      });
    } else {
      setCombo(0);
      const prevMistakes = subjectMistakeMap[currentTask.subjectId] || 0;
      setSubjectMistakeMap({
        ...subjectMistakeMap,
        [currentTask.subjectId]: prevMistakes + 1,
      });
      setShowItemInfo(true);
      setFeedback({
        status: 'incorrect',
        message: isKanaPrompt
          ? `The reading is ${readingsText(subjectInfo, currentTask.readings)}.`
          : `It means ${currentTask.meanings.join(', ')}.`,
      });
    }
  };

  // Graded: Enter goes to the next item. Not yet: back to the answer field.
  enterAction.current = feedback ? () => void handleSubmitOrNext() : () => inputRef.current?.focus();

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
  const inputBg = colors.bgSurface;
  const inputFg = colors.ink;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stage}>
        <View style={styles.stageTop}>
          <Text style={[styles.stageStat, { color: colors.textSecondary }]}>
            {completedCount} done · {queue.length - (feedback?.status === 'correct' ? 1 : 0)} left
          </Text>
          {combo >= 3 ? (
            <View style={[styles.comboChip, { borderColor: colors.ink }]} accessibilityLabel={`Combo of ${combo}`}>
              <Text style={[styles.comboText, { color: colors.ink }]}>Combo ×{combo}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.track, { borderColor: colors.ink }]}>
          <View style={[styles.trackFill, { width: `${Math.min(100, pct)}%`, backgroundColor: colors.indigo }]} />
        </View>

        <View style={[styles.itemCard, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <View
            style={[
              styles.itemHead,
              { borderBottomColor: colors.ink, backgroundColor: isKanaPrompt ? colors.ink : colors.bgSurface },
            ]}
          >
            <Text style={[styles.itemHeadText, { color: isKanaPrompt ? '#FFFFFF' : colors.ink }]}>
              {questionLabel} <Text style={styles.itemHeadStrong}>{questionKind.toLowerCase()}</Text>
            </Text>
            <View style={[styles.kindDot, { backgroundColor: getBannerColor() }]} />
          </View>
          <View style={[styles.itemFace, { backgroundColor: getBannerColor() }]}>
            {currentTask.promptType === 'cloze' && currentTask.clozePrompt ? (
              <View style={styles.clozePromptWrap}>
                <Text style={styles.clozeSentenceText}>
                  {currentTask.clozePrompt.sentenceBefore}
                  <Text style={styles.clozeBlankHighlight}> ＿＿＿ </Text>
                  {currentTask.clozePrompt.sentenceAfter}
                </Text>
                <Text style={styles.clozeNuanceText}>Hint: {currentTask.clozePrompt.nuanceHint}</Text>
                <Text style={styles.clozeTranslationText}>“{currentTask.clozePrompt.fullTranslation}”</Text>
              </View>
            ) : (
              <Text style={styles.mainCharacters} adjustsFontSizeToFit numberOfLines={1}>
                {currentTask.characters}
              </Text>
            )}
            {currentTask.isMined ? <Text style={styles.minedNote}>From your reading</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Answer field */}
        <Animated.View
          style={[
            styles.inputWrap,
            { backgroundColor: inputBg, borderColor: colors.ink, transform: [{ translateX: shake }] },
          ]}
        >
          <TextInput
            value={inputValue}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmitOrNext}
            blurOnSubmit={false}
            placeholder={isKanaPrompt ? '答え' : 'Your response'}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            ref={inputRef}
            accessibilityLabel={`${questionLabel} ${questionKind}`}
            style={[styles.answerInput, { color: inputFg }]}
          />
          <Pressable
            onPress={handleSubmitOrNext}
            accessibilityRole="button"
            accessibilityLabel={feedback ? 'Next item' : 'Submit answer'}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.bgMuted, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="arrow-right" size={20} color={colors.ink} />
          </Pressable>
        </Animated.View>
        <Text style={[styles.inputHint, { color: colors.textMuted }]}>
          {isKanaPrompt ? 'Type in romaji. It turns into kana as you type.' : 'Type the English meaning.'}
        </Text>

        {/* Result */}
        {feedback ? (
          <Animated.View
            style={[
              styles.result,
              CARD_EDGE,
              {
                backgroundColor: colors.bgSurface,
                opacity: resultIn,
                transform: [{ translateY: resultIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              },
            ]}
          >
            <View style={styles.resultTop}>
              <View style={styles.resultLead}>
                {graded === 'correct' ? (
                  <StampSeal key={currentTask.key} size={44} slam glyph="sei" seed={currentTask.key} />
                ) : (
                  <View style={[styles.xMark, { borderColor: colors.ink }]}>
                    <Feather name="x" size={22} color={colors.ink} />
                  </View>
                )}
                <Text style={[styles.resultStatus, { color: colors.ink }]}>
                  {graded === 'correct' ? (combo >= 3 ? `Correct · ${combo} in a row` : 'Correct') : 'Not quite'}
                </Text>
              </View>
              {feedback.stageChange ? (
                <View style={[styles.stageChip, { backgroundColor: colors.indigo }]}>
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
                onPress={() => {
                  setShowItemInfo((v) => !v);
                  // Keep Enter meaning "next": hand focus back to the answer field.
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.ghostBtn,
                  { borderColor: colors.ink, backgroundColor: pressed ? colors.bgMuted : colors.bgSurface },
                ]}
              >
                <Feather name={showItemInfo ? 'chevron-up' : 'info'} size={15} color={colors.textPrimary} />
                <Text style={[styles.ghostBtnText, { color: colors.textPrimary }]}>
                  {showItemInfo ? 'Hide item info' : 'Item info'}
                </Text>
              </Pressable>
              <PressBlock
                onPress={handleSubmitOrNext}
                accessibilityRole="button"
                style={[styles.solidBtn, { backgroundColor: colors.indigo }]}
              >
                <Text style={styles.solidBtnText}>Next</Text>
              </PressBlock>
            </View>
          </Animated.View>
        ) : null}

        {/* Item info */}
        {showItemInfo && feedback ? (
          <View style={[styles.infoDrawer, { backgroundColor: colors.bgSurface, borderColor: colors.ink }]}>
            <View style={styles.infoSection}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Meaning</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{currentTask.meanings.join(', ')}</Text>
            </View>
            {currentTask.readings.length > 0 ? (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reading</Text>
                {subjectInfo && hasReadingSplit(subjectInfo) ? (
                  <KanjiReadings subject={subjectInfo} />
                ) : (
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {currentTask.readings.join(' · ')}
                  </Text>
                )}
              </View>
            ) : null}
            {currentTask.pitchAccent ? (
              <Text style={[styles.infoSub, { color: colors.textSecondary }]}>Pitch accent: {currentTask.pitchAccent}</Text>
            ) : null}
            {currentTask.grammarStructure ? (
              <Text style={[styles.infoSub, { color: colors.jpGrammar }]}>Structure: {currentTask.grammarStructure}</Text>
            ) : null}
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <Text style={[styles.infoMnemonic, { color: currentTask.mnemonic ? colors.textSecondary : colors.textMuted }]}>
              {currentTask.mnemonic || 'No mnemonic for this item yet.'}
            </Text>
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
    flexGrow: 1,
    padding: 16,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  heroSeal: { alignItems: 'center', paddingVertical: 8 },
  statsLine: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  summaryWrap: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 16 },
  summaryHeadline: { fontSize: 34, lineHeight: 40, fontWeight: '900' },
  summaryBody: { fontSize: 15, lineHeight: 22, marginTop: -8 },
  summaryBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  aheadBtn: { flexDirection: 'row', gap: 10, flex: 0 },
  primaryBtn: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: 18,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  stage: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 0, gap: 10 },
  stageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 26 },
  stageStat: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%' },
  comboChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: RADII.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '-3deg' }],
  },
  comboText: { fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  itemCard: { borderRadius: RADII.sm, overflow: 'hidden' },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 46,
    borderBottomWidth: 2,
  },
  itemHeadText: { fontSize: 16, fontWeight: '500' },
  itemHeadStrong: { fontWeight: '900' },
  kindDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  itemFace: { minHeight: 200, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  mainCharacters: {
    color: '#FFFFFF',
    fontSize: 96,
    lineHeight: 120,
    fontWeight: '700',
    textAlign: 'center',
  },
  minedNote: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 4 },
  clozePromptWrap: {
    width: '100%',
    maxWidth: 640,
    gap: 8,
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
    borderWidth: 2,
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
  resultLead: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  xMark: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  resultStatus: { fontSize: 18, fontWeight: '900', flexShrink: 1 },
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
    borderWidth: 2,
    borderRadius: RADII.sm,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '700' },
  solidBtn: {
    flex: 1,
    minWidth: 120,
    minHeight: 44,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  infoDrawer: {
    borderWidth: 2,
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
