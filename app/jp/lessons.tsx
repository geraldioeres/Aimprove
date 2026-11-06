import React, { useState, useMemo, useRef } from 'react';
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
import { hasReadingSplit, KanjiReadings, readingsText } from '../../src/components/KanjiReadings';
import { CARD_EDGE, GLYPH_SHADOW, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
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
  const quizInputRef = useRef<TextInput>(null);
  // Put the cursor back in the answer field so the next answer can be typed right away.
  const refocusQuizInput = () => setTimeout(() => quizInputRef.current?.focus(), 0);

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'radical':
        return colors.jpRadical;
      case 'kanji':
        return colors.jpKanji;
      case 'vocab':
        return colors.jpVocab;
      case 'grammar':
        return colors.jpGrammar;
      default:
        return colors.jpVocab;
    }
  };

  if (batch.length === 0) {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.bgPrimary }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.ink },
          ]}
        >
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            No lessons right now
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Everything unlocked is already in your reviews. Get radicals and kanji to Guru to unlock new items.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            style={[styles.primaryBtn, TILE_LIP, { backgroundColor: colors.indigo }]}
          >
            <Text style={styles.primaryBtnText}>Back to Today</Text>
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
            { backgroundColor: colors.bgSurface, borderColor: colors.ink },
          ]}
        >
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Lessons done
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {batch.length} items moved to Apprentice. Your first review for them is in 4 hours.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            style={[styles.primaryBtn, TILE_LIP, { backgroundColor: colors.indigo }]}
          >
            <Text style={styles.primaryBtnText}>Back to Today</Text>
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
          refocusQuizInput();
        } else {
          await completeLessons(batch.map((b) => b.id));
          setPhase('done');
        }
      } else {
        setQuizFeedback(
          askReading
            ? `Try again. Expected reading: ${readingsText(currentQuizSubject)}`
            : `Try again. Expected meaning: ${currentQuizSubject.meanings.join(', ')}`
        );
        refocusQuizInput();
      }
    };

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepMeta, { color: colors.textSecondary }]}>
          Quiz · {quizIndex + 1} of {batch.length}
        </Text>

        <View
          style={[
            styles.lessonBanner,
            CARD_EDGE,
            { backgroundColor: getKindColor(currentQuizSubject.kind) },
          ]}
        >
          <View style={styles.bannerTagWrap}>
            <Text style={styles.bannerKind}>
              {currentQuizSubject.kind === 'vocab' ? 'Vocabulary' : currentQuizSubject.kind.charAt(0).toUpperCase() + currentQuizSubject.kind.slice(1)}
            </Text>
          </View>
          <Text style={[styles.bannerChars, GLYPH_SHADOW]}>{currentQuizSubject.characters}</Text>
          <Text style={styles.bannerMeanings}>
            {askReading
              ? `Meaning: ${currentQuizSubject.meanings.join(', ')}`
              : 'Type the English meaning'}
          </Text>
        </View>

        <Text style={[styles.quizPromptLabel, { color: colors.textPrimary }]}>
          {askReading
            ? 'Reading (type in romaji)'
            : 'Meaning'}
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
              askReading ? '答え' : 'Your response'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            blurOnSubmit={false}
            ref={quizInputRef}
            style={[
              styles.quizInput,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.ink,
                color: colors.textPrimary,
              },
            ]}
          />
          <Pressable
            onPress={handleQuizCheck}
            accessibilityRole="button"
            style={[
              styles.quizSubmitBtn,
              TILE_LIP,
              { backgroundColor: colors.indigo },
            ]}
          >
            <Text style={styles.primaryBtnText}>Check</Text>
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
          Lesson {stepIndex + 1} of {batch.length}
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
                    idx === stepIndex ? getKindColor(item.kind) : colors.bgSurface,
                  borderColor:
                    idx === stepIndex ? getKindColor(item.kind) : colors.border,
                },
                idx === stepIndex && TILE_LIP,
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
          CARD_EDGE,
          { backgroundColor: getKindColor(currentSubject.kind) },
        ]}
      >
        <View style={styles.bannerTagWrap}>
          <Text style={styles.bannerKind}>
            Level {currentSubject.level} · {currentSubject.kind === 'vocab' ? 'Vocabulary' : currentSubject.kind.charAt(0).toUpperCase() + currentSubject.kind.slice(1)}
          </Text>
        </View>
        <Text style={[styles.bannerChars, GLYPH_SHADOW]}>{currentSubject.characters}</Text>
        <Text style={styles.bannerMeanings}>
          {currentSubject.meanings.join(', ')}
        </Text>
      </View>

      <View
        style={[
          styles.detailCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        {currentSubject.readings.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Reading
            </Text>
            {hasReadingSplit(currentSubject) ? (
              <KanjiReadings subject={currentSubject} size="big" />
            ) : (
              <Text style={[styles.detailReadingBig, { color: colors.textPrimary }]}>
                {currentSubject.readings.join(' · ')}
              </Text>
            )}
          </View>
        ) : null}

        {currentSubject.grammarStructure ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Structure
            </Text>
            <Text style={[styles.detailBody, { color: colors.jpGrammar }]}>
              {currentSubject.grammarStructure}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailBlock}>
          <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
            Mnemonic
          </Text>
          <Text style={[styles.detailBody, { color: colors.textPrimary }]}>
            {currentSubject.mnemonic || 'No mnemonic for this item yet.'}
          </Text>
          {currentSubject.readingMnemonic ? (
            <Text style={[styles.detailBody, { color: colors.textSecondary, marginTop: 4 }]}>
              Reading hint: {currentSubject.readingMnemonic}
            </Text>
          ) : null}
        </View>

        {currentSubject.contextSentences.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailHeading, { color: colors.textSecondary }]}>
              Context sentences
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
                { backgroundColor: colors.bgSurface, borderColor: colors.ink },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                Previous
              </Text>
            </Pressable>
          ) : <View />}

          {stepIndex + 1 < batch.length ? (
            <Pressable
              onPress={() => setStepIndex(stepIndex + 1)}
              accessibilityRole="button"
              style={[styles.primaryBtn, TILE_LIP, { backgroundColor: colors.indigo }]}
            >
              <Text style={styles.primaryBtnText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setPhase('quiz')}
              accessibilityRole="button"
              style={[styles.primaryBtn, TILE_LIP, { backgroundColor: colors.jpKanji }]}
            >
              <Text style={styles.primaryBtnText}>Start quiz</Text>
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 6,
    borderWidth: 2,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  topRow: {
    gap: 10,
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
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPillText: {
    fontSize: 15,
    fontWeight: '700',
  },
  lessonBanner: {
    minHeight: 200,
    borderRadius: RADII.sm,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bannerTagWrap: {
    position: 'absolute',
    top: 10,
    left: 14,
  },
  bannerKind: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerChars: {
    color: '#FFFFFF',
    fontSize: 80,
    lineHeight: 100,
    fontWeight: '700',
  },
  bannerMeanings: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  detailCard: {
    borderRadius: 6,
    borderWidth: 2,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  detailBlock: {
    gap: 4,
  },
  detailHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailReadingBig: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBox: {
    padding: 14,
    borderRadius: 6,
    borderWidth: 2,
    gap: 4,
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
    gap: SPACING.sm,
  },
  primaryBtn: {
    paddingHorizontal: 22,
    minHeight: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    minHeight: 50,
    borderRadius: 6,
    borderWidth: 2,
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
    minHeight: 54,
    borderRadius: 6,
    borderWidth: 2,
    paddingHorizontal: 18,
    fontSize: 20,
    textAlign: 'center',
  },
  quizSubmitBtn: {
    paddingHorizontal: 24,
    minHeight: 54,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizAlert: {
    padding: 14,
    borderRadius: 6,
    borderWidth: 2,
  },
  quizAlertText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

