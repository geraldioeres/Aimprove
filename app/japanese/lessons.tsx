import React, { useState, useMemo } from 'react';
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
  selectAvailableJapaneseLessons,
  useLearningStore,
} from '../../src/store/useLearningStore';
import {
  checkEnglishMeaning,
  checkJapaneseReading,
  convertRomajiToHiraganaLive,
  finalizeKanaInput,
} from '../../src/lib/romaji-kana';

export default function JapaneseLessonsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const completeLessons = useLearningStore((s) => s.completeJPLessonBatch);

  const batch = useMemo(() => {
    return selectAvailableJapaneseLessons(state).slice(0, 5);
    // Freeze batch on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'study' | 'quiz' | 'done'>('study');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  if (batch.length === 0) {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.bgPrimary }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            No Unlocked Lessons Waiting
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            All currently unlocked items are already in your active SRS queue. Complete due reviews so Radicals and Kanji reach Guru I to unlock new Kanji, Vocabulary, and Levels.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: colors.jpVocab }]}
          >
            <Text style={styles.primaryBtnText}>Return to Today's Queue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.bgPrimary }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Lesson Batch Promoted to Apprentice I
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {batch.length} new Japanese items have entered Apprentice I and will appear in your review queue in 4 hours.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: colors.jpVocab }]}
          >
            <Text style={styles.primaryBtnText}>Return to Today's Queue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'quiz') {
    const currentQuizSubject = batch[quizIndex];
    const askReading = currentQuizSubject.readings.length > 0;

    const handleQuizCheck = async () => {
      const trimmed = quizInput.trim();
      if (!trimmed) return;

      const res = askReading
        ? checkJapaneseReading(trimmed, currentQuizSubject.readings)
        : checkEnglishMeaning(trimmed, currentQuizSubject.meanings);

      if (askReading) {
        setQuizInput(finalizeKanaInput(trimmed));
      }

      if (res.isCorrect) {
        setQuizFeedback(null);
        setQuizInput('');
        if (quizIndex + 1 < batch.length) {
          setQuizIndex(quizIndex + 1);
        } else {
          await completeLessons(batch.map((b) => b.id));
          setPhase('done');
        }
      } else {
        setQuizFeedback(
          askReading
            ? `Try again. Expected reading: ${currentQuizSubject.readings.join(' • ')}`
            : `Try again. Expected meaning: ${currentQuizSubject.meanings.join(', ')}`
        );
      }
    };

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepMeta, { color: colors.textSecondary }]}>
          Lesson Quiz • Item {quizIndex + 1} of {batch.length}
        </Text>

        <View
          style={[
            styles.lessonBanner,
            { backgroundColor: colors.jpVocab },
          ]}
        >
          <Text style={styles.bannerKind}>
            {currentQuizSubject.kind.toUpperCase()} QUIZ
          </Text>
          <Text style={styles.bannerChars}>{currentQuizSubject.characters}</Text>
          <Text style={styles.bannerMeanings}>
            {askReading
              ? `Meaning: ${currentQuizSubject.meanings.join(', ')}`
              : 'Type the English meaning'}
          </Text>
        </View>

        <Text style={[styles.quizPromptLabel, { color: colors.textPrimary }]}>
          {askReading
            ? 'Type Reading in Romaji -> Hiragana:'
            : 'Type English Meaning:'}
        </Text>

        <View style={styles.quizInputRow}>
          <TextInput
            value={quizInput}
            onChangeText={(txt) => {
              setQuizFeedback(null);
              setQuizInput(
                askReading ? convertRomajiToHiraganaLive(txt) : txt
              );
            }}
            onSubmitEditing={handleQuizCheck}
            placeholder={
              askReading ? 'Type reading (e.g. くち)...' : 'Type meaning...'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.quizInput,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderStrong,
                color: colors.textPrimary,
              },
            ]}
          />
          <Pressable
            onPress={handleQuizCheck}
            accessibilityRole="button"
            style={[
              styles.quizSubmitBtn,
              { backgroundColor: colors.jpVocab },
            ]}
          >
            <Text style={styles.primaryBtnText}>Verify</Text>
          </Pressable>
        </View>

        {quizFeedback ? (
          <View
            style={[
              styles.quizAlert,
              { backgroundColor: colors.dangerBg, borderColor: colors.danger },
            ]}
          >
            <Text style={[styles.quizAlertText, { color: colors.danger }]}>
              {quizFeedback}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  const currentSubject = batch[stepIndex];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topRow}>
        <Text style={[styles.stepMeta, { color: colors.textSecondary }]}>
          Lesson Study • {stepIndex + 1} of {batch.length}
        </Text>
        <View style={styles.miniPillRow}>
          {batch.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() => setStepIndex(idx)}
              accessibilityRole="button"
              style={[
                styles.miniPill,
                {
                  backgroundColor:
                    idx === stepIndex ? colors.jpVocab : colors.bgSurface,
                  borderColor:
                    idx === stepIndex ? colors.jpVocab : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.miniPillText,
                  {
                    color: idx === stepIndex ? '#FFFFFF' : colors.textPrimary,
                  },
                ]}
              >
                {item.characters}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.lessonBanner,
          { backgroundColor: colors.jpKanji },
        ]}
      >
        <Text style={styles.bannerKind}>
          LEVEL {currentSubject.level} • {currentSubject.kind.toUpperCase()}
        </Text>
        <Text style={styles.bannerChars}>{currentSubject.characters}</Text>
        <Text style={styles.bannerMeanings}>
          {currentSubject.meanings.join(', ')}
        </Text>
      </View>

      <View
        style={[
          styles.detailCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        {currentSubject.readings.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Accepted Readings
            </Text>
            <Text style={[styles.detailReadingBig, { color: colors.jpVocab }]}>
              {currentSubject.readings.join(' • ')}
            </Text>
          </View>
        ) : null}

        {currentSubject.grammarStructure ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Grammar Formation
            </Text>
            <Text style={[styles.detailBody, { color: colors.jpGrammar }]}>
              {currentSubject.grammarStructure}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailBlock}>
          <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
            Mnemonic & Explanation
          </Text>
          <Text style={[styles.detailBody, { color: colors.textPrimary }]}>
            {currentSubject.mnemonic}
          </Text>
          {currentSubject.readingMnemonic ? (
            <Text style={[styles.detailBody, { color: colors.textSecondary, marginTop: 4 }]}>
              Reading Memory Cue: {currentSubject.readingMnemonic}
            </Text>
          ) : null}
        </View>

        {currentSubject.contextSentences.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Example Usage
            </Text>
            {currentSubject.contextSentences.map((cs, i) => (
              <View
                key={i}
                style={[
                  styles.exampleBox,
                  { backgroundColor: colors.bgMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.exampleJa, { color: colors.textPrimary }]}>
                  {cs.ja}
                </Text>
                <Text style={[styles.exampleFuri, { color: colors.textMuted }]}>
                  {cs.furigana}
                </Text>
                <Text style={[styles.exampleEn, { color: colors.textSecondary }]}>
                  {cs.en}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.navBtnRow}>
          {stepIndex > 0 ? (
            <Pressable
              onPress={() => setStepIndex(stepIndex - 1)}
              accessibilityRole="button"
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                Previous Item
              </Text>
            </Pressable>
          ) : <View />}

          {stepIndex + 1 < batch.length ? (
            <Pressable
              onPress={() => setStepIndex(stepIndex + 1)}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.jpVocab }]}
            >
              <Text style={styles.primaryBtnText}>Next Lesson Card</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setPhase('quiz')}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.success }]}
            >
              <Text style={styles.primaryBtnText}>Start Lesson Quiz</Text>
            </Pressable>
          )}
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
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  headline: {
    fontSize: 21,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  topRow: {
    gap: 8,
  },
  stepMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniPill: {
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lessonBanner: {
    minHeight: 160,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bannerKind: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bannerChars: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
  },
  bannerMeanings: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  detailCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  detailBlock: {
    gap: 4,
  },
  detailHeading: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailReadingBig: {
    fontSize: 22,
    fontWeight: '800',
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBox: {
    padding: 12,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 2,
    marginTop: 4,
  },
  exampleJa: {
    fontSize: 15,
    fontWeight: '700',
  },
  exampleFuri: {
    fontSize: 12,
  },
  exampleEn: {
    fontSize: 13,
  },
  navBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    paddingHorizontal: 16,
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
  quizPromptLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  quizInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quizInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: RADII.md,
    borderWidth: 2,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
  },
  quizSubmitBtn: {
    paddingHorizontal: 20,
    minHeight: 50,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizAlert: {
    padding: 12,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  quizAlertText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

