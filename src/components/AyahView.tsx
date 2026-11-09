import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { parseTajweed, TajweedRule } from '../data/tajweed';
import type { AyahText } from '../store/usePrayerTrack';
import { useTheme } from '../theme/ThemeContext';
import { CARD_EDGE, RADII } from '../theme/tokens';
import { PressBlock } from './Stamp';
import { playWord, useWordPlaying } from '../lib/ayah-audio';

/**
 * One ayah: word-by-word tiles, tajweed-coloured text (tap a colour to see the
 * rule), or plain Arabic, then the key and the Indonesian meaning.
 */
export function AyahView({
  text,
  wordByWord,
  tajweed,
  meaning = true,
  showKey = true,
  onRule,
}: {
  text: AyahText;
  wordByWord: boolean;
  tajweed: boolean;
  meaning?: boolean;
  showKey?: boolean;
  onRule: (rule: TajweedRule) => void;
}) {
  const { colors } = useTheme();
  const t = text;
  const wordPlaying = useWordPlaying();
  return (
    <>
      {wordByWord && t.words.length ? (
        <View style={styles.words}>
          {t.words.map((w, j) => {
            const playing = wordPlaying === `${t.key}:${j + 1}`;
            return (
              <Pressable
                key={j}
                onPress={() => playWord(t.key, j + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Play word: ${w.meaning || w.arabic}`}
                style={({ pressed }) => [
                  styles.wordTile,
                  { borderColor: playing ? colors.indigo : colors.border },
                  playing && { backgroundColor: colors.indigoBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.wordArabic, { color: colors.ink }]}>{w.arabic}</Text>
                {meaning ? (
                  <Text style={[styles.wordMeaning, { color: colors.textSecondary }]}>{w.meaning}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : tajweed && t.tajweed ? (
        <Text style={[styles.arabic, { color: colors.ink }]}>
          {parseTajweed(t.tajweed).map((seg, j) =>
            seg.rule ? (
              <Text
                key={j}
                onPress={() => onRule(seg.rule!)}
                accessibilityRole="link"
                accessibilityLabel={seg.rule.name}
                style={{ color: seg.rule.color }}
              >
                {seg.text}
              </Text>
            ) : (
              <Text key={j}>{seg.text}</Text>
            )
          )}
        </Text>
      ) : (
        <Text style={[styles.arabic, { color: colors.ink }]}>{t.arabic}</Text>
      )}
      {showKey ? <Text style={[styles.ayahKey, { color: colors.textMuted }]}>{t.key}</Text> : null}
      {meaning && t.translationId ? (
        <Text style={[styles.translation, { color: colors.textSecondary }]}>{t.translationId}</Text>
      ) : null}
    </>
  );
}

/** A short explanation of one tajweed rule, opened by tapping a coloured part. */
export function RuleSheet({
  rule,
  onClose,
  onMore,
}: {
  rule: TajweedRule | null;
  onClose: () => void;
  onMore: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={Boolean(rule)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
        {rule ? (
          <Pressable
            onPress={() => {}}
            style={[styles.sheet, CARD_EDGE, { backgroundColor: colors.bgSurface }]}
            accessibilityViewIsModal
          >
            <View style={styles.sheetHead}>
              <View style={[styles.sheetSwatch, { backgroundColor: rule.color }]} />
              <Text style={[styles.h3, { color: colors.ink, flex: 1 }]} accessibilityRole="header">
                {rule.name}
              </Text>
              <Text style={[styles.sheetArabic, { color: colors.ink }]}>{rule.arabic}</Text>
            </View>
            {rule.length ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{rule.length}</Text>
            ) : null}
            <View style={{ gap: 2 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>How to read it</Text>
              <Text style={[styles.body, { color: colors.ink }]}>{rule.how}</Text>
            </View>
            <View style={{ gap: 2 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>When</Text>
              <Text style={[styles.body, { color: colors.ink }]}>{rule.when}</Text>
            </View>
            <View style={styles.sheetActions}>
              <Pressable onPress={() => onMore(rule.id)} accessibilityRole="link" hitSlop={8} style={styles.inlineBtn}>
                <Text style={[styles.link, { color: colors.indigo }]}>See full rule</Text>
                <Feather name="chevron-right" size={16} color={colors.indigo} />
              </Pressable>
              <PressBlock
                onPress={onClose}
                accessibilityRole="button"
                style={[styles.sheetClose, { backgroundColor: colors.bgSurface }]}
              >
                <Text style={[styles.closeText, { color: colors.ink }]}>Close</Text>
              </PressBlock>
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  wordTile: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  wordArabic: { fontSize: 26, lineHeight: 48, writingDirection: 'rtl' },
  wordMeaning: { fontSize: 12, lineHeight: 16, textAlign: 'center', maxWidth: 140 },
  arabic: { fontSize: 26, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  ayahKey: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  translation: { fontSize: 14, lineHeight: 21 },
  h3: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 18 },
  link: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700' },
  closeText: { fontSize: 15, fontWeight: '700' },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  scrim: { flex: 1, backgroundColor: 'rgba(22,22,26,0.45)', justifyContent: 'flex-end', padding: 16 },
  sheet: { borderRadius: RADII.sm, padding: 18, gap: 12, width: '100%', maxWidth: 520, alignSelf: 'center' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetSwatch: { width: 14, height: 14, borderRadius: 7 },
  sheetArabic: { fontSize: 20, lineHeight: 38 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  sheetClose: { minHeight: 44, minWidth: 96, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
});
