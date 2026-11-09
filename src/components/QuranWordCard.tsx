import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { playWord, useWordPlaying } from '../lib/ayah-audio';
import { KIND_LABEL, QuranWord, QW_LEVELS } from '../data/quran-words';
import { AyahText, loadAyahText } from '../store/usePrayerTrack';
import { WordProgress } from '../store/useQuranWords';
import { WANIKANI_STAGES } from '../lib/srs-wanikani';
import { SURAHS } from '../data/surahs';
import { useTheme } from '../theme/ThemeContext';
import { RADII } from '../theme/tokens';

/** Colour for an SRS stage, matching the Japanese side. */
export function useStageColor() {
  const { colors } = useTheme();
  return (p?: WordProgress) => {
    if (!p) return colors.border;
    if (p.stage === 0) return colors.marigold;
    const bucket = WANIKANI_STAGES[p.stage].bucket;
    return bucket === 'Apprentice'
      ? colors.srsApprentice
      : bucket === 'Guru'
        ? colors.srsGuru
        : bucket === 'Master'
          ? colors.srsMaster
          : bucket === 'Enlightened'
            ? colors.srsEnlightened
            : colors.srsBurned;
  };
}

/** Everything about one word: meanings, root, how often it appears, forms and examples. */
export function QuranWordDetails({ word, showHeader = true }: { word: QuranWord; showHeader?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {showHeader ? (
        <View style={[styles.face, { backgroundColor: colors.quranSabaq }]}>
          <Text style={styles.faceArabic} adjustsFontSizeToFit numberOfLines={1}>
            {word.a}
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Meaning</Text>
        <Text style={[styles.meaning, { color: colors.ink }]}>{word.m.join(', ')}</Text>
        {word.e.length ? (
          <Text style={[styles.meaningEn, { color: colors.textSecondary }]}>{word.e.join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.facts}>
        <Fact label="Kind" value={KIND_LABEL[word.p]} />
        {word.r ? <Fact label="Root" value={word.r} arabic /> : null}
        <Fact label="In the Quran" value={`${word.n.toLocaleString()}×`} />
        <Fact label="Level" value={`${word.l}`} />
      </View>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Level {word.l} words take you to {QW_LEVELS[word.l - 1]?.coverage}% of the words in the Quran.
      </Text>

      {word.f.length > 1 || (word.f[0] && word.f[0][0] !== word.a) ? (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Most common forms</Text>
          <View style={styles.forms}>
            {word.f.map(([text, n]) => (
              <View key={text} style={[styles.formChip, { borderColor: colors.border }]}>
                <Text style={[styles.formArabic, { color: colors.ink }]}>{text}</Text>
                <Text style={[styles.formCount, { color: colors.textMuted }]}>{n}×</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>In an ayah</Text>
        {word.x.map((loc) => (
          <Example key={loc} loc={loc} />
        ))}
      </View>
    </View>
  );
}

function Fact({ label, value, arabic }: { label: string; value: string; arabic?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { borderColor: colors.border }]}>
      <Text style={[styles.factLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[arabic ? styles.factArabic : styles.factValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

/** An ayah with the word highlighted, and its meaning. */
function Example({ loc }: { loc: string }) {
  const { colors } = useTheme();
  const [s, a, w] = loc.split(':').map(Number);
  const [text, setText] = useState<AyahText | null>(null);
  const [failed, setFailed] = useState(false);
  const playing = useWordPlaying();
  useEffect(() => {
    let alive = true;
    loadAyahText(`${s}:${a}`)
      .then((t) => alive && setText(t))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [s, a]);

  return (
    <View style={[styles.example, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
      {failed ? (
        <Text style={[styles.note, { color: colors.textSecondary }]}>Couldn't load {s}:{a}. Check your connection.</Text>
      ) : !text ? (
        <ActivityIndicator color={colors.indigo} />
      ) : (
        <>
          <Text style={[styles.exampleArabic, { color: colors.ink }]}>
            {text.words.map((word, i) => (
              <Text
                key={i}
                onPress={() => playWord(`${s}:${a}`, i + 1)}
                style={
                  playing === `${s}:${a}:${i + 1}`
                    ? { color: colors.indigo, backgroundColor: colors.indigoBg }
                    : i === w - 1
                      ? { color: colors.quranSabaq, backgroundColor: colors.quranSabaqBg }
                      : undefined
                }
              >
                {word.arabic}
                {i < text.words.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>
          {text.words[w - 1]?.meaning ? (
            <Pressable
              onPress={() => playWord(`${s}:${a}`, w)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${text.words[w - 1].meaning}`}
              hitSlop={6}
              style={styles.exampleWordRow}
            >
              <Feather name="volume-2" size={16} color={colors.quranSabaq} />
              <Text style={[styles.exampleWord, { color: colors.quranSabaq }]}>
                {text.words[w - 1].arabic} = {text.words[w - 1].meaning}
              </Text>
            </Pressable>
          ) : null}
          <Text style={[styles.exampleMeaning, { color: colors.textSecondary }]}>{text.translationId}</Text>
          <Text style={[styles.exampleKey, { color: colors.textMuted }]}>
            {SURAHS[s - 1]?.name} {s}:{a}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  face: { borderRadius: RADII.sm, minHeight: 150, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  faceArabic: { color: '#FFFFFF', fontSize: 64, lineHeight: 120, textAlign: 'center' },
  section: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  meaning: { fontSize: 20, lineHeight: 26, fontWeight: '900' },
  meaningEn: { fontSize: 14, lineHeight: 20 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { borderWidth: 1, borderRadius: RADII.xs, paddingHorizontal: 10, paddingVertical: 6, minWidth: 72 },
  factLabel: { fontSize: 11, fontWeight: '700' },
  factValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  factArabic: { fontSize: 18, lineHeight: 34 },
  note: { fontSize: 13, lineHeight: 18 },
  forms: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  formChip: { borderWidth: 1, borderRadius: RADII.xs, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  formArabic: { fontSize: 22, lineHeight: 42 },
  formCount: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  example: { borderRadius: RADII.sm, borderWidth: 1, padding: 12, gap: 6 },
  exampleArabic: { fontSize: 24, lineHeight: 48, textAlign: 'right', writingDirection: 'rtl' },
  exampleWordRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  exampleWord: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  exampleMeaning: { fontSize: 13, lineHeight: 19 },
  exampleKey: { fontSize: 12, fontWeight: '700' },
});
