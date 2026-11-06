import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../../src/theme/tokens';
import { QuranWordDetails, useStageColor } from '../../../src/components/QuranWordCard';
import { QW_BY_ID, mainMeaning } from '../../../src/data/quran-words';
import { useQuranWords } from '../../../src/store/useQuranWords';
import { WANIKANI_STAGES } from '../../../src/lib/srs-wanikani';

export default function QuranWordScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const word = QW_BY_ID[decodeURIComponent(id || '')];
  const p = useQuranWords((s) => (word ? s.progress[word.i] : undefined));
  const stageColor = useStageColor();

  if (!word) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <Text style={{ color: colors.textSecondary }}>That word isn't in the list.</Text>
      </View>
    );
  }

  const status = !p
    ? `Locked until level ${word.l}`
    : p.stage === 0
      ? 'Waiting in your lessons'
      : `${WANIKANI_STAGES[p.stage].name}${p.next ? ` · next review ${new Date(p.next).toLocaleString()}` : ''}`;

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: mainMeaning(word) }} />
      <View style={[styles.status, { borderColor: stageColor(p) }]}>
        <View style={[styles.dot, { backgroundColor: stageColor(p) }]} />
        <Text style={[styles.statusText, { color: colors.ink }]}>{status}</Text>
      </View>
      <QuranWordDetails word={word} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: RADII.sm, padding: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statusText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
});
