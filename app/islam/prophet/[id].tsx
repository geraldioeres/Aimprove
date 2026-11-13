import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../../src/theme/tokens';
import { PROPHETS } from '../../../src/data/prophets';
import { SURAHS } from '../../../src/data/surahs';

/** One prophet's story: who they were sent to, the story, lessons and where to read it. */
export default function ProphetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = Math.max(0, PROPHETS.findIndex((p) => p.id === id));
  const p = PROPHETS[index];
  const prev = PROPHETS[index - 1];
  const next = PROPHETS[index + 1];
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [id]);

  const isLast = p.id === 'muhammad';

  return (
    <ScrollView ref={scrollRef} style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: p.name }} />

      <View style={[styles.hero, CARD_EDGE, { backgroundColor: colors.quranSabaqBg }]}>
        <Text style={[styles.count, { color: colors.textSecondary }]}>Prophet {index + 1} of 25</Text>
        <Text style={[styles.arabic, { color: colors.quranSabaq }]}>{p.arabic}</Text>
        <Text style={[styles.name, { color: colors.ink }]}>{p.name}</Text>
        {!isLast ? <Text style={[styles.salam, { color: colors.textSecondary }]}>'alayhis-salam · peace be upon him</Text> : null}
        {p.known ? <Text style={[styles.meta, { color: colors.textSecondary }]}>Known as {p.known}</Text> : null}
        {p.sentTo ? (
          <View style={styles.sentRow}>
            <Feather name="users" size={14} color={colors.ink} />
            <Text style={[styles.sent, { color: colors.ink }]}>{p.sentTo}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.title, { color: colors.ink }]}>The story</Text>
        {p.story.map((para, i) => (
          <Text key={i} style={[styles.body, { color: colors.ink }]}>
            {para}
          </Text>
        ))}
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Lessons</Text>
        {p.lessons.map((l, i) => (
          <View key={i} style={styles.lesson}>
            <View style={[styles.dot, { backgroundColor: colors.quranSabaq }]} />
            <Text style={[styles.body, styles.lessonText, { color: colors.ink }]}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Read it in the Quran</Text>
        {p.refs.map((r, i) => (
          <Pressable
            key={`${r.surah}:${r.ayah}`}
            onPress={() => router.push(`/mushaf/surah/${r.surah}?from=${r.ayah}` as any)}
            accessibilityRole="link"
            accessibilityLabel={`${SURAHS[r.surah - 1]?.name} ${r.surah}:${r.ayah}. ${r.about}. Open in the reader`}
            style={({ pressed }) => [
              styles.ref,
              i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <View style={styles.refText}>
              <Text style={[styles.refWhere, { color: colors.indigo }]}>
                {SURAHS[r.surah - 1]?.name} {r.surah}:{r.ayah}
                {r.to ? `–${r.to}` : ''}
              </Text>
              <Text style={[styles.refAbout, { color: colors.textSecondary }]}>{r.about}</Text>
            </View>
            <Feather name="book-open" size={18} color={colors.indigo} />
          </Pressable>
        ))}
      </View>

      <View style={styles.navRow}>
        {prev ? (
          <Pressable
            onPress={() => router.setParams({ id: prev.id })}
            accessibilityRole="button"
            accessibilityLabel={`Previous: ${prev.name}`}
            style={[styles.navBtn, { borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={18} color={colors.indigo} />
            <Text style={[styles.link, { color: colors.indigo }]} numberOfLines={1}>
              {prev.name}
            </Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {next ? (
          <Pressable
            onPress={() => router.setParams({ id: next.id })}
            accessibilityRole="button"
            accessibilityLabel={`Next: ${next.name}`}
            style={[styles.navBtn, styles.navNext, { borderColor: colors.border }]}
          >
            <Text style={[styles.link, { color: colors.indigo }]} numberOfLines={1}>
              {next.name}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.indigo} />
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hero: { borderRadius: RADII.sm, padding: 18, alignItems: 'center', gap: 2 },
  count: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  arabic: { fontSize: 40, lineHeight: 72 },
  name: { fontSize: 24, fontWeight: '900' },
  salam: { fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  meta: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 8 },
  sent: { fontSize: 14, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  card: { borderRadius: RADII.sm, padding: 16, gap: 10 },
  title: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 15, fontWeight: '500', lineHeight: 24 },
  lesson: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  lessonText: { flex: 1 },
  ref: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  refText: { flex: 1, gap: 2 },
  refWhere: { fontSize: 15, fontWeight: '800' },
  refAbout: { fontSize: 13, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  navNext: { justifyContent: 'flex-end' },
  link: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
});
