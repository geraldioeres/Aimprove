import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import { ALL_604_PAGE_SUMMARIES } from '../../src/data/quran-seed';
import { useLearningStore } from '../../src/store/useLearningStore';

export default function QuranMasteryHeatmapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const quranProgress = useLearningStore((s) => s.quranProgress);

  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>(30);

  const filteredPages = ALL_604_PAGE_SUMMARIES.filter((p) =>
    selectedJuz === 'all' ? true : p.juz === selectedJuz
  );

  const totalStarted = Object.values(quranProgress).filter(
    (p) => p.stage !== 'unstarted'
  ).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* Legend & Overview Card */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          604-Page Madani Mushaf Mastery Map
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Active or memorized pages: {totalStarted} of 604 • Tap any page cell to open the 15-line Mushaf reader.
        </Text>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.quranSabaq },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              Sabaq (New)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.quranSabqi },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              Sabqi (Recent)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.quranManzil },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              Manzil (FSRS)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.bgMuted, borderColor: colors.borderStrong, borderWidth: 1 },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              Unstarted
            </Text>
          </View>
        </View>
      </View>

      {/* Juz Filter Selector (All 604 or Juz 1..30) */}
      <View
        style={[
          styles.filterCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.filterHeading, { color: colors.textPrimary }]}>
          Filter by Juz (1 to 30)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.juzScroll}
        >
          <Pressable
            onPress={() => setSelectedJuz('all')}
            accessibilityRole="button"
            style={[
              styles.juzPill,
              {
                backgroundColor:
                  selectedJuz === 'all' ? colors.textPrimary : colors.bgMuted,
                borderColor:
                  selectedJuz === 'all' ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.juzPillText,
                {
                  color:
                    selectedJuz === 'all' ? colors.bgPrimary : colors.textPrimary,
                },
              ]}
            >
              All 604 Pages
            </Text>
          </Pressable>

          {[30, 29, 28, 1, 2, 3, 15, 18, 27].map((juzNum) => {
            const active = selectedJuz === juzNum;
            return (
              <Pressable
                key={juzNum}
                onPress={() => setSelectedJuz(juzNum)}
                accessibilityRole="button"
                style={[
                  styles.juzPill,
                  {
                    backgroundColor: active
                      ? colors.quranManzil
                      : colors.bgMuted,
                    borderColor: active ? colors.quranManzil : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.juzPillText,
                    { color: active ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  Juz {juzNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Page Heatmap Grid */}
      <View
        style={[
          styles.gridCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.filterHeading, { color: colors.textPrimary }]}>
          {selectedJuz === 'all'
            ? 'All 604 Mushaf Pages'
            : `Juz ${selectedJuz} Pages (${filteredPages.length} Pages)`}
        </Text>

        <View style={styles.heatmapGrid}>
          {filteredPages.map((item) => {
            const prog = quranProgress[item.pageNumber];
            const stage = prog?.stage || 'unstarted';

            let bg = colors.bgMuted;
            let border = colors.border;
            let textColor = colors.textPrimary;

            if (stage === 'sabaq') {
              bg = colors.quranSabaq;
              border = colors.quranSabaq;
              textColor = '#FFFFFF';
            } else if (stage === 'sabqi') {
              bg = colors.quranSabqi;
              border = colors.quranSabqi;
              textColor = '#FFFFFF';
            } else if (stage === 'manzil') {
              bg = colors.quranManzil;
              border = colors.quranManzil;
              textColor = '#FFFFFF';
            }

            return (
              <Pressable
                key={item.pageNumber}
                onPress={() => router.push(`/quran/page/${item.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCell,
                  { backgroundColor: bg, borderColor: border },
                ]}
              >
                <Text style={[styles.pageCellNumber, { color: textColor }]}>
                  {item.pageNumber}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.pageCellSub,
                    {
                      color:
                        stage === 'unstarted'
                          ? colors.textMuted
                          : 'rgba(255,255,255,0.9)',
                    },
                  ]}
                >
                  {stage === 'unstarted' ? `J${item.juz}` : stage.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  headerCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  filterHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  juzScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  juzPill: {
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  juzPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageCell: {
    width: 60,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  pageCellNumber: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pageCellSub: {
    fontSize: 9,
    fontWeight: '800',
  },
});
