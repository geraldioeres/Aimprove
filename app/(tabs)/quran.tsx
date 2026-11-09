import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { PRESSED_BASE, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
import { selectDueQuranPages, useLearningStore } from '../../src/store/useLearningStore';
import { selectDueWords, selectWordLevel, useQuranWords } from '../../src/store/useQuranWords';
import { usePrayerTrack } from '../../src/store/usePrayerTrack';
import { LAST_READ_KEY } from '../../src/lib/ayah-audio';
import { SURAHS } from '../../src/data/surahs';

// The accent at about 12% strength, for the icon badge (accents are #RRGGBB).
const tint = (hex: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}1F` : hex);

interface Tile {
  key: string;
  title: string;
  arabic: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  sub: string;
  href?: string; // no href = coming soon
}

/** The Quran tab: eight sections in a two-column menu. */
export default function QuranMenuScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const learning = useLearningStore();
  const wordProgress = useQuranWords((s) => s.progress);
  const prayer = usePrayerTrack();
  const [last, setLast] = useState<{ surah: number; ayah: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(LAST_READ_KEY)
        .then((raw) => setLast(raw ? JSON.parse(raw) : null))
        .catch(() => {});
    }, [])
  );

  const due = selectDueQuranPages(learning);
  const pagesDue = due.sabaqPages.length + due.sabqiPages.length + due.manzilPages.length;
  const wordsDue = selectDueWords(wordProgress).length;
  const prayerOn = prayer.startIndex !== null && prayer.loadedFor === learning.userId;

  const tiles: Tile[] = [
    {
      key: 'mushaf',
      icon: 'book-open-page-variant',
      title: 'Mushaf',
      arabic: 'مصحف',
      color: colors.quranSabaq,
      sub: pagesDue > 0 ? `${pagesDue} ${pagesDue === 1 ? 'page' : 'pages'} to recite today` : 'Sabaq, Sabqi and Manzil pages',
      href: '/mushaf',
    },
    {
      key: 'words',
      icon: 'cards',
      title: 'Quran Words',
      arabic: 'كلمات',
      color: colors.srsGuru,
      sub: `Level ${selectWordLevel(wordProgress)}${wordsDue > 0 ? ` · ${wordsDue} reviews` : ''}`,
      href: '/qwords',
    },
    {
      key: 'read',
      icon: 'book-play',
      title: 'Read',
      arabic: 'اقرأ',
      color: colors.indigo,
      sub: last ? `Continue ${SURAHS[last.surah - 1]?.name}` : 'Surah or juz, practise fluency',
      href: '/read',
    },
    {
      key: 'prayer',
      icon: 'mosque',
      title: 'Ayah by Prayer',
      arabic: 'صلاة',
      color: colors.quranSabqi,
      sub: prayerOn ? `${prayer.today.length} of 10 done today` : '3 ayah before and after each prayer',
      href: '/mushaf/prayer',
    },
    { key: 'makhraj', icon: 'account-voice', title: 'Makhraj', arabic: 'مخارج', color: colors.hanko, sub: 'Where each letter is made', href: '/mushaf/makharij' },
    { key: 'tajweed', icon: 'palette', title: 'Tajweed', arabic: 'تجويد', color: colors.jpRadical, sub: 'Every rule, with examples', href: '/mushaf/tajweed' },
    { key: 'letters', icon: 'abjad-arabic', title: 'Arabic Letter', arabic: 'حروف', color: colors.textMuted, sub: 'Coming soon' },
    { key: 'numbers', icon: 'numeric', title: 'Number', arabic: '١٢٣', color: colors.ink, sub: 'Arabic digits and their names', href: '/mushaf/numbers' },
  ];

  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <ScrollView style={{ backgroundColor: colors.bgPrimary }} contentContainerStyle={styles.content}>
      {rows.map((row) => (
        <View key={row[0].key} style={styles.row}>
          {row.map((t) => {
            const soon = !t.href;
            return (
              <Pressable
                key={t.key}
                disabled={soon}
                onPress={() => t.href && router.push(t.href as any)}
                accessibilityRole="button"
                accessibilityLabel={`${t.title}. ${t.sub}`}
                accessibilityState={{ disabled: soon }}
                style={({ pressed }) => [
                  styles.tile,
                  soon
                    ? { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.bgPrimary }
                    : [TILE_LIP, { backgroundColor: colors.bgSurface }],
                  pressed && !soon && PRESSED_BASE,
                ]}
              >
                <View style={styles.tileTop}>
                  <View style={[styles.badge, { backgroundColor: soon ? colors.border : tint(t.color) }]}>
                    <MaterialCommunityIcons name={t.icon} size={28} color={soon ? colors.textMuted : t.color} />
                  </View>
                  {soon ? (
                    <View style={[styles.soon, { borderColor: colors.textMuted }]}>
                      <Text style={[styles.soonText, { color: colors.textMuted }]}>Soon</Text>
                    </View>
                  ) : (
                    <Text style={[styles.arabic, { color: t.color }]} numberOfLines={1}>
                      {t.arabic}
                    </Text>
                  )}
                </View>
                <View style={styles.tileText}>
                  <Text style={[styles.title, { color: soon ? colors.textMuted : colors.ink }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={2}>
                    {t.sub}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    minHeight: 148,
    borderRadius: RADII.sm,
    padding: 14,
    gap: 4,
  },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  badge: { width: 52, height: 52, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  arabic: { fontSize: 22, lineHeight: 42, opacity: 0.85 },
  soon: { borderWidth: 1.5, borderRadius: RADII.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  soonText: { fontSize: 11, fontWeight: '700' },
  tileText: { gap: 2 },
  title: { fontSize: 16, fontWeight: '900' },
  sub: { fontSize: 12, lineHeight: 17 },
});
