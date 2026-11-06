import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { PressBlock, StampCard, StampSeal } from '../../src/components/Stamp';
import { QuranWordDetails } from '../../src/components/QuranWordCard';
import {
  selectDueWords,
  selectUpcomingWords,
  useQuranWords,
} from '../../src/store/useQuranWords';
import { selectStreak, useLearningStore } from '../../src/store/useLearningStore';
import { KIND_LABEL, QuranWord, mainMeaning } from '../../src/data/quran-words';
import { checkWordMeaning, meaningChoices } from '../../src/lib/quran-word-answer';

/** A fresh session per URL: "Review ahead" replaces this screen with itself. */
export default function QuranWordReviewScreen() {
  const { ahead, t } = useLocalSearchParams<{ ahead?: string; t?: string }>();
  const { colors } = useTheme();
  // The queue is built once, so wait for saved progress (e.g. after a refresh).
  const loaded = useQuranWords((s) => s.loadedFor !== undefined);
  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator color={colors.indigo} />
      </View>
    );
  }
  return <Session key={`${ahead ?? ''}-${t ?? ''}`} ahead={ahead === '1'} />;
}

function Session({ ahead }: { ahead: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = useQuranWords((s) => s.progress);
  const submitReview = useQuranWords((s) => s.submitReview);
  const learning = useLearningStore();

  // Frozen for this session: due first, then (when reviewing ahead) the rest.
  const initial = useMemo(
    () => [...selectDueWords(progress), ...(ahead ? selectUpcomingWords(progress) : [])],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const goalMetAtStart = useMemo(() => selectStreak(learning).goalMet, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [queue, setQueue] = useState<QuranWord[]>(initial);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [done, setDone] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<null | { right: boolean; stage?: string; levelUp?: number | null }>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [round, setRound] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const word = queue[0];

  if (!word) {
    const streak = selectStreak(useLearningStore.getState());
    const earned = streak.goalMet && !goalMetAtStart;
    const upcoming = selectUpcomingWords(useQuranWords.getState().progress).length;
    const firstTry = initial.filter((w) => !mistakes[w.i]).length;
    return (
      <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.summary}>
        {earned ? (
          <View style={{ alignItems: 'center' }}>
            <StampSeal size={140} slam seed={streak.week.find((d) => d.isToday)?.key} />
          </View>
        ) : null}
        <Text style={[styles.h1, { color: colors.ink }]} accessibilityRole="header">
          {initial.length === 0 ? 'All caught up' : earned ? 'Stamped!' : 'Session done'}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {initial.length === 0
            ? 'No word reviews are due right now.'
            : `${initial.length} ${initial.length === 1 ? 'word' : 'words'} · ${firstTry} right first try`}
        </Text>
        <StampCard streak={streak} />
        <View style={styles.row}>
          <PressBlock accessibilityRole="button" onPress={() => router.back()} style={[styles.btn, styles.flex, { backgroundColor: colors.indigo }]}>
            <Text style={styles.btnText}>Done</Text>
          </PressBlock>
          <PressBlock
            accessibilityRole="button"
            onPress={() => router.replace('/qwords/lessons')}
            style={[styles.btn, styles.flex, { backgroundColor: colors.bgSurface }]}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Learn new words</Text>
          </PressBlock>
        </View>
        {upcoming > 0 ? (
          <PressBlock
            accessibilityRole="button"
            onPress={() => router.replace(`/qwords/review?ahead=1&t=${Date.now()}`)}
            style={[styles.btn, styles.aheadBtn, { backgroundColor: colors.bgSurface }]}
          >
            <Feather name="fast-forward" size={18} color={colors.ink} />
            <Text style={[styles.btnText, { color: colors.ink }]}>Review ahead · {upcoming} not due yet</Text>
          </PressBlock>
        ) : null}
      </ScrollView>
    );
  }

  const stage = progress[word.i]?.stage ?? 1;
  const typing = stage >= 5; // Guru and up: type the meaning
  const right = mainMeaning(word);
  const choices = typing ? [] : meaningChoices(word, round);

  const grade = async (isRight: boolean) => {
    if (isRight) {
      const outcome = await submitReview(word.i, mistakes[word.i] || 0);
      setResult({ right: true, stage: `${outcome.previous} → ${outcome.next}`, levelUp: outcome.leveledUpTo });
    } else {
      setMistakes((m) => ({ ...m, [word.i]: (m[word.i] || 0) + 1 }));
      setResult({ right: false });
      setShowInfo(true);
    }
  };

  const submitTyped = () => {
    if (result) return next();
    if (!typed.trim()) return;
    void grade(checkWordMeaning(typed, word));
  };

  // A typed answer marked wrong that was right after all.
  const overrule = async () => {
    setMistakes((m) => ({ ...m, [word.i]: Math.max(0, (m[word.i] || 1) - 1) }));
    const outcome = await submitReview(word.i, Math.max(0, (mistakes[word.i] || 1) - 1));
    setResult({ right: true, stage: `${outcome.previous} → ${outcome.next}`, levelUp: outcome.leveledUpTo });
    setShowInfo(false);
  };

  function next() {
    const wasRight = result?.right;
    setResult(null);
    setPicked(null);
    setTyped('');
    setShowInfo(false);
    setRound((r) => r + 1);
    if (wasRight) {
      setDone((d) => d + 1);
      setQueue((q) => q.slice(1));
    } else setQueue((q) => [...q.slice(1), q[0]]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const pct = initial.length ? Math.round((done / initial.length) * 100) : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPrimary }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {done} done · {queue.length - (result?.right ? 1 : 0)} left
      </Text>
      <View style={[styles.track, { borderColor: colors.ink }]}>
        <View style={[styles.trackFill, { width: `${pct}%`, backgroundColor: colors.indigo }]} />
      </View>

      <View style={[styles.face, { backgroundColor: colors.quranSabaq }]}>
        <Text style={styles.faceArabic} adjustsFontSizeToFit numberOfLines={1}>
          {word.a}
        </Text>
        <Text style={styles.faceKind}>{KIND_LABEL[word.p]}</Text>
      </View>
      <Text style={[styles.question, { color: colors.ink }]}>What does it mean?</Text>

      {typing ? (
        <>
          <View style={[styles.inputWrap, { borderColor: colors.ink, backgroundColor: colors.bgSurface }]}>
            <TextInput
              ref={inputRef}
              value={typed}
              onChangeText={(v) => !result && setTyped(v)}
              onSubmitEditing={submitTyped}
              placeholder="Meaning, in Indonesian or English"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              accessibilityLabel="Meaning"
              style={[styles.input, { color: colors.ink }]}
            />
            <Pressable onPress={submitTyped} accessibilityRole="button" accessibilityLabel="Submit" style={styles.submit}>
              <Feather name="arrow-right" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.choices}>
          {choices.map((c) => {
            const state = !result ? 'idle' : c === right ? 'right' : c === picked ? 'wrong' : 'idle';
            return (
              <Pressable
                key={c}
                disabled={Boolean(result)}
                onPress={() => {
                  setPicked(c);
                  void grade(c === right);
                }}
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
      )}

      {result ? (
        <View style={[styles.result, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <View style={styles.resultTop}>
            <Text style={[styles.resultStatus, { color: colors.ink }]}>{result.right ? 'Correct' : 'Not quite'}</Text>
            {result.stage ? (
              <View style={[styles.stageChip, { backgroundColor: colors.indigo }]}>
                <Text style={styles.stageChipText}>{result.stage}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.body, { color: colors.ink }]}>
            {word.a} means {word.m.join(', ')}
            {word.e.length ? ` (${word.e.join(', ')})` : ''}.
          </Text>
          {result.levelUp ? (
            <View style={[styles.levelUp, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.levelUpText, { color: colors.success }]}>
                Level {result.levelUp} is open. New words are waiting in your lessons.
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Pressable
              onPress={() => setShowInfo((v) => !v)}
              accessibilityRole="button"
              style={[styles.ghost, { borderColor: colors.ink }]}
            >
              <Feather name={showInfo ? 'chevron-up' : 'info'} size={15} color={colors.ink} />
              <Text style={[styles.ghostText, { color: colors.ink }]}>{showInfo ? 'Hide info' : 'Word info'}</Text>
            </Pressable>
            <PressBlock accessibilityRole="button" onPress={next} style={[styles.btn, styles.flex, { backgroundColor: colors.indigo, minHeight: 44 }]}>
              <Text style={styles.btnText}>Next</Text>
            </PressBlock>
          </View>
          {typing && !result.right ? (
            <Pressable onPress={overrule} accessibilityRole="button" hitSlop={8} style={styles.overrule}>
              <Text style={[styles.link, { color: colors.indigo }]}>My answer was right. Count it.</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showInfo && result ? <QuranWordDetails word={word} showHeader={false} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  summary: { padding: 16, paddingTop: SPACING.xl, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '900' },
  body: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  link: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  flex: { flex: 1 },
  btn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  aheadBtn: { flexDirection: 'row', gap: 10 },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%' },
  face: { borderRadius: RADII.sm, minHeight: 190, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  faceArabic: { color: '#FFFFFF', fontSize: 72, lineHeight: 136, textAlign: 'center' },
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
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: RADII.sm, overflow: 'hidden' },
  input: { flex: 1, minHeight: 56, paddingHorizontal: 16, fontSize: 18, outlineStyle: 'none' } as any,
  submit: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  result: { borderRadius: RADII.sm, padding: SPACING.md, gap: 10 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  resultStatus: { fontSize: 18, fontWeight: '900' },
  stageChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.xs },
  stageChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  levelUp: { padding: 10, borderRadius: RADII.sm },
  levelUpText: { fontSize: 14, fontWeight: '700' },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderWidth: 2, borderRadius: RADII.sm },
  ghostText: { fontSize: 14, fontWeight: '700' },
  overrule: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
});
