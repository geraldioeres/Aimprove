import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { CARD_EDGE, PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
import { toArabicNumerals } from '../../src/data/quran-seed';
import {
  ARABIC_DIGITS,
  ARABIC_TENS,
  QURAN_NUMBER_FACTS,
  toWesternDigits,
} from '../../src/data/arabic-numbers';

const WIDE = 760;

export default function ArabicNumbersScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const [selected, setSelected] = useState(5);
  const [typed, setTyped] = useState('582');

  const digit = ARABIC_DIGITS[selected];
  const western = toWesternDigits(typed).slice(0, 7);
  const arabic = western ? toArabicNumerals(Number(western)) : '';

  const card = [styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }];

  const digitsCard = (
    <View style={card}>
      <Text style={[styles.title, { color: colors.ink }]}>The ten digits</Text>
      <View style={styles.tiles}>
        {ARABIC_DIGITS.map((d) => {
          const on = d.value === selected;
          return (
            <Pressable
              key={d.value}
              onPress={() => setSelected(d.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.english}, ${d.translit}`}
              style={({ pressed }) => [
                styles.tile,
                TILE_LIP,
                { backgroundColor: on ? colors.indigo : colors.bgSurface },
                pressed && PRESSED_BASE,
              ]}
            >
              <Text style={[styles.tileGlyph, { color: on ? '#FFFFFF' : colors.ink }]}>{d.glyph}</Text>
              <Text style={[styles.tileSub, { color: on ? '#FFFFFF' : colors.textSecondary }]}>
                {d.value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.rule, { backgroundColor: colors.border }]} />

      <View style={styles.detailHead} accessibilityLiveRegion="polite">
        <View style={[styles.bigBox, CARD_EDGE, { backgroundColor: colors.indigo }]}>
          <Text style={styles.bigGlyph}>{digit.glyph}</Text>
        </View>
        <View style={styles.detailText}>
          <Text style={[styles.name, { color: colors.ink }]}>
            {digit.value} · {digit.english}
          </Text>
          <Text style={[styles.nameAr, { color: colors.ink }]}>{digit.nameAr}</Text>
          <Text style={[styles.translit, { color: colors.indigo }]}>{digit.translit}</Text>
        </View>
      </View>
      <Text style={[styles.body, { color: colors.ink }]}>{digit.tip}</Text>
    </View>
  );

  const directionCard = (
    <View style={card}>
      <Text style={[styles.title, { color: colors.ink }]}>Numbers read left to right</Text>
      <Text style={[styles.body, { color: colors.ink }]}>
        Arabic words go right to left, but numbers go left to right, just like ours. The
        biggest place comes first.
      </Text>
      <View style={styles.exampleRow}>
        <Text style={[styles.exampleAr, { color: colors.ink }]}>{toArabicNumerals(123)}</Text>
        <Text style={[styles.exampleEq, { color: colors.textMuted }]}>=</Text>
        <Text style={[styles.exampleWest, { color: colors.ink }]}>123</Text>
      </View>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        In Iran and Pakistan four, five and six are written ۴ ۵ ۶. The Mushaf in this app uses
        ٤ ٥ ٦.
      </Text>
    </View>
  );

  const tensCard = (
    <View style={card}>
      <Text style={[styles.title, { color: colors.ink }]}>Tens, hundred, thousand</Text>
      {ARABIC_TENS.map((t, i) => (
        <View
          key={t.value}
          style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
        >
          <Text style={[styles.rowWest, { color: colors.textSecondary }]}>{t.value}</Text>
          <Text style={[styles.rowTranslit, { color: colors.textSecondary }]}>{t.translit}</Text>
          <Text style={[styles.rowName, { color: colors.ink }]}>{t.nameAr}</Text>
          <Text style={[styles.rowDigits, { color: colors.ink }]}>{toArabicNumerals(t.value)}</Text>
        </View>
      ))}
    </View>
  );

  const tryCard = (
    <View style={card}>
      <Text style={[styles.title, { color: colors.ink }]}>Write a number</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Type a page, surah or ayah number to see it in Arabic.
      </Text>
      <TextInput
        value={typed}
        onChangeText={setTyped}
        keyboardType="number-pad"
        maxLength={7}
        placeholder="e.g. 582"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Number to write in Arabic"
        style={[styles.input, { borderColor: colors.ink, color: colors.ink }]}
      />
      {arabic ? (
        <View style={styles.result}>
          <Text style={[styles.resultAr, { color: colors.ink }]}>{arabic}</Text>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            As an ayah marker in the Mushaf: <Text style={styles.marker}>﴿{arabic}﴾</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );

  const quranCard = (
    <View style={card}>
      <Text style={[styles.title, { color: colors.ink }]}>Numbers in the Quran</Text>
      <View style={styles.facts}>
        {QURAN_NUMBER_FACTS.map((f) => (
          <View key={f.label} style={[styles.fact, { borderColor: colors.ink }]}>
            <Text style={[styles.factAr, { color: colors.ink }]}>{toArabicNumerals(f.value)}</Text>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>
              {f.value} {f.label}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Ayah count follows the Hafs reading. Pages follow the 15-line Madani Mushaf.
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={[styles.content, wide && styles.contentWide]}
    >
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        The Mushaf writes page and ayah numbers with these digits. Tap one to see its name
        and how to spot it.
      </Text>
      {wide ? (
        <View style={styles.columns}>
          <View style={styles.col}>
            {digitsCard}
            {directionCard}
            {tryCard}
          </View>
          <View style={styles.col}>
            {tensCard}
            {quranCard}
          </View>
        </View>
      ) : (
        <>
          {digitsCard}
          {directionCard}
          {tryCard}
          {tensCard}
          {quranCard}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: SPACING.xxl, gap: 16 },
  contentWide: { width: '100%', maxWidth: 1040, alignSelf: 'center', padding: 24 },
  intro: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  col: { flex: 1, gap: 16 },
  card: { borderRadius: RADII.sm, padding: 16, gap: 12 },
  title: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  note: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  rule: { height: 1 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: 54, paddingVertical: 4, borderRadius: RADII.sm, alignItems: 'center' },
  tileGlyph: { fontSize: 28, fontWeight: '700', lineHeight: 40 },
  tileSub: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  detailHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bigBox: { width: 72, height: 72, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  bigGlyph: { color: '#FFFFFF', fontSize: 44, fontWeight: '700', lineHeight: 60 },
  detailText: { flex: 1, gap: 2 },
  name: { fontSize: 22, fontWeight: '900' },
  nameAr: { fontSize: 22, fontWeight: '700', lineHeight: 34, writingDirection: 'rtl', alignSelf: 'flex-start' },
  translit: { fontSize: 14, fontWeight: '700' },
  exampleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  exampleAr: { fontSize: 36, fontWeight: '700', lineHeight: 50 },
  exampleEq: { fontSize: 22, fontWeight: '700' },
  exampleWest: { fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  rowWest: { width: 44, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rowTranslit: { flex: 1, fontSize: 13, fontWeight: '500' },
  rowName: { fontSize: 18, fontWeight: '700', lineHeight: 30 },
  rowDigits: { width: 56, fontSize: 20, fontWeight: '700', textAlign: 'right', lineHeight: 30 },
  input: {
    minHeight: 48,
    borderWidth: 2,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  result: { gap: 6, alignItems: 'center' },
  resultAr: { fontSize: 44, fontWeight: '700', lineHeight: 62 },
  marker: { fontSize: 18 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { borderWidth: 1.5, borderRadius: RADII.xs, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 84 },
  factAr: { fontSize: 24, fontWeight: '700', lineHeight: 36 },
  factLabel: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
