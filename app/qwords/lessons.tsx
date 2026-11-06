import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { PressBlock, StampSeal } from '../../src/components/Stamp';
import { QuranWordDetails } from '../../src/components/QuranWordCard';
import { selectWordLessons, useQuranWords } from '../../src/store/useQuranWords';
import { KIND_LABEL, QuranWord, mainMeaning } from '../../src/data/quran-words';
import { meaningChoices } from '../../src/lib/quran-word-answer';

const BATCH = 5;

/** A fresh batch per URL, so "Next 5 words" can replace this screen with itself. */
export default function QuranWordLessonsScreen() {
  const { t } = useLocalSearchParams<{ t?: string }>();
  const { colors } = useTheme();
  // The batch is picked once, so wait for saved progress (e.g. after a refresh).
  const loaded = useQuranWords((s) => s.loadedFor !== undefined);
  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.indigo} />
      </View>
    );
  }
  return <LessonBatch key={t ?? ''} />;
}

function LessonBatch() {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = useQuranWords((s) => s.progress);
  const completeLessons = useQuranWords((s) => s.completeLessons);

  // Frozen for this batch.
  const batch = useMemo(() => selectWordLessons(progress).slice(0, BATCH), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [phase, setPhase] = useState<'study' | 'quiz' | 'done'>('study');
  const [step, setStep] = useState(0);
  const [queue, setQueue] = useState<QuranWord[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  if (batch.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.h1, { color: colors.ink }]}>No lessons right now</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Get 90% of this level's words to Guru in your reviews to open the next level.
          </Text>
          <PressBlock accessibilityRole="button" onPress={() => router.back()} style={[styles.primaryBtn, { backgroundColor: colors.indigo }]}>
            <Text style={styles.primaryText}>Back</Text>
          </PressBlock>
        </View>
      </View>
    );
  }

  if (phase === 'done') {
    const more = selectWordLessons(useQuranWords.getState().progress).length;
    return (
      <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.doneWrap}>
        <StampSeal size={120} slam seed={batch[0].i} />
        <Text style={[styles.h1, { color: colors.ink }]}>{batch.length} new words</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          They're in your reviews now. The first review comes in about 4 hours.
        </Text>
        <View style={styles.doneWords}>
          {batch.map((w) => (
            <View key={w.i} style={[styles.doneChip, { borderColor: colors.border }]}>
              <Text style={[styles.doneArabic, { color: colors.ink }]}>{w.a}</Text>
              <Text style={[styles.doneMeaning, { color: colors.textSecondary }]}>{mainMeaning(w)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          {more > 0 ? (
            <PressBlock
              accessibilityRole="button"
              onPress={() => router.replace(`/qwords/lessons?t=${Date.now()}`)}
              style={[styles.primaryBtn, styles.flex, { backgroundColor: colors.marigold }]}
            >
              <Text style={[styles.primaryText, { color: colors.ink }]}>Next {Math.min(BATCH, more)} words</Text>
            </PressBlock>
          ) : null}
          <PressBlock
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.primaryBtn, styles.flex, { backgroundColor: colors.bgSurface }]}
          >
            <Text style={[styles.primaryText, { color: colors.ink }]}>Done</Text>
          </PressBlock>
        </View>
      </ScrollView>
    );
  }

  if (phase === 'quiz') {
    const word = queue[0];
    const choices = meaningChoices(word, round);
    const right = mainMeaning(word);
    const answered = picked !== null;
    const next = async () => {
      const wasRight = picked === right;
      setPicked(null);
      setRound((r) => r + 1);
      const rest = wasRight ? queue.slice(1) : [...queue.slice(1), word];
      if (rest.length === 0) {
        await completeLessons(batch.map((w) => w.i));
        setPhase('done');
      } else setQueue(rest);
    };
    return (
      <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Quiz · {batch.length - queue.length} of {batch.length} done
        </Text>
        <View style={[styles.face, { backgroundColor: colors.quranSabaq }]}>
          <Text style={styles.faceArabic} adjustsFontSizeToFit numberOfLines={1}>
            {word.a}
          </Text>
          <Text style={styles.faceKind}>{KIND_LABEL[word.p]}</Text>
        </View>
        <Text style={[styles.question, { color: colors.ink }]}>What does it mean?</Text>
        <View style={styles.choices}>
          {choices.map((c) => {
            const isRight = c === right;
            const state = !answered ? 'idle' : isRight ? 'right' : c === picked ? 'wrong' : 'idle';
            return (
              <Pressable
                key={c}
                disabled={answered}
                onPress={() => setPicked(c)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.choice,
                  {
                    borderColor: state === 'right' ? colors.success : state === 'wrong' ? colors.danger : colors.ink,
                    backgroundColor:
                      state === 'right' ? colors.successBg : state === 'wrong' ? colors.dangerBg : colors.bgSurface,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.choiceText, { color: colors.ink }]}>{c}</Text>
                {state === 'right' ? <Feather name="check" size={18} color={colors.success} /> : null}
                {state === 'wrong' ? <Feather name="x" size={18} color={colors.danger} /> : null}
              </Pressable>
            );
          })}
        </View>
        {answered ? (
          <>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {picked === right ? 'Correct.' : "Not quite. You'll see it again before the end."} {word.a} means{' '}
              {word.m.join(', ')}.
            </Text>
            <PressBlock accessibilityRole="button" onPress={next} style={[styles.primaryBtn, { backgroundColor: colors.indigo }]}>
              <Text style={styles.primaryText}>Next</Text>
            </PressBlock>
          </>
        ) : null}
      </ScrollView>
    );
  }

  const word = batch[step];
  const last = step === batch.length - 1;
  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <View style={styles.dots}>
        {batch.map((w, i) => (
          <Pressable
            key={w.i}
            onPress={() => setStep(i)}
            accessibilityRole="button"
            accessibilityLabel={`Word ${i + 1}`}
            hitSlop={6}
            style={[styles.dot, { borderColor: colors.ink, backgroundColor: i === step ? colors.ink : 'transparent' }]}
          />
        ))}
      </View>
      <QuranWordDetails key={word.i} word={word} />
      <View style={styles.row}>
        {step > 0 ? (
          <PressBlock
            accessibilityRole="button"
            onPress={() => setStep(step - 1)}
            style={[styles.primaryBtn, styles.flex, { backgroundColor: colors.bgSurface }]}
          >
            <Text style={[styles.primaryText, { color: colors.ink }]}>Back</Text>
          </PressBlock>
        ) : null}
        <PressBlock
          accessibilityRole="button"
          onPress={() => {
            if (!last) return setStep(step + 1);
            setQueue([...batch].sort(() => Math.random() - 0.5));
            setPhase('quiz');
          }}
          style={[styles.primaryBtn, styles.flex, { backgroundColor: last ? colors.marigold : colors.indigo }]}
        >
          <Text style={[styles.primaryText, last && { color: colors.ink }]}>{last ? 'Start the quiz' : 'Next word'}</Text>
        </PressBlock>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { borderRadius: RADII.sm, padding: 18, gap: 12, width: '100%', maxWidth: 480 },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  doneWrap: { padding: 16, paddingTop: SPACING.xl, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center', alignItems: 'stretch' },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '900' },
  body: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  primaryBtn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dots: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  face: { borderRadius: RADII.sm, minHeight: 170, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  faceArabic: { color: '#FFFFFF', fontSize: 64, lineHeight: 120, textAlign: 'center' },
  faceKind: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  question: { fontSize: 17, fontWeight: '900' },
  choices: { gap: 10 },
  choice: {
    minHeight: 52,
    borderWidth: 2,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  choiceText: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  doneWords: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  doneChip: { borderWidth: 1, borderRadius: RADII.xs, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  doneArabic: { fontSize: 24, lineHeight: 46 },
  doneMeaning: { fontSize: 12 },
});
