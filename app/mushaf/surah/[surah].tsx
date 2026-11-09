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
import { RECITERS, REPEAT_OPTIONS, useAyahPlayer } from '../../../src/lib/ayah-audio';

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
  const player = useAyahPlayer(surah, meta.ayahs);

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

  // Follow the recitation: keep the playing ayah in view, and load more
  // ayah before the audio runs past what's on screen.
  const playing = player.state.ayah;
  useEffect(() => {
    if (!playing) return;
    if (playing > ayahs.length - 3 && loaded < chunks) loadNext(loaded);
    if (playing <= ayahs.length) {
      listRef.current?.scrollToIndex({ index: playing - 1, viewPosition: 0.2, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ayahs.length]);

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
        extraData={[prefs, player.state]}
        onScrollToIndexFailed={(e) => {
          listRef.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: false });
          setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, viewPosition: 0.2 }), 250);
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onEndReached={() => !error && loadNext(loaded)}
        onEndReachedThreshold={1.5}
        initialNumToRender={8}
        windowSize={9}
        renderItem={({ item, index }) => {
          const n = index + 1;
          const active = player.state.ayah === n;
          const running = active && player.state.phase !== 'idle';
          return (
            <View
              style={[
                styles.ayah,
                { backgroundColor: colors.bgSurface, borderColor: active ? colors.indigo : colors.border },
                active && styles.ayahActive,
                index > 0 && styles.ayahJoined,
              ]}
            >
              <View style={styles.ayahTop}>
                <Text style={[styles.ayahKey, { color: colors.textMuted }]}>{item.key}</Text>
                {active && player.state.phase === 'echo' ? (
                  <Text style={[styles.echoCue, { color: colors.indigo }]}>Your turn: repeat it</Text>
                ) : null}
                <Pressable
                  onPress={() => (running ? player.pause() : player.playFrom(n))}
                  accessibilityRole="button"
                  accessibilityLabel={running ? `Pause ayah ${n}` : `Play ayah ${n}`}
                  hitSlop={8}
                  style={({ pressed }) => [styles.playBtn, { borderColor: colors.indigo }, pressed && { opacity: 0.6 }]}
                >
                  <Feather name={running ? 'pause' : 'play'} size={16} color={colors.indigo} />
                </Pressable>
              </View>
              <AyahView
                text={item}
                wordByWord={prefs.wordByWord}
                tajweed={prefs.tajweed}
                meaning={prefs.meaning}
                showKey={false}
                onRule={setRulePeek}
              />
            </View>
          );
        }}
      />
      <PlayerBar player={player} surah={surah} />
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

/** Player controls: play/pause, what's playing, reciter, repeat count and echo pause. */
function PlayerBar({ player, surah }: { player: ReturnType<typeof useAyahPlayer>; surah: number }) {
  const { colors } = useTheme();
  const { state, prefs, updatePrefs, playFrom, pause, stop } = player;
  const running = state.phase !== 'idle';
  const reciter = RECITERS.find((r) => r.id === prefs.reciter) || RECITERS[0];
  const status = state.error
    ? state.error
    : state.ayah === null
      ? 'Tap play on any ayah, or start here.'
      : state.phase === 'echo'
        ? `${surah}:${state.ayah} · your turn, repeat it`
        : state.phase === 'loading'
          ? `${surah}:${state.ayah} · loading…`
          : `${surah}:${state.ayah}${prefs.repeat > 1 ? ` · ${state.rep} of ${prefs.repeat}` : ''}${running ? '' : ' · paused'}`;
  const nextIndex = (i: number, n: number) => (i + 1) % n;

  return (
    <View style={[styles.player, { backgroundColor: colors.bgSurface, borderTopColor: colors.ink }]}>
      <View style={styles.playerInner}>
        <View style={styles.playerRow}>
          <Pressable
            onPress={() => (running ? pause() : playFrom(state.ayah ?? 1))}
            accessibilityRole="button"
            accessibilityLabel={running ? 'Pause' : 'Play'}
            style={({ pressed }) => [styles.bigPlay, { backgroundColor: colors.indigo }, pressed && { opacity: 0.8 }]}
          >
            <Feather name={running ? 'pause' : 'play'} size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.playerStatus, { color: state.error ? colors.danger : colors.ink }]} numberOfLines={2}>
            {status}
          </Text>
          {state.ayah !== null ? (
            <Pressable onPress={stop} accessibilityRole="button" accessibilityLabel="Stop" hitSlop={10} style={styles.stopBtn}>
              <Feather name="square" size={18} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chips}>
          <Pressable
            onPress={() => updatePrefs({ reciter: RECITERS[nextIndex(RECITERS.indexOf(reciter), RECITERS.length)].id })}
            accessibilityRole="button"
            accessibilityLabel={`Reciter: ${reciter.name}. Tap to change.`}
            style={[styles.chip, { borderColor: colors.border }]}
          >
            <Feather name="mic" size={13} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.ink }]} numberOfLines={1}>
              {reciter.name}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              updatePrefs({
                repeat: REPEAT_OPTIONS[nextIndex(REPEAT_OPTIONS.indexOf(prefs.repeat), REPEAT_OPTIONS.length)],
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Play each ayah ${prefs.repeat} times. Tap to change.`}
            style={[styles.chip, { borderColor: colors.border }]}
          >
            <Feather name="repeat" size={13} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.ink }]}>×{prefs.repeat}</Text>
          </Pressable>
          <Pressable
            onPress={() => updatePrefs({ echo: !prefs.echo })}
            accessibilityRole="switch"
            accessibilityState={{ checked: prefs.echo }}
            accessibilityLabel="Pause after each ayah so you can repeat it"
            style={[
              styles.chip,
              prefs.echo ? { borderColor: colors.indigo, backgroundColor: colors.indigoBg } : { borderColor: colors.border },
            ]}
          >
            <Feather name={prefs.echo ? 'check' : 'corner-down-left'} size={13} color={prefs.echo ? colors.indigo : colors.textSecondary} />
            <Text style={[styles.chipText, { color: prefs.echo ? colors.indigo : colors.ink }]}>Pause to repeat</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  player: { borderTopWidth: 2 },
  playerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigPlay: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playerStatus: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  stopBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderRadius: RADII.pill,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  ayahTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ayahKey: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  echoCue: { flex: 1, fontSize: 13, fontWeight: '700' },
  playBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahActive: { borderWidth: 2 },
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
