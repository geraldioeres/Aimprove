import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { TAJWEED_BY_ID, TAJWEED_GROUPS, TAJWEED_RULES, TajweedRule } from '../../src/data/tajweed';
import { SURAHS } from '../../src/data/surahs';

export default function TajweedScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ rule?: string }>();
  const initial = params.rule && TAJWEED_BY_ID[params.rule] ? params.rule : null;
  const [open, setOpen] = useState<string | null>(initial);
  const scrollRef = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  return (
    <ScrollView ref={scrollRef} style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.headRow}>
          <Text style={[styles.h2, { color: colors.ink }]} accessibilityRole="header">
            Tajweed
          </Text>
          <Text style={[styles.h2Arabic, { color: colors.ink }]}>التجويد</Text>
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Tap a rule to see when it applies and how to read it. The colours match the coloured ayah in Ayah by prayer.
        </Text>
      </View>

      {TAJWEED_GROUPS.map((g) => (
        <View
          key={g.id}
          style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y;
            if (initial && !scrolled.current && TAJWEED_BY_ID[initial].group === g.id) {
              scrolled.current = true;
              setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false }), 0);
            }
          }}
        >
          <View style={styles.headRow}>
            <Text style={[styles.h3, { color: colors.ink }]}>{g.title}</Text>
            <Text style={[styles.groupArabic, { color: colors.textSecondary }]}>{g.arabic}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{g.intro}</Text>

          {TAJWEED_RULES.filter((r) => r.group === g.id).map((r) => {
            const isOpen = open === r.id;
            return (
              <View key={r.id} style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => setOpen(isOpen ? null : r.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`${r.name}, ${isOpen ? 'hide' : 'show'} details`}
                  style={({ pressed }) => [styles.ruleRow, pressed && { backgroundColor: colors.bgMuted }]}
                >
                  <View style={[styles.swatch, { backgroundColor: r.color }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.ruleName, { color: colors.ink }]}>{r.name}</Text>
                    {r.length ? (
                      <Text style={[styles.meta, { color: colors.textMuted }]}>{r.length}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.ruleArabic, { color: colors.ink }]}>{r.arabic}</Text>
                  <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.ink} />
                </Pressable>
                {isOpen ? <RuleDetail rule={r} /> : null}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function RuleDetail({ rule }: { rule: TajweedRule }) {
  const { colors } = useTheme();
  const [surah] = rule.example.key.split(':').map(Number);
  const [before, mark, after] = rule.example.parts;
  return (
    <View style={styles.detail}>
      <View style={[styles.example, { borderColor: colors.ink }]}>
        <Text style={[styles.exampleArabic, { color: colors.ink }]}>
          {before}
          <Text style={{ color: rule.color, textDecorationLine: 'underline' }}>{mark}</Text>
          {after}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {SURAHS[surah - 1]?.name} {rule.example.key}
        </Text>
        {rule.example.note ? <Text style={[styles.note, { color: colors.ink }]}>{rule.example.note}</Text> : null}
      </View>

      <View style={styles.fact}>
        <Text style={[styles.label, { color: colors.textMuted }]}>When</Text>
        <Text style={[styles.body, { color: colors.ink }]}>{rule.when}</Text>
      </View>
      <View style={styles.fact}>
        <Text style={[styles.label, { color: colors.textMuted }]}>How to read it</Text>
        <Text style={[styles.body, { color: colors.ink }]}>{rule.how}</Text>
      </View>
      {rule.letters ? (
        <View style={styles.fact}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Letters</Text>
          <View style={styles.letters}>
            {rule.letters.map((l) => (
              <View key={l} style={[styles.letter, { borderColor: colors.ink }]}>
                <Text style={[styles.letterText, { color: colors.ink }]}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 8 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  h2: { fontSize: 22, fontWeight: '900' },
  h2Arabic: { fontSize: 24, lineHeight: 44, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '900', flexShrink: 1 },
  groupArabic: { fontSize: 17, lineHeight: 32 },
  body: { fontSize: 14, lineHeight: 21 },
  meta: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  ruleName: { fontSize: 15, fontWeight: '700' },
  ruleArabic: { fontSize: 18, lineHeight: 34 },
  detail: { gap: 12, paddingBottom: 14 },
  example: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: RADII.sm, padding: 14, gap: 4 },
  exampleArabic: { fontSize: 28, lineHeight: 56, textAlign: 'right', writingDirection: 'rtl' },
  note: { fontSize: 14, lineHeight: 26, fontWeight: '700' },
  fact: { gap: 2 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  letter: { minWidth: 40, height: 40, borderWidth: 1.5, borderRadius: RADII.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  letterText: { fontSize: 22, lineHeight: 40 },
});
