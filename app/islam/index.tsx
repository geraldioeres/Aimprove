import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { dayNumber, factOfDay } from '../../src/data/islam-facts';
import { PROPHETS } from '../../src/data/prophets';

/** Islamic knowledge: a fact a day, and the stories of the 25 prophets. */
export default function IslamScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const today = useMemo(() => dayNumber(), []);
  const [back, setBack] = useState(0); // days before today
  const day = today - back;
  const fact = factOfDay(day);

  const when =
    back === 0
      ? 'Today'
      : back === 1
        ? 'Yesterday'
        : new Date(day * 86400000).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]} accessibilityLiveRegion="polite">
        <View style={styles.factHead}>
          <View style={[styles.badge, { backgroundColor: colors.marigoldBg, borderColor: colors.ink }]}>
            <Feather name="sun" size={14} color={colors.ink} />
            <Text style={[styles.badgeText, { color: colors.ink }]}>Fact of the day</Text>
          </View>
          <Text style={[styles.when, { color: colors.textSecondary }]}>{when}</Text>
        </View>
        <Text style={[styles.factTitle, { color: colors.ink }]}>{fact.title}</Text>
        <Text style={[styles.body, { color: colors.ink }]}>{fact.body}</Text>
        {fact.ayah ? (
          <Pressable
            onPress={() => router.push(`/mushaf/surah/${fact.ayah!.surah}?from=${fact.ayah!.ayah}` as any)}
            accessibilityRole="link"
            accessibilityLabel={`${fact.source}. Open in the reader`}
            hitSlop={6}
            style={styles.sourceRow}
          >
            <Feather name="book-open" size={14} color={colors.indigo} />
            <Text style={[styles.source, { color: colors.indigo }]}>{fact.source}</Text>
          </Pressable>
        ) : (
          <View style={styles.sourceRow}>
            <Feather name="bookmark" size={14} color={colors.textSecondary} />
            <Text style={[styles.source, { color: colors.textSecondary }]}>{fact.source}</Text>
          </View>
        )}
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <View style={styles.dayNav}>
          <Pressable
            onPress={() => setBack((b) => b + 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous day's fact"
            hitSlop={6}
            style={styles.dayBtn}
          >
            <Feather name="chevron-left" size={18} color={colors.indigo} />
            <Text style={[styles.link, { color: colors.indigo }]}>Earlier</Text>
          </Pressable>
          {back > 0 ? (
            <Pressable
              onPress={() => setBack((b) => Math.max(0, b - 1))}
              accessibilityRole="button"
              accessibilityLabel="Next day's fact"
              hitSlop={6}
              style={styles.dayBtn}
            >
              <Text style={[styles.link, { color: colors.indigo }]}>{back === 1 ? 'Today' : 'Later'}</Text>
              <Feather name="chevron-right" size={18} color={colors.indigo} />
            </Pressable>
          ) : (
            <Text style={[styles.note, { color: colors.textMuted }]}>A new one tomorrow</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.section, { color: colors.ink }]}>Stories of the Prophets</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          The 25 prophets named in the Quran. Peace be upon them all.
        </Text>
      </View>
      <View style={[styles.list, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        {PROPHETS.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/islam/prophet/${p.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`${i + 1}. ${p.name}. ${p.summary}`}
            style={({ pressed }) => [
              styles.row,
              i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              pressed && { backgroundColor: colors.bgMuted },
            ]}
          >
            <View style={[styles.num, { borderColor: colors.ink }]}>
              <Text style={[styles.numText, { color: colors.ink }]}>{i + 1}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                {p.name}
                {p.known ? <Text style={[styles.known, { color: colors.textSecondary }]}>  {p.known.split(',')[0]}</Text> : null}
              </Text>
              <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
                {p.summary}
              </Text>
            </View>
            <Text style={[styles.arabic, { color: colors.quranSabaq }]}>{p.arabic}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 10 },
  factHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  when: { fontSize: 13, fontWeight: '700' },
  factTitle: { fontSize: 20, fontWeight: '900', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '500', lineHeight: 23 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  source: { fontSize: 13, fontWeight: '700' },
  rule: { height: 1, marginTop: 2 },
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  dayBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  link: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  sectionHead: { gap: 2, marginTop: 8 },
  section: { fontSize: 18, fontWeight: '900' },
  list: { borderRadius: RADII.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 64 },
  num: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rowText: { flex: 1, gap: 1 },
  name: { fontSize: 16, fontWeight: '800' },
  known: { fontSize: 13, fontWeight: '500' },
  summary: { fontSize: 13, lineHeight: 18 },
  arabic: { fontSize: 22, lineHeight: 40 },
});
