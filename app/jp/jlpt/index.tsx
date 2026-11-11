import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeContext';
import { CARD_EDGE, PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../../src/theme/tokens';
import { PressBlock } from '../../../src/components/Stamp';
import { DRILL_SECTIONS, JLPT_LEVELS, JlptLevel, SECTION_INFO, levelCounts } from '../../../src/lib/jlpt-drill';
import { SectionStat, useJlptStore } from '../../../src/store/useJlptStore';

const pct = (s?: SectionStat) => (s && s.answered ? Math.round((s.correct / s.answered) * 100) : null);

/** JLPT drills: pick a level, then a mini test or one section. */
export default function JlptHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const level = useJlptStore((s) => s.lastLevel);
  const setLevel = useJlptStore((s) => s.setLastLevel);
  // Select the stored object itself (a fresh `{}` per render would loop).
  const levelStats = useJlptStore((s) => s.stats[level]);
  const stats = levelStats || {};
  const counts = levelCounts(level);

  const start = (section: string) => router.push(`/jp/jlpt/drill?level=${level}&section=${section}` as any);

  const all = DRILL_SECTIONS.map((s) => stats[s]).filter(Boolean) as SectionStat[];
  const answered = all.reduce((n, s) => n + s.answered, 0);
  const correct = all.reduce((n, s) => n + s.correct, 0);

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      {/* Level */}
      <View style={[styles.levels, { borderColor: colors.ink }]} accessibilityRole="tablist">
        {JLPT_LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => setLevel(l)}
            accessibilityRole="tab"
            accessibilityState={{ selected: l === level }}
            style={[styles.levelBtn, l === level && { backgroundColor: colors.ink }]}
          >
            <Text style={[styles.levelText, { color: l === level ? '#FFFFFF' : colors.ink }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {level}: {counts.words.toLocaleString()} words · {counts.kanji} kanji
        {answered ? ` · ${Math.round((correct / answered) * 100)}% right over ${answered} questions` : ''}
      </Text>

      {/* Mini test */}
      <PressBlock
        accessibilityRole="button"
        onPress={() => start('mixed')}
        style={[styles.test, { backgroundColor: colors.indigo }]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.testTitle}>{level} mini test</Text>
          <Text style={styles.testSub}>20 questions, 5 from each section, scored like the exam.</Text>
          {stats.mixed?.drills ? (
            <Text style={styles.testSub}>
              Best {stats.mixed.best}% · {stats.mixed.drills} {stats.mixed.drills === 1 ? 'test' : 'tests'} taken
            </Text>
          ) : null}
        </View>
        <Feather name="arrow-right" size={22} color="#FFFFFF" />
      </PressBlock>

      {/* Sections */}
      <Text style={[styles.h3, { color: colors.ink }]}>Practise one section</Text>
      {DRILL_SECTIONS.map((s) => {
        const info = SECTION_INFO[s];
        const st = stats[s];
        const acc = pct(st);
        return (
          <Pressable
            key={s}
            onPress={() => start(s)}
            accessibilityRole="button"
            accessibilityLabel={`${info.title}. ${info.about}`}
            style={({ pressed }) => [styles.section, TILE_LIP, { backgroundColor: colors.bgSurface }, pressed && PRESSED_BASE]}
          >
            <Text style={[styles.sectionJp, { color: colors.jpKanji }]}>{info.jp}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>{info.title}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{info.about}</Text>
              <Text style={[styles.meta, { color: acc === null ? colors.textMuted : colors.ink }]}>
                {acc === null
                  ? 'Not practised yet'
                  : `${acc}% right${st?.drills ? ` · best drill ${st.best}%` : ''}`}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        );
      })}

      {/* Next phases */}
      {[
        { jp: '文法', title: 'Grammar', about: 'Grammar forms in sentences.' },
        { jp: '読解', title: 'Reading', about: 'Short passages with questions.' },
      ].map((s) => (
        <View key={s.jp} style={[styles.section, styles.soon, { borderColor: colors.border }]}>
          <Text style={[styles.sectionJp, { color: colors.textMuted }]}>{s.jp}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{s.title}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{s.about} Coming in a later update.</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.credit, { color: colors.textMuted }]}>
        Vocabulary lists: open-anki-jlpt-decks (MIT), based on Jonathan Waller's JLPT resources. JLPT has published no
        official word lists since 2010, so levels are a close guide, not a guarantee.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  levels: { flexDirection: 'row', borderWidth: 2, borderRadius: RADII.sm, overflow: 'hidden' },
  levelBtn: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontSize: 16, fontWeight: '900' },
  meta: { fontSize: 13, lineHeight: 18 },
  h3: { fontSize: 16, fontWeight: '900', marginTop: 8 },
  test: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 96 },
  testTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  testSub: { color: '#E6E8F5', fontSize: 13, lineHeight: 18 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: RADII.sm },
  sectionJp: { fontSize: 18, fontWeight: '700', width: 76 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  soon: { borderWidth: 2, borderStyle: 'dashed' },
  credit: { fontSize: 11, lineHeight: 16, marginTop: 8 },
});
