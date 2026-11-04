import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { parseTajweed } from '../../src/data/tajweed';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, RADII, SPACING } from '../../src/theme/tokens';
import { PressBlock, StampSeal } from '../../src/components/Stamp';
import { useLearningStore } from '../../src/store/useLearningStore';
import {
  AyahText,
  loadAyahText,
  planToday,
  usePrayerTrack,
} from '../../src/store/usePrayerTrack';
import { ayahFromIndex, indexFromAyah, rangeLabel, SURAHS, TOTAL_AYAHS } from '../../src/data/surahs';
import {
  enableReminderPermission,
  formatClock,
  formatUntil,
  PRAYERS,
  prayerTimesFor,
} from '../../src/lib/prayer-times';

const QUICK_STARTS = [
  { label: 'Juz 30 · An-Naba', surah: 78, ayah: 1 },
  { label: 'Al-Mulk', surah: 67, ayah: 1 },
  { label: 'Al-Kahf', surah: 18, ayah: 1 },
  { label: 'Al-Baqarah', surah: 2, ayah: 1 },
];

export default function PrayerTrackScreen() {
  const { colors } = useTheme();
  const userId = useLearningStore((s) => s.userId);
  const track = usePrayerTrack();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    track.load(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (track.loadedFor !== userId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.indigo} />
      </View>
    );
  }

  return track.startIndex === null ? <Setup /> : <Track now={now} />;
}

// ---------------------------------------------------------------------------

