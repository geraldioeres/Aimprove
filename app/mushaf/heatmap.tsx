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
import { GLYPH_SHADOW, RADII, SPACING, TILE_LIP } from '../../src/theme/tokens';
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
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Your progress
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalStarted} of 604 pages started. Tap a page to open it.
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
              Sabaq
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
              Sabqi
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
              Manzil
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.bgMuted, borderColor: colors.ink, borderWidth: 1 },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              Not started
            </Text>
          </View>
        </View>
      </View>

      {/* Juz Filter Selector (All 604 or Juz 1..30) */}
      <View
        style={[
          styles.filterCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.filterHeading, { color: colors.textPrimary }]}>
          Juz
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
                  selectedJuz === 'all' ? colors.indigo : colors.bgSurface,
                borderColor:
                  selectedJuz === 'all' ? colors.indigo : colors.ink,
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
              All
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
                    backgroundColor: active ? colors.indigo : colors.bgSurface,
                    borderColor: active ? colors.indigo : colors.ink,
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
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.filterHeading, { color: colors.textPrimary }]}>
          {selectedJuz === 'all'
            ? 'All 604 pages'
            : `Juz ${selectedJuz} · ${filteredPages.length} pages`}
        </Text>

        <View style={styles.heatmapGrid}>
          {filteredPages.map((item) => {
            const prog = quranProgress[item.pageNumber];
            const stage = prog?.stage || 'unstarted';

            let bg = colors.bgSurface;
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
                onPress={() => router.push(`/mushaf/page/${item.pageNumber}`)}
                accessibilityRole="button"
                style={[
                  styles.pageCell,
                  { backgroundColor: bg, borderWidth: 1.5, borderColor: stage !== 'unstarted' ? colors.ink : colors.border },
                ]}
              >
                <Text style={[styles.pageCellNumber, stage !== 'unstarted' && GLYPH_SHADOW, { color: textColor }]}>
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
                          : '#FFFFFF',
                    },
                  ]}
                >
                  {stage === 'unstarted' ? ' ' : stage.charAt(0).toUpperCase() + stage.slice(1)}
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
    borderRadius: 6,
    borderWidth: 2,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    borderRadius: 6,
    borderWidth: 2,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  filterHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  juzScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  juzPill: {
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  juzPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridCard: {
    borderRadius: 6,
    borderWidth: 2,
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
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  pageCellNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pageCellSub: {
    fontSize: 10,
    fontWeight: '700',
  },
});
