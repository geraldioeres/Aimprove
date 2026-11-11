import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../../src/theme/tokens';
import { PressBlock, StampSeal } from '../../../src/components/Stamp';
import { useEnterKey } from '../../../src/lib/use-enter-key';
import {
  buildDrill,
  DRILL_SECTIONS,
  DrillQuestion,
  DrillSection,
  JLPT_LEVELS,
  JlptLevel,
  SECTION_INFO,
} from '../../../src/lib/jlpt-drill';
import { useJlptStore } from '../../../src/store/useJlptStore';

/** A fresh drill per URL, so "Try again" can replace this screen with itself. */
export default function JlptDrillScreen() {
  const params = useLocalSearchParams<{ level?: string; section?: string; t?: string }>();
  const level = (JLPT_LEVELS.includes(params.level as JlptLevel) ? params.level : 'N5') as JlptLevel;
  const section = (DRILL_SECTIONS.includes(params.section as DrillSection) ? params.section : 'mixed') as
    | DrillSection
    | 'mixed';
  return <Drill key={`${level}-${section}-${params.t ?? ''}`} level={level} section={section} />;
}

function Drill({ level, section }: { level: JlptLevel; section: DrillSection | 'mixed' }) {
  const router = useRouter();
  const { colors } = useTheme();
  const recordDrill = useJlptStore((s) => s.recordDrill);
  const questions = useMemo(() => buildDrill(level, section), [level, section]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]); // chosen option per question
  const saved = useRef(false);

  const q = questions[index] as DrillQuestion | undefined;
  const finished = index >= questions.length;
  const title = section === 'mixed' ? `${level} mini test` : `${level} · ${SECTION_INFO[section].title}`;

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    setAnswers((a) => [...a, i]);
  };
  const next = () => {
    if (picked === null) return;
    setPicked(null);
    setIndex((n) => n + 1);
  };

  // Keyboard on the web: 1-4 pick an answer, Enter goes on.
  useEnterKey(finished ? () => router.back() : picked !== null ? next : null);
  useEffect(() => {
    if (Platform.OS !== 'web' || finished) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4 && !e.ctrlKey && !e.metaKey && !e.altKey) choose(n - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Save once when the drill ends.
  useEffect(() => {
    if (!finished || saved.current || questions.length === 0) return;
    saved.current = true;
    const per: Partial<Record<DrillSection, { answered: number; correct: number }>> = {};
    questions.forEach((qq, i) => {
      const r = per[qq.section] || { answered: 0, correct: 0 };
      r.answered += 1;
      if (answers[i] === qq.answer) r.correct += 1;
      per[qq.section] = r;
    });
    void recordDrill(level, section, per);
  }, [finished, questions, answers, level, section, recordDrill]);

  if (questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.body, { color: colors.textSecondary }]}>No questions for this level yet.</Text>
      </View>
    );
  }

  if (finished) {
    const total = questions.length;
    const right = questions.filter((qq, i) => answers[i] === qq.answer).length;
    const score = Math.round((right / total) * 100);
    const sections = DRILL_SECTIONS.filter((s) => questions.some((qq) => qq.section === s));
    const mistakes = questions.map((qq, i) => ({ qq, chose: answers[i] })).filter((m) => m.chose !== m.qq.answer);
    return (
      <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title }} />
        <View style={styles.scoreRow}>
          {score >= 80 ? <StampSeal size={96} slam seed={`${level}-${section}-${right}`} /> : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.score, { color: colors.ink }]}>{score}%</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {right} of {total} right{score >= 80 ? '. Well done.' : score >= 60 ? '. Close to a pass.' : '. Keep drilling.'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          {sections.map((s, i) => {
            const qs = questions.map((qq, j) => ({ qq, j })).filter((x) => x.qq.section === s);
            const ok = qs.filter((x) => answers[x.j] === x.qq.answer).length;
            return (
              <View key={s} style={[styles.secRow, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.secJp, { color: colors.jpKanji }]}>{SECTION_INFO[s].jp}</Text>
                <Text style={[styles.secName, { color: colors.ink }]}>{SECTION_INFO[s].title}</Text>
                <Text style={[styles.secScore, { color: colors.ink }]}>
                  {ok}/{qs.length}
                </Text>
              </View>
            );
          })}
        </View>

        {mistakes.length ? (
          <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
            <Text style={[styles.h3, { color: colors.ink }]}>Your mistakes</Text>
            {mistakes.map(({ qq, chose }, i) => (
              <View key={qq.id} style={[styles.mistake, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.mistakePrompt, { color: colors.ink }]}>{qq.prompt}</Text>
                <Text style={[styles.meta, { color: colors.danger }]}>You chose {qq.options[chose]}</Text>
                <Text style={[styles.meta, { color: colors.success }]}>Answer: {qq.options[qq.answer]}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{qq.explain}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          <PressBlock
            accessibilityRole="button"
            onPress={() => router.replace(`/jp/jlpt/drill?level=${level}&section=${section}&t=${Date.now()}` as any)}
            style={[styles.btn, styles.flex, { backgroundColor: colors.indigo }]}
          >
            <Text style={styles.btnText}>New drill</Text>
          </PressBlock>
          <PressBlock
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.btn, styles.flex, { backgroundColor: colors.bgSurface }]}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Done</Text>
          </PressBlock>
        </View>
      </ScrollView>
    );
  }

  const info = SECTION_INFO[q!.section];
  const answered = picked !== null;
  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title }} />
      <View style={styles.topRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {index + 1} of {questions.length}
        </Text>
        <Text style={[styles.meta, { color: colors.jpKanji, fontWeight: '700' }]}>
          {info.jp} · {info.title}
        </Text>
      </View>
      <View style={[styles.track, { borderColor: colors.ink }]}>
        <View style={[styles.trackFill, { width: `${(index / questions.length) * 100}%`, backgroundColor: colors.indigo }]} />
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.ask, { color: colors.textSecondary }]}>{q!.ask}</Text>
        <Text
          style={[q!.promptLang === 'ja' ? styles.promptJa : styles.promptEn, { color: colors.ink }]}
          adjustsFontSizeToFit
          numberOfLines={q!.promptLang === 'ja' ? 1 : 3}
        >
          {q!.prompt}
        </Text>
      </View>

      <View style={styles.options}>
        {q!.options.map((o, i) => {
          const state = !answered ? 'idle' : i === q!.answer ? 'right' : i === picked ? 'wrong' : 'idle';
          return (
            <Pressable
              key={`${i}-${o}`}
              disabled={answered}
              onPress={() => choose(i)}
              accessibilityRole="button"
              accessibilityLabel={`Option ${i + 1}: ${o}`}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: state === 'right' ? colors.success : state === 'wrong' ? colors.danger : colors.ink,
                  backgroundColor: state === 'right' ? colors.successBg : state === 'wrong' ? colors.dangerBg : colors.bgSurface,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.optNum, { color: colors.textMuted }]}>{i + 1}</Text>
              <Text style={[q!.optionLang === 'ja' ? styles.optJa : styles.optEn, { color: colors.ink }]}>{o}</Text>
              {state === 'right' ? <Feather name="check" size={18} color={colors.success} /> : null}
              {state === 'wrong' ? <Feather name="x" size={18} color={colors.danger} /> : null}
            </Pressable>
          );
        })}
      </View>

      {answered ? (
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.h3, { color: picked === q!.answer ? colors.success : colors.danger }]}>
            {picked === q!.answer ? 'Correct' : 'Not quite'}
          </Text>
          <Text style={[styles.body, { color: colors.ink }]}>{q!.explain}</Text>
          <PressBlock accessibilityRole="button" onPress={next} style={[styles.btn, { backgroundColor: colors.indigo }]}>
            <Text style={styles.btnText}>{index + 1 < questions.length ? 'Next' : 'See results'}</Text>
          </PressBlock>
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {Platform.OS === 'web' ? 'Tip: press 1–4 to answer, Enter for the next question.' : ' '}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 10 },
  ask: { fontSize: 14, fontWeight: '700' },
  promptJa: { fontSize: 44, lineHeight: 64, fontWeight: '700', textAlign: 'center' },
  promptEn: { fontSize: 22, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderRadius: RADII.sm,
  },
  optNum: { width: 16, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  optJa: { flex: 1, fontSize: 22, lineHeight: 32 },
  optEn: { flex: 1, fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center' },
  h3: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, lineHeight: 18 },
  btn: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  score: { fontSize: 48, lineHeight: 56, fontWeight: '900' },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  secJp: { width: 76, fontSize: 16, fontWeight: '700' },
  secName: { flex: 1, fontSize: 15, fontWeight: '700' },
  secScore: { fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  mistake: { paddingVertical: 10, gap: 2 },
  mistakePrompt: { fontSize: 22, lineHeight: 32, fontWeight: '700' },
});
