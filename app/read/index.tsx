import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { PressBlock } from '../../src/components/Stamp';
import { SURAHS } from '../../src/data/surahs';
import { JUZ_START, juzLabel, juzParts } from '../../src/data/juz';
import { LAST_READ_KEY } from '../../src/lib/ayah-audio';

// "Al-Baqarah" -> "albaqarah", so "baqarah" or "al baqara" both match.
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const PRACTICE_KEY = 'aimprove.read.practice.v1';

/**
 * Read: pick a surah or a juz and read it, with tajweed colours, meaning and
 * per-ayah audio. Practice mode opens it set up for listen-and-repeat.
 */
export default function ReadScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tab, setTab] = useState<'surah' | 'juz'>('surah');
  const [query, setQuery] = useState('');
  const [openJuz, setOpenJuz] = useState<number | null>(null);
  const [practice, setPractice] = useState(false);
  const [last, setLast] = useState<{ surah: number; ayah: number } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PRACTICE_KEY)
      .then((v) => setPractice(v === '1'))
      .catch(() => {});
  }, []);

  // Refresh "Continue" whenever the screen comes back into view.
  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(LAST_READ_KEY)
        .then((raw) => setLast(raw ? JSON.parse(raw) : null))
        .catch(() => {});
    }, [])
  );

  const togglePractice = (on: boolean) => {
    setPractice(on);
    AsyncStorage.setItem(PRACTICE_KEY, on ? '1' : '0').catch(() => {});
  };

  const open = (surah: number, from?: number, forcePractice?: boolean) => {
    const q: string[] = [];
    if (from && from > 1) q.push(`from=${from}`);
    if (practice || forcePractice) q.push('practice=1');
    router.push(`/mushaf/surah/${surah}${q.length ? `?${q.join('&')}` : ''}` as any);
  };

  const surahs = useMemo(() => {
    const all = SURAHS.map((s, i) => ({ ...s, number: i + 1 }));
    const q = squash(query);
    if (!q) return all;
    return all.filter((s) => (/^[0-9]+$/.test(q) ? String(s.number) === q : squash(s.name).includes(q)));
  }, [query]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPrimary }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Fluency practice */}
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.h3, { color: colors.ink }]}>Practise reading fluently</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Listen to each ayah, then read it back. Al-Husary's slow teaching recitation plays every ayah 3 times, with a
          pause after each for you to repeat it. Ten minutes a day on the same passage builds speed.
        </Text>
        <View style={styles.row}>
          <PressBlock
            accessibilityRole="button"
            onPress={() => open(78, undefined, true)}
            style={[styles.btn, styles.flex, { backgroundColor: colors.indigo }]}
          >
            <Text style={styles.btnText}>Start with Juz 30</Text>
          </PressBlock>
          {last ? (
            <PressBlock
              accessibilityRole="button"
              onPress={() => open(last.surah, last.ayah)}
              style={[styles.btn, styles.flex, { backgroundColor: colors.bgSurface }]}
            >
              <Text style={[styles.btnText, { color: colors.ink }]} numberOfLines={1}>
                Continue {SURAHS[last.surah - 1]?.name} {last.ayah > 1 ? last.ayah : ''}
              </Text>
            </PressBlock>
          ) : null}
        </View>
        <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink }]}>Practice mode</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Open every surah and juz below set up for listen and repeat.
            </Text>
          </View>
          <Switch
            value={practice}
            onValueChange={togglePractice}
            trackColor={{ true: colors.indigo, false: colors.border }}
            accessibilityLabel="Practice mode"
          />
        </View>
      </View>

      {/* Surah / Juz */}
      <View style={[styles.segment, { borderColor: colors.ink }]} accessibilityRole="tablist">
        {(['surah', 'juz'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            style={[styles.segBtn, tab === t && { backgroundColor: colors.ink }]}
          >
            <Text style={[styles.segText, { color: tab === t ? '#FFFFFF' : colors.ink }]}>
              {t === 'surah' ? 'Surah' : 'Juz'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'surah' ? (
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <View style={[styles.searchBox, { borderColor: colors.ink }]}>
            <Feather name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Surah name or number"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => surahs.length === 1 && open(surahs[0].number)}
              accessibilityLabel="Find a surah"
              style={[styles.searchInput, { color: colors.ink }]}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear" hitSlop={10}>
                <Feather name="x" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <View>
            {surahs.map((s) => (
              <Pressable
                key={s.number}
                onPress={() => open(s.number)}
                accessibilityRole="button"
                accessibilityLabel={`Read surah ${s.number}, ${s.name}`}
                style={({ pressed }) => [styles.listRow, { borderColor: colors.border }, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.num, { color: colors.textMuted }]}>{s.number}</Text>
                <Text style={[styles.rowName, { color: colors.ink }]} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{s.ayahs} ayah</Text>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
            {surahs.length === 0 ? (
              <Text style={[styles.meta, { color: colors.textMuted, paddingTop: 8 }]}>No surah matches “{query}”.</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          {JUZ_START.map((_, i) => {
            const juz = i + 1;
            const expanded = openJuz === juz;
            const parts = expanded ? juzParts(juz) : [];
            return (
              <View key={juz} style={[styles.juzBlock, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                <View style={styles.juzHead}>
                  <Pressable
                    onPress={() => open(JUZ_START[i][0], JUZ_START[i][1])}
                    accessibilityRole="button"
                    accessibilityLabel={`Read juz ${juz}, ${juzLabel(juz)}`}
                    style={({ pressed }) => [styles.juzMain, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={[styles.num, { color: colors.textMuted }]}>{juz}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowName, { color: colors.ink }]}>Juz {juz}</Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {juzLabel(juz)}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setOpenJuz(expanded ? null : juz)}
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? `Hide surahs in juz ${juz}` : `Show surahs in juz ${juz}`}
                    hitSlop={6}
                    style={styles.expand}
                  >
                    <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.indigo} />
                  </Pressable>
                </View>
                {expanded
                  ? parts.map((p) => (
                      <Pressable
                        key={p.surah}
                        onPress={() => open(p.surah, p.from)}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.partRow, pressed && { opacity: 0.6 }]}
                      >
                        <Text style={[styles.partName, { color: colors.ink }]} numberOfLines={1}>
                          {SURAHS[p.surah - 1].name}
                        </Text>
                        <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                          {p.from === 1 && p.to === SURAHS[p.surah - 1].ayahs ? 'whole surah' : `ayah ${p.from}–${p.to}`}
                        </Text>
                        <Feather name="chevron-right" size={16} color={colors.textMuted} />
                      </Pressable>
                    ))
                  : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  h3: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 21 },
  meta: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 140 },
  btn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingTop: 12 },
  segment: { flexDirection: 'row', borderWidth: 2, borderRadius: RADII.sm, overflow: 'hidden' },
  segBtn: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 14, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderWidth: 2, borderRadius: RADII.sm, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 16, minHeight: 44 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderTopWidth: 1 },
  num: { width: 28, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rowName: { flex: 1, fontSize: 15, fontWeight: '700' },
  rowMeta: { fontSize: 12, fontVariant: ['tabular-nums'] },
  juzBlock: { paddingVertical: 4 },
  juzHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  juzMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  expand: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, paddingLeft: 40 },
  partName: { flex: 1, fontSize: 14, fontWeight: '700' },
});