function Setup() {
  const { colors } = useTheme();
  const track = usePrayerTrack();
  const [surah, setSurah] = useState('78');
  const [ayah, setAyah] = useState('1');
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const startIndex = indexFromAyah(Number(surah), Number(ayah));
  const surahName = SURAHS[Number(surah) - 1]?.name;

  const useLocation = async () => {
    setLocBusy(true);
    setLocError(null);
    const res = await track.setLocationFromDevice();
    if (!res.ok) setLocError(res.message || null);
    setLocBusy(false);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.h2, { color: colors.ink }]} accessibilityRole="header">
          Memorise by prayer
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Learn 3 new ayah in the 10 minutes before each prayer and 3 more after it. Five prayers make 30 ayah a day.
          This runs alongside your page Sabaq.
        </Text>
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.h3, { color: colors.ink }]}>Start from</Text>
        <View style={styles.chips}>
          {QUICK_STARTS.map((q) => {
            const on = Number(surah) === q.surah && Number(ayah) === q.ayah;
            return (
              <Pressable
                key={q.label}
                onPress={() => {
                  setSurah(String(q.surah));
                  setAyah(String(q.ayah));
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.chip,
                  { borderColor: colors.ink, backgroundColor: on ? colors.indigo : colors.bgSurface },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.ink }]}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          <NumberField label="Surah" value={surah} onChange={setSurah} />
          <NumberField label="Ayah" value={ayah} onChange={setAyah} />
        </View>
        <Text style={[styles.meta, { color: startIndex === null ? colors.danger : colors.textSecondary }]}>
          {startIndex === null
            ? surahName
              ? `${surahName} has ${SURAHS[Number(surah) - 1].ayahs} ayah.`
              : 'Surah numbers go from 1 to 114.'
            : `Starts at ${rangeLabel(startIndex, 1)}`}
        </Text>
      </View>

      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.h3, { color: colors.ink }]}>Prayer times</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Worked out on your phone from your location (Kemenag method). Nothing is sent anywhere. With a location,
          you start at the next prayer instead of Subuh.
        </Text>
        {track.location ? <Times lat={track.location.lat} lng={track.location.lng} label={track.location.label} /> : null}
        <PressBlock
          onPress={useLocation}
          disabled={locBusy}
          accessibilityRole="button"
          style={[styles.secondaryBtn, { backgroundColor: colors.bgSurface }]}
        >
          {locBusy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Feather name="map-pin" size={18} color={colors.ink} />
              <Text style={[styles.secondaryText, { color: colors.ink }]}>
                {track.location ? 'Update my location' : 'Use my location'}
              </Text>
            </>
          )}
        </PressBlock>
        {locError ? <Text style={[styles.meta, { color: colors.ink }]}>{locError}</Text> : null}
      </View>

      <RemindersCard />

      <PressBlock
        onPress={() => startIndex !== null && track.start(startIndex)}
        disabled={startIndex === null}
        accessibilityRole="button"
        style={[styles.primaryBtn, { backgroundColor: startIndex === null ? colors.bgSurface : colors.indigo }]}
      >
        <Text style={[styles.primaryText, { color: startIndex === null ? colors.textMuted : '#FFFFFF' }]}>
          Start memorising
        </Text>
      </PressBlock>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function Track({ now }: { now: Date }) {
  const { colors } = useTheme();
  const track = usePrayerTrack();
  const plan = planToday(track);
  const open = plan.find((p) => p.isNext) || null;
  const times = track.location ? prayerTimesFor(track.location.lat, track.location.lng, now) : null;
  const timeOf = (key: string) => times?.find((t) => t.key === key)?.time;
  const memorised = track.cursor - (track.startIndex ?? 0);
  const finished = track.cursor >= TOTAL_AYAHS;
  const [confirmRestart, setConfirmRestart] = useState(false);

  const nextPrayer = times?.find((t) => t.time.getTime() > now.getTime()) || null;

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      {/* Where things stand */}
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.headRow}>
          <Text style={[styles.h2, { color: colors.ink }]} accessibilityRole="header">
            {nextPrayer ? `${nextPrayer.name} ${formatUntil(nextPrayer.time, now)}` : 'Memorise by prayer'}
          </Text>
          {nextPrayer ? (
            <Text style={[styles.clock, { color: colors.ink }]}>{formatClock(nextPrayer.time)}</Text>
          ) : null}
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {memorised} ayah memorised since {rangeLabel(track.startIndex ?? 0, 1)}
          {track.location ? ` · ${track.location.label}` : ''}
        </Text>
        <View style={[styles.track, { borderColor: colors.ink }]}>
          <View
            style={[
              styles.trackFill,
              { width: `${Math.min(100, (track.today.reduce((n, b) => n + b.count, 0) / 30) * 100)}%`, backgroundColor: colors.quranSabaq },
            ]}
          />
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {track.today.reduce((n, b) => n + b.count, 0)} of 30 ayah today
        </Text>
      </View>

      {/* The block to do now */}
      {finished ? (
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.h3, { color: colors.ink }]}>You've reached the end of the Mushaf</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>Alhamdulillah. Restart below to begin again.</Text>
        </View>
      ) : open ? (
        <OpenBlock
          title={`${open.phase === 'before' ? 'Before' : 'After'} ${PRAYERS.find((p) => p.key === open.prayer)!.name}`}
          time={timeOf(open.prayer)}
          from={open.from}
          count={open.count}
          onDone={() => track.completeSlot(open.key)}
        />
      ) : (
        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.h3, { color: colors.ink }]}>All ten blocks done today</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            30 new ayah. Revise them tonight; tomorrow starts at {rangeLabel(track.cursor, 1)}.
          </Text>
        </View>
      )}

      {/* Today's ten slots */}
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.headRow}>
          <Text style={[styles.h3, { color: colors.ink }]}>Today</Text>
          {track.today.length > 0 ? (
            <Pressable onPress={() => track.undoLast()} accessibilityRole="button" hitSlop={10}>
              <Text style={[styles.link, { color: colors.indigo }]}>Undo last</Text>
            </Pressable>
          ) : null}
        </View>
        {PRAYERS.map((p, i) => (
          <View
            key={p.key}
            style={[styles.prayerGroup, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <View style={styles.prayerHead}>
              <Text style={[styles.prayerName, { color: colors.ink }]}>{p.name}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {timeOf(p.key) ? formatClock(timeOf(p.key)!) : ''}
              </Text>
            </View>
            {plan
              .filter((s) => s.prayer === p.key)
              .map((s) => (
                <View key={s.key} style={styles.slotRow}>
                  <Text style={[styles.slotPhase, { color: colors.textSecondary }]}>
                    {s.phase === 'before' ? 'Before' : 'After'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.slotRange, { color: s.count ? colors.ink : colors.textMuted, fontWeight: s.isNext ? '900' : '500' }]}
                  >
                    {s.skipped ? 'Passed before you started' : s.count ? rangeLabel(s.from, s.count) : '—'}
                  </Text>
                  {s.skipped ? (
                    <View style={[styles.slot, { borderColor: 'transparent' }]} />
                  ) : s.done ? (
                    <StampSeal size={28} seed={`${track.dayKey}-${s.key}`} />
                  ) : (
                    <View
                      style={[
                        styles.slot,
                        { borderColor: s.isNext ? colors.indigo : colors.textMuted, borderStyle: s.isNext ? 'solid' : 'dashed' },
                      ]}
                    />
                  )}
                </View>
              ))}
          </View>
        ))}
      </View>

      {/* Settings for this track */}
      <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
        <Text style={[styles.h3, { color: colors.ink }]}>Track settings</Text>
        {track.location ? (
          <Times lat={track.location.lat} lng={track.location.lng} label={track.location.label} />
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Add your location to see prayer times and get reminders.
          </Text>
        )}
        <Pressable
          onPress={() => track.setLocationFromDevice()}
          accessibilityRole="button"
          style={styles.inlineBtn}
          hitSlop={6}
        >
          <Feather name="map-pin" size={16} color={colors.indigo} />
          <Text style={[styles.link, { color: colors.indigo }]}>
            {track.location ? 'Update my location' : 'Use my location'}
          </Text>
        </Pressable>
        <RemindersCard bare />
        <Pressable
          onPress={() => (confirmRestart ? track.reset() : setConfirmRestart(true))}
          accessibilityRole="button"
          style={[styles.restart, { borderColor: colors.ink }]}
        >
          <Text style={[styles.secondaryText, { color: colors.ink }]}>
            {confirmRestart ? 'Tap again to choose a new starting ayah' : 'Change starting ayah'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function OpenBlock({
  title,
  time,
  from,
  count,
  onDone,
}: {
  title: string;
  time?: Date;
  from: number;
  count: number;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const colours = usePrayerTrack((s) => s.tajweedColours);
  const setColours = usePrayerTrack((s) => s.setTajweedColours);
  const wordByWord = usePrayerTrack((s) => s.wordByWord);
  const setWordByWord = usePrayerTrack((s) => s.setWordByWord);
  const keys = useMemo(() => Array.from({ length: count }, (_, i) => ayahFromIndex(from + i).key), [from, count]);
  const [texts, setTexts] = useState<AyahText[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setTexts(null);
    setError(null);
    Promise.all(keys.map(loadAyahText))
      .then((t) => alive && setTexts(t))
      .catch((e) => alive && setError(e?.message || "Couldn't load the ayah."));
    return () => {
      alive = false;
    };
  }, [keys, attempt]);

  return (
    <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
      <View style={styles.headRow}>
        <Text style={[styles.h3, { color: colors.ink }]}>{title}</Text>
        {time ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatClock(time)}</Text> : null}
      </View>
      <Text style={[styles.rangeBig, { color: colors.quranSabaq }]}>{rangeLabel(from, count)}</Text>
      <View style={styles.viewToggles}>
        {([
          ['Word by word', wordByWord, setWordByWord],
          ['Tajweed colours', colours, setColours],
        ] as const).map(([label, on, setOn]) => (
          <Pressable
            key={label}
            onPress={() => setOn(!on)}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            hitSlop={6}
            style={styles.inlineBtn}
          >
            <Feather name={on ? 'check-square' : 'square'} size={16} color={colors.indigo} />
            <Text style={[styles.link, { color: colors.indigo }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={[styles.body, { color: colors.ink, flex: 1 }]}>{error} Check your connection.</Text>
          <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.link, { color: colors.indigo }]}>Retry</Text>
          </Pressable>
        </View>
      ) : !texts ? (
        <ActivityIndicator color={colors.indigo} style={{ paddingVertical: 24 }} />
      ) : (
        texts.map((t, i) => (
          <View key={t.key} style={[styles.ayah, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            {wordByWord && t.words.length ? (
              <View style={styles.words}>
                {t.words.map((w, j) => (
                  <View key={j} style={[styles.wordTile, { borderColor: colors.border }]}>
                    <Text style={[styles.wordArabic, { color: colors.ink }]}>{w.arabic}</Text>
                    <Text style={[styles.wordMeaning, { color: colors.textSecondary }]}>{w.meaning}</Text>
                  </View>
                ))}
              </View>
            ) : colours && t.tajweed ? (
              <Text style={[styles.arabic, { color: colors.ink }]}>
                {parseTajweed(t.tajweed).map((seg, j) =>
                  seg.rule ? (
                    <Text
                      key={j}
                      onPress={() => router.push(`/mushaf/tajweed?rule=${seg.rule!.id}`)}
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
            <Text style={[styles.ayahKey, { color: colors.textMuted }]}>{t.key}</Text>
            {t.translationId ? (
              <Text style={[styles.translation, { color: colors.textSecondary }]}>{t.translationId}</Text>
            ) : null}
          </View>
        ))
      )}

      <PressBlock onPress={onDone} accessibilityRole="button" style={[styles.primaryBtn, { backgroundColor: colors.indigo }]}>
        <Text style={styles.primaryText}>I've memorised these</Text>
      </PressBlock>
    </View>
  );
}

function Times({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const { colors } = useTheme();
  const times = prayerTimesFor(lat, lng);
  return (
    <View style={styles.timesWrap}>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>{label} · today</Text>
      <View style={styles.timesRow}>
        {times.map((t) => (
          <View key={t.key} style={styles.timeCell}>
            <Text style={[styles.timeName, { color: colors.textSecondary }]}>{t.name}</Text>
            <Text style={[styles.timeValue, { color: colors.ink }]}>{formatClock(t.time)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RemindersCard({ bare = false }: { bare?: boolean }) {
  const { colors } = useTheme();
  const track = usePrayerTrack();
  const [note, setNote] = useState<string | null>(null);
  const web = Platform.OS === 'web';

  const [blocked, setBlocked] = useState(false);

  const toggle = async (on: boolean) => {
    setNote(null);
    setBlocked(false);
    if (on) {
      const perm = await enableReminderPermission();
      if (!perm.granted) {
        setBlocked(!perm.canAskAgain);
        setNote(
          perm.canAskAgain
            ? 'Allow notifications when your phone asks, so reminders can appear.'
            : 'Notifications are blocked for Aimprove. Turn them on in your phone settings, then try again.'
        );
        return;
      }
      if (!track.location) setNote('Add your location too, so reminders know the prayer times.');
    }
    await track.setReminders(on);
  };

  const inner = (
    <>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.h3small, { color: colors.ink }]}>Remind me 10 minutes before each prayer</Text>
          {web ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Reminders work in the phone app.</Text>
          ) : null}
        </View>
        <Switch
          value={track.remindersOn}
          onValueChange={toggle}
          disabled={web}
          trackColor={{ true: colors.indigo, false: colors.border }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Prayer reminders"
        />
      </View>
      {note ? <Text style={[styles.meta, { color: colors.ink }]}>{note}</Text> : null}
      {blocked ? (
        <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" style={styles.inlineBtn} hitSlop={6}>
          <Feather name="settings" size={16} color={colors.indigo} />
          <Text style={[styles.link, { color: colors.indigo }]}>Open phone settings</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (bare) return inner;
  return <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>{inner}</View>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 3))}
        keyboardType="number-pad"
        accessibilityLabel={label}
        style={[styles.input, { borderColor: colors.ink, color: colors.ink, backgroundColor: colors.bgSurface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '900', flexShrink: 1 },
  h3: { fontSize: 17, fontWeight: '900' },
  h3small: { fontSize: 15, fontWeight: '700' },
  clock: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 18 },
  link: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderRadius: RADII.sm, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  input: { borderWidth: 2, borderRadius: RADII.sm, minHeight: 50, paddingHorizontal: 14, fontSize: 18, fontVariant: ['tabular-nums'] },
  primaryBtn: { minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { minHeight: 50, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700' },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  restart: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: RADII.sm, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  track: { height: 10, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%' },
  timesWrap: { gap: 6 },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeCell: { alignItems: 'center', gap: 2 },
  timeName: { fontSize: 12, fontWeight: '500' },
  timeValue: { fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerGroup: { paddingVertical: 8, gap: 4 },
  prayerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  prayerName: { fontSize: 15, fontWeight: '900' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  slotPhase: { width: 52, fontSize: 13, fontWeight: '500' },
  slotRange: { flex: 1, fontSize: 14 },
  slot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, marginHorizontal: 1 },
  rangeBig: { fontSize: 15, fontWeight: '900', flexShrink: 1 },
  viewToggles: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, marginTop: -4 },
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
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ayah: { paddingVertical: 12, gap: 6 },
  arabic: { fontSize: 26, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  ayahKey: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  translation: { fontSize: 14, lineHeight: 21 },
});
