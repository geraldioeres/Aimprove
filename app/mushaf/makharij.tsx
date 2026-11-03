import React, { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
import { MakhrajDiagram } from '../../src/components/MakhrajDiagram';
import {
  getMakhraj,
  lettersInZone,
  MAKHRAJ_LETTERS,
  MakhrajLetter,
  SIFAT,
  ZONES,
} from '../../src/data/makharij';

const WIDE = 760;

// The quick picker lists letters in alphabet (hijāʾī) order, not makhraj order.
const ALPHABET_IDS = [
  'alif-madd', 'ba', 'ta', 'tha', 'jim', 'hha', 'kha', 'dal', 'dhal', 'ra',
  'zay', 'sin', 'shin', 'sad', 'dad', 'tta', 'zza', 'ayn', 'ghayn', 'fa',
  'qaf', 'kaf', 'lam', 'mim', 'nun', 'ha', 'waw', 'hamzah', 'ya',
];
const ALPHABET = ALPHABET_IDS.map((id) => MAKHRAJ_LETTERS.find((l) => l.id === id)!);
const QUICK_ROWS = 3;
const QUICK_GAP = 4;

// On wide web screens the diagram stays in view while the letter grid scrolls.
const STICKY = Platform.OS === 'web' ? ({ position: 'sticky', top: 16 } as unknown as object) : null;

export default function MakharijScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const scrollRef = useRef<ScrollView>(null);
  const [selectedId, setSelectedId] = useState('ba');

  const selected = MAKHRAJ_LETTERS.find((l) => l.id === selectedId) ?? MAKHRAJ_LETTERS[0];

  const select = (l: MakhrajLetter) => {
    setSelectedId(l.id);
    if (!wide) scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const selectMakhraj = (id: number) => {
    const first = MAKHRAJ_LETTERS.find((l) => l.makhraj === id);
    if (first) setSelectedId(first.id);
  };

  const diagramCard = (
    <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
      <View style={styles.diagramWrap}>
        <MakhrajDiagram activeMakhraj={selected.makhraj} onPressMakhraj={selectMakhraj} />
      </View>
      <LetterDetails letter={selected} />
    </View>
  );

  const grid = (
    <View style={styles.zones}>
      {ZONES.map((zone) => (
        <View
          key={zone.id}
          style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}
        >
          <View style={styles.zoneHead}>
            <Text style={[styles.zoneTitle, { color: colors.ink }]}>
              {zone.translit} · {zone.nameEn}
            </Text>
            <Text style={[styles.zoneAr, { color: colors.ink }]}>{zone.nameAr}</Text>
          </View>
          <Text style={[styles.zoneBlurb, { color: colors.textSecondary }]}>{zone.blurb}</Text>
          <View style={styles.tiles}>
            {lettersInZone(zone.id).map((l) => {
              const on = l.id === selected.id;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => select(l)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${l.name}, makhraj ${l.makhraj}`}
                  style={({ pressed }) => [
                    styles.tile,
                    TILE_LIP,
                    { backgroundColor: on ? colors.indigo : colors.bgSurface },
                    pressed && PRESSED_BASE,
                  ]}
                >
                  <Text style={[styles.tileGlyph, { color: on ? '#FFFFFF' : colors.ink }]}>
                    {l.glyph}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.tileName, { color: on ? '#FFFFFF' : colors.textSecondary }]}
                  >
                    {l.kind === 'madd' ? `${l.translit}` : l.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  // Size the chips so every letter fits in a few rows across the phone width.
  const perRow = Math.ceil(ALPHABET.length / QUICK_ROWS);
  const chipWidth = Math.floor((width - 32 - (perRow - 1) * QUICK_GAP) / perRow);

  const quickPicker = (
    <View
      style={[styles.quickBar, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}
      accessibilityLabel="Quick letter picker"
    >
      <View style={styles.quickGrid}>
        {ALPHABET.map((l) => {
          const on = l.id === selected.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => select(l)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={l.kind === 'madd' ? 'Alif' : l.name}
              hitSlop={2}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  width: chipWidth,
                  borderColor: colors.ink,
                  backgroundColor: on ? colors.indigo : colors.bgSurface,
                },
                pressed && styles.quickChipPressed,
              ]}
            >
              <Text style={[styles.quickGlyph, { color: on ? '#FFFFFF' : colors.ink }]}>
                {l.glyph}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {wide ? null : quickPicker}
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Tap a letter to see where in the mouth it is made. To feel the spot, say the letter
          with a sukun after a hamzah, like أَبْ.
        </Text>
        {wide ? (
          <View style={styles.columns}>
            <View style={[styles.colLeft, STICKY]}>{diagramCard}</View>
            <View style={styles.colRight}>{grid}</View>
          </View>
        ) : (
          <>
            {diagramCard}
            {grid}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LetterDetails({ letter }: { letter: MakhrajLetter }) {
  const { colors } = useTheme();
  const makhraj = getMakhraj(letter.makhraj);
  const zone = ZONES.find((z) => z.id === makhraj.zone)!;

  return (
    <View style={styles.details} accessibilityLiveRegion="polite">
      <View style={styles.detailHead}>
        <View style={[styles.bigGlyphBox, CARD_EDGE, { backgroundColor: colors.indigo }]}>
          <Text style={styles.bigGlyph}>{letter.glyph}</Text>
        </View>
        <View style={styles.detailHeadText}>
          <Text style={[styles.letterName, { color: colors.ink }]}>{letter.name}</Text>
          <Text style={[styles.letterSub, { color: colors.textSecondary }]}>
            “{letter.translit}” · {letter.nameAr}
          </Text>
          <Text style={[styles.makhrajTag, { color: colors.indigo }]}>
            Makhraj {makhraj.id} of 17 · {zone.translit}
          </Text>
        </View>
      </View>

      <View style={[styles.rule, { backgroundColor: colors.border }]} />

      <View style={styles.block}>
        <Text style={[styles.arabicLine, { color: colors.ink }]}>{makhraj.nameAr}</Text>
        <Text style={[styles.body, { color: colors.ink }]}>{makhraj.nameEn}</Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.textMuted }]}>How to say it</Text>
        <Text style={[styles.body, { color: colors.ink }]}>{letter.tip}</Text>
        {letter.note ? (
          <Text style={[styles.note, { color: colors.textSecondary }]}>{letter.note}</Text>
        ) : null}
      </View>

      <View style={styles.tryRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Try it</Text>
        <Text style={[styles.practice, { color: colors.ink }]}>{letter.practice}</Text>
      </View>

      {letter.sifat.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Ṣifāt · how it sounds</Text>
          <View style={styles.chips}>
            {letter.sifat.map((id) => {
              const s = SIFAT[id];
              return (
                <View key={id} style={[styles.chip, { borderColor: colors.ink }]}>
                  <Text style={[styles.chipName, { color: colors.ink }]}>
                    {s.name} <Text style={styles.chipAr}>{s.nameAr}</Text>
                  </Text>
                  <Text style={[styles.chipMeaning, { color: colors.textSecondary }]}>
                    {s.meaning}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 16 },
  contentWide: { width: '100%', maxWidth: 1040, alignSelf: 'center', padding: 24 },
  quickBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  // Right to left, as the alphabet reads.
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: QUICK_GAP },
  quickChip: {
    height: 34,
    borderWidth: 1.5,
    borderRadius: RADII.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipPressed: { opacity: 0.6 },
  quickGlyph: { fontSize: 18, fontWeight: '700', lineHeight: 28 },
  intro: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  diagramWrap: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  details: { gap: 12 },
  detailHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bigGlyphBox: {
    width: 72,
    height: 72,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigGlyph: { color: '#FFFFFF', fontSize: 40, fontWeight: '700', lineHeight: 56 },
  detailHeadText: { flex: 1, gap: 2 },
  letterName: { fontSize: 22, fontWeight: '900' },
  letterSub: { fontSize: 14, fontWeight: '500' },
  makhrajTag: { fontSize: 13, fontWeight: '700' },
  rule: { height: 1 },
  block: { gap: 4 },
  arabicLine: { fontSize: 17, fontWeight: '700', writingDirection: 'rtl', textAlign: 'right', lineHeight: 28 },
  label: { fontSize: 12, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  note: { fontSize: 13, fontWeight: '500', lineHeight: 19, fontStyle: 'italic' },
  tryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  practice: { fontSize: 26, fontWeight: '700', writingDirection: 'rtl', lineHeight: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: { borderWidth: 1.5, borderRadius: RADII.xs, paddingHorizontal: 8, paddingVertical: 5, gap: 1 },
  chipName: { fontSize: 13, fontWeight: '700' },
  chipAr: { fontSize: 12, fontWeight: '500' },
  chipMeaning: { fontSize: 11, fontWeight: '500' },
  zones: { gap: 16 },
  zoneHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  zoneTitle: { flex: 1, fontSize: 17, fontWeight: '900' },
  zoneAr: { fontSize: 18, fontWeight: '700' },
  zoneBlurb: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  // Right to left, as an Arabic letter chart reads.
  tiles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: 54,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  tileGlyph: { fontSize: 26, fontWeight: '700', lineHeight: 38 },
  tileName: { fontSize: 11, fontWeight: '700' },
});
