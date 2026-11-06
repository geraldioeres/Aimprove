import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { JPSubject } from '../data/jp-seed';
import { useTheme } from '../theme/ThemeContext';

type ReadingSource = Pick<JPSubject, 'kind' | 'readings' | 'readingType' | 'onyomi' | 'kunyomi'>;

/** True when a subject's readings can be shown as on'yomi and kun'yomi. */
export const hasReadingSplit = (s?: ReadingSource | null): boolean =>
  Boolean(s && s.kind === 'kanji' && (s.onyomi?.length || s.kunyomi?.length));

/** One line for messages: "On'yomi たい、だい · Kun'yomi おお", or the plain list for vocabulary. */
export function readingsText(s: ReadingSource | null | undefined, fallback: string[] = []): string {
  if (!s || !hasReadingSplit(s)) return (s?.readings || fallback).join(' · ');
  const parts: string[] = [];
  if (s.onyomi?.length) parts.push(`On'yomi ${s.onyomi.join('、')}`);
  if (s.kunyomi?.length) parts.push(`Kun'yomi ${s.kunyomi.join('、')}`);
  return parts.join(' · ');
}

/**
 * A kanji's readings in two columns, On'yomi and Kun'yomi, like WaniKani.
 * The type this kanji is taught with is in full ink; the other is muted.
 */
export function KanjiReadings({ subject, size = 'normal' }: { subject: ReadingSource; size?: 'normal' | 'big' }) {
  const { colors } = useTheme();
  const taught = subject.readingType === 'kunyomi' ? 'kunyomi' : 'onyomi';
  const cols = [
    { key: 'onyomi' as const, label: "On'yomi", list: subject.onyomi || [] },
    { key: 'kunyomi' as const, label: "Kun'yomi", list: subject.kunyomi || [] },
  ];
  return (
    <View style={styles.row}>
      {cols.map((c) => {
        const main = c.key === taught;
        return (
          <View key={c.key} style={styles.col} accessible accessibilityLabel={`${c.label}: ${c.list.join(', ') || 'none'}`}>
            <Text style={[styles.label, { color: main ? colors.textSecondary : colors.textMuted }]}>{c.label}</Text>
            <Text
              style={[
                size === 'big' ? styles.big : styles.normal,
                { color: c.list.length === 0 ? colors.textMuted : main ? colors.textPrimary : colors.textMuted },
                main ? styles.strong : null,
              ]}
            >
              {c.list.length ? c.list.join('、') : 'None'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 8 },
  col: { minWidth: 110, flexShrink: 1, gap: 2 },
  label: { fontSize: 12, fontWeight: '700' },
  normal: { fontSize: 17, lineHeight: 24 },
  big: { fontSize: 22, lineHeight: 30 },
  strong: { fontWeight: '700' },
});
