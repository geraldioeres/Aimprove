import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TajweedRule } from '../../../src/data/tajweed';
import { AyahView, RuleSheet } from '../../../src/components/AyahView';
import { useTheme } from '../../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../../src/theme/tokens';
import {
  AyahText,
  loadSurahChunk,
  loadSurahInfo,
  SURAH_CHUNK,
  SurahInfo,
} from '../../../src/store/usePrayerTrack';
import { BISMILLAH, SURAHS } from '../../../src/data/surahs';

// Reader view settings, kept on this device.
const PREFS_KEY = 'aimprove.reader.v1';
interface Prefs {
  tajweed: boolean;
  meaning: boolean;
  wordByWord: boolean;
}
const DEFAULT_PREFS: Prefs = { tajweed: true, meaning: true, wordByWord: false };

export default function SurahReaderScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ surah: string }>();
  const surah = Math.min(114, Math.max(1, parseInt(params.surah || '1', 10) || 1));
  const meta = SURAHS[surah - 1];
  const chunks = Math.ceil(meta.ayahs / SURAH_CHUNK);

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [info, setInfo] = useState<SurahInfo | null>(null);
  const [ayahs, setAyahs] = useState<AyahText[]>([]);
  const [loaded, setLoaded] = useState(0); // chunks loaded so far
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulePeek, setRulePeek] = useState<TajweedRule | null>(null);
  const busy = useRef(false);
  const current = useRef(surah);
  current.current = surah;
  const listRef = useRef<FlatList<AyahText>>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => raw && setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }))
      .catch(() => {});
  }, []);

  const toggle = (k: keyof Prefs) =>
    setPrefs((p) => {
      const next = { ...p, [k]: !p[k] };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

  const loadNext = useCallback(
    async (from: number) => {
      if (busy.current || from >= chunks) return;
      busy.current = true;
      setLoading(true);
      setError(null);
      try {
        const next = await loadSurahChunk(surah, from + 1);
        if (current.current !== surah) return; // switched surah meanwhile
        setAyahs((a) => [...a, ...next]);
        setLoaded(from + 1);
      } catch (e: any) {
        setError(e?.message || "Couldn't load the surah.");
      } finally {
        if (current.current === surah) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [surah, chunks]
  );

  // A new surah starts from the top.
  useEffect(() => {
    setAyahs([]);
    setLoaded(0);
    setInfo(null);
    busy.current = false;
    loadNext(0);
    loadSurahInfo(surah).then(setInfo).catch(() => {});
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [surah, loadNext]);

  const done = loaded >= chunks;
  const showBismillah = surah !== 1 && surah !== 9; // Al-Fatihah's is ayah 1; At-Taubah has none

  const header = (
    <View style={styles.head}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.surahName, { color: colors.ink }]} accessibilityRole="header">
            {meta.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {[
              `Surah ${surah}`,
              info?.meaning,
              info?.place ? (info.place === 'makkah' ? 'Makkiyah' : 'Madaniyah') : null,
              `${meta.ayahs} ayah`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        {info?.arabicName ? (
          <Text style={[styles.arabicName, { color: colors.ink }]}>{info.arabicName}</Text>
        ) : null}
      </View>
      {showBismillah ? <Text style={[styles.bismillah, { color: colors.ink }]}>{BISMILLAH}</Text> : null}
    </View>
  );

  const footer = (
    <View style={styles.foot}>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={[styles.body, { color: colors.ink, flex: 1 }]}>{error} Check your connection.</Text>
          <Pressable onPress={() => loadNext(loaded)} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.link, { color: colors.indigo }]}>Retry</Text>
          </Pressable>
        </View>
      ) : !done ? (
        <ActivityIndicator color={colors.indigo} style={{ paddingVertical: 24 }} />
      ) : (
        <View style={styles.navRow}>
          {surah > 1 ? (
            <Pressable
              onPress={() => router.setParams({ surah: String(surah - 1) })}
              accessibilityRole="button"
              style={[styles.navBtn, { borderColor: colors.border }]}
            >
              <Feather name="chevron-left" size={18} color={colors.indigo} />
              <Text style={[styles.link, { color: colors.indigo }]} numberOfLines={1}>
                {SURAHS[surah - 2].name}
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {surah < 114 ? (
            <Pressable
              onPress={() => router.setParams({ surah: String(surah + 1) })}
              accessibilityRole="button"
              style={[styles.navBtn, styles.navNext, { borderColor: colors.border }]}
            >
              <Text style={[styles.link, { color: colors.indigo }]} numberOfLines={1}>
                {SURAHS[surah].name}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.indigo} />
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bgPrimary }]}>
      <Stack.Screen options={{ title: meta.name }} />
      <View style={[styles.bar, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
        <View style={styles.barInner}>
          {([
            ['tajweed', 'Tajweed colours'],
            ['meaning', 'Meaning'],
            ['wordByWord', 'Word by word'],
          ] as const).map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => toggle(k)}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs[k] }}
              hitSlop={6}
              style={styles.toggle}
            >
              <Feather name={prefs[k] ? 'check-square' : 'square'} size={16} color={colors.indigo} />
              <Text style={[styles.link, { color: colors.indigo }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => a.key}
        extraData={prefs}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onEndReached={() => !error && loadNext(loaded)}
        onEndReachedThreshold={1.5}
        initialNumToRender={8}
        windowSize={9}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.ayah,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
              index > 0 && styles.ayahJoined,
            ]}
          >
            <AyahView
              text={item}
              wordByWord={prefs.wordByWord}
              tajweed={prefs.tajweed}
              meaning={prefs.meaning}
              onRule={setRulePeek}
            />
          </View>
        )}
      />
      <RuleSheet
        rule={rulePeek}
        onClose={() => setRulePeek(null)}
        onMore={(id) => {
          setRulePeek(null);
          router.push(`/mushaf/tajweed?rule=${id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bar: { borderBottomWidth: 1 },
  barInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  content: { padding: 16, paddingBottom: SPACING.xxl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  head: { gap: 16, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  surahName: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  arabicName: { fontSize: 30, lineHeight: 56 },
  bismillah: { fontSize: 26, lineHeight: 52, textAlign: 'center' },
  meta: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 14, lineHeight: 20 },
  link: { fontSize: 14, fontWeight: '700' },
  ayah: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    borderRadius: RADII.sm,
  },
  ayahJoined: { marginTop: 8 },
  foot: { paddingTop: 16 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: RADII.sm,
  },
  navNext: { justifyContent: 'flex-end' },
});
