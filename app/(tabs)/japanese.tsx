import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  JP_SUBJECT_BY_ID,
  JP_SUBJECTS_BY_LEVEL,
  selectAvailableJapaneseLessons,
  selectDueJapaneseReviews,
  useLearningStore,
} from '../../src/store/useLearningStore';
import { JPSubject, JPSubjectKind } from '../../src/data/jp-seed';
import { WANIKANI_STAGES } from '../../src/lib/srs-wanikani';

const WANIKANI_TIERS = [
  { name: 'Pleasant', range: '1-10', start: 1, end: 10 },
  { name: 'Painful', range: '11-20', start: 11, end: 20 },
  { name: 'Death', range: '21-30', start: 21, end: 30 },
  { name: 'Hell', range: '31-40', start: 31, end: 40 },
  { name: 'Paradise', range: '41-50', start: 41, end: 50 },
  { name: 'Reality', range: '51-60', start: 51, end: 60 },
] as const;

// WaniKani's own item-type colors, kept on this screen so it reads like the original dashboard.
const WK = { radical: '#00AAFF', kanji: '#FF00AA', vocab: '#AA00FF' } as const;

const SPREAD_BUCKETS = [
  { name: 'Apprentice', min: 1, max: 4 },
  { name: 'Guru', min: 5, max: 6 },
  { name: 'Master', min: 7, max: 7 },
  { name: 'Enlightened', min: 8, max: 8 },
  { name: 'Burned', min: 9, max: 9 },
] as const;

export default function JapaneseHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();
  const { width } = useWindowDimensions();
  const narrow = width < 640;
  const DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const within = (iso: string | null | undefined, ms: number) =>
    Boolean(iso) && nowMs - new Date(iso as string).getTime() <= ms;
  const recentlyUnlocked = Object.values(state.jpAssignments).filter((a) => within(a.unlockedAt, 30 * DAY));
  const recentlyBurned = Object.values(state.jpAssignments).filter((a) => a.srsStage === 9 && within(a.burnedAt, 30 * DAY));
  const criticalItems = Object.values(state.jpAssignments).filter(
    (a) => a.srsStage >= 1 && a.srsStage < 9 && a.incorrectCount > 0 && a.incorrectCount >= a.correctStreak
  );
  const recentMistakeCount = state.reviewLogs.filter(
    (l) => l.domain === 'japanese' && l.mistakes > 0 && within(l.reviewedAt, DAY)
  ).length;
  const recentLessonCount = recentlyUnlocked.filter((a) => within(a.unlockedAt, DAY)).length;
  const burnedTotal = Object.values(state.jpAssignments).filter((a) => a.srsStage === 9).length;

  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(
    Math.floor((state.currentJPLevel - 1) / 10)
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(state.currentJPLevel);
  const [filterKind, setFilterKind] = useState<JPSubjectKind | 'all' | 'mined'>('all');
  const [inspectedSubject, setInspectedSubject] = useState<JPSubject | null>(null);

  const dueReviews = selectDueJapaneseReviews(state);
  const availableLessons = selectAvailableJapaneseLessons(state);

  const dashGray = colors.mode === 'dark' ? colors.bgMuted : '#E8ECF0';
  const dashBorder = colors.mode === 'dark' ? colors.border : '#DEDEDE';

  const spreadRows = SPREAD_BUCKETS.map((b) => {
    const c = { radical: 0, kanji: 0, vocab: 0, total: 0 };
    for (const [id, a] of Object.entries(state.jpAssignments)) {
      if (a.srsStage < b.min || a.srsStage > b.max) continue;
      const kind = JP_SUBJECT_BY_ID[id]?.kind;
      if (kind === 'radical') c.radical++;
      else if (kind === 'kanji') c.kanji++;
      else if (kind === 'vocab') c.vocab++;
      c.total++;
    }
    for (const m of state.jpMinedCards) {
      if (m.srsStage >= b.min && m.srsStage <= b.max) {
        c.vocab++;
        c.total++;
      }
    }
    return { name: b.name, ...c };
  });

  const rawLevelSubjects = JP_SUBJECTS_BY_LEVEL[selectedLevel] || [];

  // Level Kanji Guru Progression (90% Kanji at Guru I unlocks next level)
  const currentLevelKanji = rawLevelSubjects.filter((s) => s.kind === 'kanji');
  const guruKanjiInLevel = currentLevelKanji.filter(
    (k) => state.jpAssignments[k.id]?.passedGuru
  ).length;
  const requiredForLevelUp = Math.max(1, Math.ceil(currentLevelKanji.length * 0.9));

  const levelSubjects = rawLevelSubjects.filter((s) => {
    if (filterKind !== 'all' && filterKind !== 'mined' && s.kind !== filterKind) {
      return false;
    }
    return true;
  });

  const levelPassed = (kind: JPSubjectKind) =>
    rawLevelSubjects.filter(
      (s) => s.kind === kind && state.jpAssignments[s.id]?.passedGuru
    ).length;
  const levelPassedAll =
    rawLevelSubjects.length > 0 &&
    rawLevelSubjects
      .filter((s) => s.kind !== 'grammar')
      .every((s) => state.jpAssignments[s.id]?.passedGuru);
  const goToLevel = (lvl: number) => {
    const next = Math.min(60, Math.max(1, lvl));
    setSelectedLevel(next);
    setSelectedTierIndex(Math.floor((next - 1) / 10));
  };

  const levelRadicalsCount = rawLevelSubjects.filter((s) => s.kind === 'radical').length;
  const levelKanjiCount = currentLevelKanji.length;
  const levelVocabCount = rawLevelSubjects.filter((s) => s.kind === 'vocab').length;
  const levelGrammarCount = rawLevelSubjects.filter((s) => s.kind === 'grammar').length;

  const activeTier = WANIKANI_TIERS[selectedTierIndex] || WANIKANI_TIERS[0];
  const tierLevels = Array.from(
    { length: 10 },
    (_, idx) => activeTier.start + idx
  );

  const getKindColors = (kind: JPSubjectKind) => {
    switch (kind) {
      case 'radical':
        return { fg: WK.radical, bg: WK.radical, label: 'Radical' };
      case 'kanji':
        return { fg: WK.kanji, bg: WK.kanji, label: 'Kanji' };
      case 'vocab':
        return { fg: WK.vocab, bg: WK.vocab, label: 'Vocab' };
      case 'grammar':
        return { fg: colors.jpGrammar, bg: colors.jpGrammarBg, label: 'Grammar' };
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.mode === 'dark' ? colors.bgPrimary : '#F4F4F4' }]}
      contentContainerStyle={styles.content}
    >
      {/* WaniKani-style dashboard: Lessons / Reviews / Reading */}
      <View style={[styles.sessionBar, narrow && styles.stackCol]}>
        <Pressable
          disabled={availableLessons.length === 0}
          onPress={() => router.push('/jp/lessons')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            narrow && styles.launchCardNarrow,
            {
              backgroundColor: availableLessons.length > 0 ? WK.kanji : dashGray,
              borderColor: availableLessons.length > 0 ? WK.kanji : dashBorder,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.launchEyebrow, { color: availableLessons.length > 0 ? '#FFFFFF' : colors.textSecondary }]}>
            Today's
          </Text>
          <Text style={[styles.launchTitle, { color: availableLessons.length > 0 ? '#FFFFFF' : colors.textPrimary }]}>
            Lessons
          </Text>
          {availableLessons.length > 0 ? (
            <Text style={[styles.launchCount, { color: '#FFFFFF' }]}>{availableLessons.length}</Text>
          ) : (
            <View style={[styles.donePill, { borderColor: dashBorder, backgroundColor: colors.bgSurface }]}>
              <Text style={[styles.donePillText, { color: colors.textSecondary }]}>Done!</Text>
            </View>
          )}
          <Text style={[styles.launchHint, { color: availableLessons.length > 0 ? 'rgba(255,255,255,0.9)' : colors.textMuted }]}>
            {availableLessons.length > 0
              ? 'New items are ready to learn.'
              : 'All done. Do your Reviews to unlock more Lessons.'}
          </Text>
        </Pressable>

        <Pressable
          disabled={dueReviews.totalCount === 0}
          onPress={() => router.push('/jp/review')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            narrow && styles.launchCardNarrow,
            {
              backgroundColor: dueReviews.totalCount > 0 ? WK.radical : dashGray,
              borderColor: dueReviews.totalCount > 0 ? WK.radical : dashBorder,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.launchEyebrow, { color: dueReviews.totalCount > 0 ? '#FFFFFF' : colors.textSecondary }]}>
            Available
          </Text>
          <Text style={[styles.launchTitle, { color: dueReviews.totalCount > 0 ? '#FFFFFF' : colors.textPrimary }]}>
            Reviews
          </Text>
          <View style={[styles.donePill, { borderColor: dueReviews.totalCount > 0 ? '#FFFFFF' : dashBorder, backgroundColor: dueReviews.totalCount > 0 ? 'transparent' : colors.bgSurface }]}>
            <Text style={[styles.donePillText, { color: dueReviews.totalCount > 0 ? '#FFFFFF' : colors.textSecondary }]}>
              {dueReviews.totalCount}
            </Text>
          </View>
          <Text style={[styles.launchHint, { color: dueReviews.totalCount > 0 ? 'rgba(255,255,255,0.9)' : colors.textMuted }]}>
            {dueReviews.totalCount > 0
              ? 'Reviews are waiting for you.'
              : 'There are no more Reviews to do right now.'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/jp/reading')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            styles.launchCardWide,
            { backgroundColor: colors.bgSurface, borderColor: dashBorder, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>Reading & Mining</Text>
          <Text style={[styles.launchHint, { color: colors.textSecondary }]}>
            {state.jpPassages.length} passages. Tap a word to add it to your SRS queue.
          </Text>
          <Text style={[styles.seeAll, { color: WK.vocab }]}>Open ›</Text>
        </Pressable>
      </View>

      {/* Recent Mistakes + Extra Study */}
      <View style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: dashBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Mistakes</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          {recentMistakeCount > 0
            ? `${recentMistakeCount} review${recentMistakeCount === 1 ? '' : 's'} with a mistake in the last 24 hours. They resurface in your normal queue.`
            : 'Come back within 24 hours of getting something wrong. Then you will have something here to study.'}
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: dashBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Extra Study</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          A snapshot of your recent activity, outside your regular Reviews.
        </Text>
        {[
          { label: 'Recent Lessons', n: recentLessonCount },
          { label: 'Recent Mistakes', n: recentMistakeCount },
          { label: 'Burned Items', n: burnedTotal },
        ].map((r) => (
          <View key={r.label} style={[styles.spreadRow, { backgroundColor: colors.bgMuted, borderColor: dashBorder }]}>
            <Text style={[styles.spreadName, { color: colors.textPrimary }]}>{r.label}</Text>
            <View style={[styles.countPill, { backgroundColor: colors.textSecondary }]}>
              <Text style={styles.countPillText}>{r.n}</Text>
            </View>
          </View>
        ))}
      </View>
      {/* Level Progress */}
      <View style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: dashBorder }]}>
        <View style={styles.levelHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Level Progress</Text>
          <View style={styles.levelStepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous level"
              disabled={selectedLevel <= 1}
              onPress={() => goToLevel(selectedLevel - 1)}
              style={styles.stepperBtn}
            >
              <Feather name="chevron-left" size={22} color={selectedLevel <= 1 ? colors.textMuted : colors.textPrimary} />
            </Pressable>
            <Text style={[styles.stepperLevel, { color: colors.textPrimary }]}>Level {selectedLevel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next level"
              disabled={selectedLevel >= 60}
              onPress={() => goToLevel(selectedLevel + 1)}
              style={styles.stepperBtn}
            >
              <Feather name="chevron-right" size={22} color={selectedLevel >= 60 ? colors.textMuted : colors.textPrimary} />
            </Pressable>
          </View>
        </View>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Number of items Guru'd in this level
        </Text>
        <View style={[styles.levelColsRow, narrow && styles.stackCol]}>
          {([
            { kind: 'radical', label: 'Radicals', color: WK.radical, passed: levelPassed('radical'), total: levelRadicalsCount },
            { kind: 'kanji', label: 'Kanji', color: WK.kanji, passed: levelPassed('kanji'), total: levelKanjiCount },
            { kind: 'vocab', label: 'Vocabulary', color: WK.vocab, passed: levelPassed('vocab'), total: levelVocabCount },
          ] as const).map((col) => (
            <Pressable
              key={col.kind}
              accessibilityRole="button"
              onPress={() => setFilterKind(col.kind)}
              style={[styles.levelCol, narrow && styles.levelColRow, narrow ? { borderLeftColor: col.color } : null, { borderTopColor: col.color, backgroundColor: colors.bgMuted }]}
            >
              <Text style={[styles.levelColLabel, { color: col.color }]}>{col.label}</Text>
              <Text style={[styles.levelColCount, { color: colors.textPrimary }]}>
                {col.passed}/{col.total}
              </Text>
              <Text style={[styles.seeAll, { color: colors.textSecondary }]}>See All ›</Text>
            </Pressable>
          ))}
        </View>
        <View
          style={[
            styles.passBanner,
            {
              backgroundColor: levelPassedAll ? '#DDF3E4' : colors.bgMuted,
              borderColor: levelPassedAll ? '#9AD4AB' : dashBorder,
            },
          ]}
        >
          <Text style={[styles.passBannerText, { color: levelPassedAll ? '#1F6B3A' : colors.textSecondary }]}>
            {levelPassedAll
              ? "You've passed this level, and you've Guru'd all its items. Great job!"
              : `Guru ${requiredForLevelUp - guruKanjiInLevel} more kanji (90%) to pass level ${selectedLevel}.`}
          </Text>
        </View>
      </View>

      {/* Item Spread */}
      <View style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: dashBorder }]}>
        <View style={styles.levelHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Item Spread</Text>
          <View style={styles.legendRow}>
            {[
              { label: 'Radicals', color: WK.radical },
              { label: 'Kanji', color: WK.kanji },
              { label: 'Vocab', color: WK.vocab },
            ].map((l) => (
              <View key={l.label} style={[styles.legendChip, { backgroundColor: l.color }]}>
                <Text style={styles.legendChipText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.spreadTable}>
          {spreadRows.map((row) => (
            <View key={row.name} style={[styles.spreadRow, { backgroundColor: colors.bgMuted, borderColor: dashBorder }]}>
              <Text style={[styles.spreadName, { color: colors.textPrimary }]}>{row.name}</Text>
              <View style={styles.spreadPills}>
                <View style={[styles.countPill, { backgroundColor: WK.radical }]}>
                  <Text style={styles.countPillText}>{row.radical}</Text>
                </View>
                <View style={[styles.countPill, { backgroundColor: WK.kanji }]}>
                  <Text style={styles.countPillText}>{row.kanji}</Text>
                </View>
                <View style={[styles.countPill, { backgroundColor: WK.vocab }]}>
                  <Text style={styles.countPillText}>{row.vocab}</Text>
                </View>
                <View style={[styles.countPill, { backgroundColor: colors.textSecondary }]}>
                  <Text style={styles.countPillText}>{row.total}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recently Unlocked / Critical Condition / Recently Burned */}
      {[
        { title: 'Recently Unlocked', sub: 'Items that you have unlocked in the last 30 days.', empty: 'Do Lessons and Reviews to unlock more items.', items: recentlyUnlocked },
        { title: 'Critical Condition Items', sub: 'Items that could use some extra study time.', empty: 'Your items are in good health.', items: criticalItems },
        { title: 'Recently Burned', sub: 'Items that you have burned in the last 30 days.', empty: 'Nothing burned yet. Keep reviewing.', items: recentlyBurned },
      ].map((box) => (
        <View key={box.title} style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: dashBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{box.title}</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{box.sub}</Text>
          {box.items.length === 0 ? (
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>{box.empty}</Text>
          ) : (
            <View style={styles.chipWrap}>
              {box.items.slice(0, 24).map((a) => {
                const subj = JP_SUBJECT_BY_ID[a.subjectId];
                if (!subj) return null;
                const kc = subj.kind === 'radical' ? WK.radical : subj.kind === 'kanji' ? WK.kanji : WK.vocab;
                return (
                  <Pressable
                    key={a.subjectId}
                    accessibilityRole="button"
                    onPress={() => setInspectedSubject(subj)}
                    style={[styles.itemChip, { backgroundColor: kc }]}
                  >
                    <Text style={styles.itemChipText}>{subj.characters}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ))}
      {/* Full WaniKani Level 1-60 Navigator */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.levelHeaderRow}>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              WaniKani Progressive Levels (1 to 60)
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              478 Radicals • 2,026 Kanji • 6,345 Vocabulary • JLPT Cloze Grammar
            </Text>
          </View>
        </View>

        {/* 6 WaniKani 10-Level Tier Tabs */}
        <View style={styles.tierRow}>
          {WANIKANI_TIERS.map((tier, idx) => {
            const active = selectedTierIndex === idx;
            return (
              <Pressable
                key={tier.name}
                onPress={() => {
                  setSelectedTierIndex(idx);
                  setSelectedLevel(tier.start);
                }}
                accessibilityRole="button"
                style={[
                  styles.tierBtn,
                  {
                    backgroundColor: active ? colors.textPrimary : colors.bgMuted,
                    borderColor: active ? colors.textPrimary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tierBtnName,
                    { color: active ? colors.bgPrimary : colors.textPrimary },
                  ]}
                >
                  {tier.name}
                </Text>
                <Text
                  style={[
                    styles.tierBtnRange,
                    {
                      color: active ? colors.bgPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  Lv {tier.range}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 10 Levels inside Selected Tier */}
        <View style={styles.levelSelectorRow}>
          {tierLevels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const isCurrent = lvl === state.currentJPLevel;
            return (
              <Pressable
                key={lvl}
                onPress={() => setSelectedLevel(lvl)}
                accessibilityRole="button"
                style={[
                  styles.levelPill,
                  {
                    backgroundColor: isSelected
                      ? colors.jpVocab
                      : colors.bgMuted,
                    borderColor: isSelected
                      ? colors.jpVocab
                      : isCurrent
                      ? colors.jpKanji
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                    },
                  ]}
                >
                  Lv {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Kanji Guru Unlock Progress Bar */}
        <View
          style={[
            styles.unlockProgressBox,
            { backgroundColor: colors.bgMuted, borderColor: colors.border },
          ]}
        >
          <View style={styles.unlockProgressTextRow}>
            <Text style={[styles.unlockProgressLabel, { color: colors.textPrimary }]}>
              Level {selectedLevel} Kanji at Guru I ({levelRadicalsCount} Radicals • {levelKanjiCount} Kanji • {levelVocabCount} Vocab)
            </Text>
            <Text style={[styles.unlockProgressValue, { color: colors.jpKanji }]}>
              {guruKanjiInLevel} / {requiredForLevelUp} for Lv {Math.min(60, selectedLevel + 1)}
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.bgSurface },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    Math.round((guruKanjiInLevel / requiredForLevelUp) * 100)
                  )}%`,
                  backgroundColor: colors.jpKanji,
                },
              ]}
            />
          </View>
        </View>

        {/* Subject Type Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {(
            [
              { key: 'all', label: `All (${rawLevelSubjects.length})` },
              { key: 'radical', label: `Radicals (${levelRadicalsCount})` },
              { key: 'kanji', label: `Kanji (${levelKanjiCount})` },
              { key: 'vocab', label: `Vocab (${levelVocabCount})` },
              { key: 'grammar', label: `Grammar (${levelGrammarCount})` },
              { key: 'mined', label: `Mined (${state.jpMinedCards.length})` },
            ] as const
          ).map((tab) => {
            const active = filterKind === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilterKind(tab.key)}
                accessibilityRole="button"
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: active ? colors.jpVocabBg : colors.bgMuted,
                    borderColor: active ? colors.jpVocab : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: active ? colors.jpVocab : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Subject Grid or Mined Cards List */}
        {filterKind === 'mined' ? (
          state.jpMinedCards.length === 0 ? (
            <View
              style={[
                styles.emptyMinedBox,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.emptyMinedTitle, { color: colors.textPrimary }]}>
                No Mined Cards Yet
              </Text>
              <Text style={[styles.emptyMinedSub, { color: colors.textSecondary }]}>
                Open Reading & Sentence Mining, tap any word in a passage, and press "Mine to SRS Queue" to add cards here.
              </Text>
              <Pressable
                onPress={() => router.push('/jp/reading')}
                accessibilityRole="button"
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: colors.jpVocab },
                ]}
              >
                <Text style={styles.emptyActionBtnText}>
                  Open Reading Passages
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.minedList}>
              {state.jpMinedCards.map((card) => (
                <View
                  key={card.id}
                  style={[
                    styles.minedRow,
                    { backgroundColor: colors.bgMuted, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.minedLeft}>
                    <Text style={[styles.minedChars, { color: colors.textPrimary }]}>
                      {card.characters} ({card.reading})
                    </Text>
                    <Text style={[styles.minedMeaning, { color: colors.textSecondary }]}>
                      {card.meaning}
                    </Text>
                    <Text style={[styles.minedContext, { color: colors.textMuted }]}>
                      {card.contextSentenceJa}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stageBadge,
                      { backgroundColor: colors.jpVocabBg },
                    ]}
                  >
                    <Text style={[styles.stageBadgeText, { color: colors.jpVocab }]}>
                      {WANIKANI_STAGES[card.srsStage].name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          <View style={styles.subjectGrid}>
            {levelSubjects.map((subj) => {
              const assign = state.jpAssignments[subj.id];
              const isLocked = !assign;
              const stageName = isLocked
                ? 'Locked'
                : WANIKANI_STAGES[assign.srsStage].name;
              const kindStyle = getKindColors(subj.kind);

              return (
                <Pressable
                  key={subj.id}
                  onPress={() => setInspectedSubject(subj)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.subjectTile,
                    {
                      backgroundColor: isLocked
                        ? colors.bgMuted
                        : kindStyle.bg,
                      borderColor: isLocked ? colors.border : kindStyle.fg,
                      opacity: pressed ? 0.8 : isLocked ? 0.72 : 1,
                    },
                  ]}
                >
                  <View style={styles.tileTopRow}>
                    <Text style={[styles.tileKindTag, { color: isLocked ? colors.textMuted : 'rgba(255,255,255,0.9)' }]}>
                      {kindStyle.label}
                    </Text>
                    <Text
                      style={[
                        styles.tileStageTag,
                        { color: isLocked ? colors.textMuted : 'rgba(255,255,255,0.9)' },
                      ]}
                    >
                      {stageName}
                    </Text>
                  </View>
                  <Text style={[styles.tileCharacter, { color: isLocked ? colors.textPrimary : '#FFFFFF' }]}>
                    {subj.characters}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.tileMeaning, { color: isLocked ? colors.textPrimary : '#FFFFFF' }]}
                  >
                    {subj.meanings[0]}
                  </Text>
                  {subj.readings.length > 0 ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.tileReading, { color: isLocked ? colors.textSecondary : 'rgba(255,255,255,0.9)' }]}
                    >
                      {subj.readings[0]}
                    </Text>
                  ) : (
                    <Text style={[styles.tileReading, { color: isLocked ? colors.textMuted : 'rgba(255,255,255,0.85)' }]}>
                      Building Block
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Subject Detail Modal */}
      <Modal
        visible={Boolean(inspectedSubject)}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectedSubject(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong },
            ]}
          >
            {inspectedSubject ? (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalMeta, { color: colors.textSecondary }]}>
                      Level {inspectedSubject.level} • {inspectedSubject.kind.toUpperCase()}
                    </Text>
                    <Text style={[styles.modalCharacter, { color: colors.textPrimary }]}>
                      {inspectedSubject.characters}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setInspectedSubject(null)}
                    accessibilityRole="button"
                    style={[
                      styles.closeModalBtn,
                      { backgroundColor: colors.bgMuted, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.closeModalBtnText, { color: colors.textPrimary }]}>
                      Close
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.modalMeaning, { color: colors.textPrimary }]}>
                  Meanings: {inspectedSubject.meanings.join(', ')}
                </Text>

                {inspectedSubject.readings.length > 0 ? (
                  <Text style={[styles.modalReading, { color: colors.jpVocab }]}>
                    Readings: {inspectedSubject.readings.join(' • ')}
                  </Text>
                ) : null}

                {inspectedSubject.pitchAccent ? (
                  <Text style={[styles.modalPitch, { color: colors.textSecondary }]}>
                    Pitch Accent: {inspectedSubject.pitchAccent}
                  </Text>
                ) : null}

                {inspectedSubject.grammarStructure ? (
                  <View
                    style={[
                      styles.grammarFormulaBox,
                      { backgroundColor: colors.bgMuted, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.grammarFormulaText, { color: colors.jpGrammar }]}>
                      Structure: {inspectedSubject.grammarStructure}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.mnemonicBox,
                    { backgroundColor: colors.bgMuted, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.mnemonicTitle, { color: colors.textPrimary }]}>
                    Mnemonic & Breakdown
                  </Text>
                  <Text style={[styles.mnemonicBody, { color: colors.textSecondary }]}>
                    {inspectedSubject.mnemonic}
                  </Text>
                  {inspectedSubject.readingMnemonic ? (
                    <Text
                      style={[
                        styles.mnemonicBody,
                        { color: colors.textSecondary, marginTop: 6 },
                      ]}
                    >
                      Reading Hint: {inspectedSubject.readingMnemonic}
                    </Text>
                  ) : null}
                </View>

                {inspectedSubject.contextSentences.length > 0 ? (
                  <View style={styles.contextBlock}>
                    <Text style={[styles.mnemonicTitle, { color: colors.textPrimary }]}>
                      Context Sentences
                    </Text>
                    {inspectedSubject.contextSentences.map((cs, idx) => (
                      <View key={idx} style={styles.contextItem}>
                        <Text style={[styles.contextJa, { color: colors.textPrimary }]}>
                          {cs.ja}
                        </Text>
                        <Text style={[styles.contextFuri, { color: colors.textMuted }]}>
                          {cs.furigana}
                        </Text>
                        <Text style={[styles.contextEn, { color: colors.textSecondary }]}>
                          {cs.en}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  stackCol: {
    flexDirection: 'column',
  },
  launchCardNarrow: {
    flex: 0,
    flexBasis: 'auto',
    minHeight: 120,
    minWidth: 0,
    width: '100%',
  },
  levelColRow: {
    flex: 0,
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0,
    borderLeftWidth: 5,
    gap: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemChip: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemChipText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },  sessionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  launchCard: {
    flex: 1,
    minWidth: 150,
    minHeight: 150,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  launchCardWide: {
    flexBasis: '100%',
    minHeight: 0,
  },
  launchEyebrow: {
    fontSize: 11,
    fontWeight: '600',
  },
  donePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  donePillText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  launchHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 'auto',
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '600',
  },
  levelStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepperLevel: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 62,
    textAlign: 'center',
  },
  levelColsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelCol: {
    flex: 1,
    minHeight: 76,
    padding: 10,
    borderRadius: 8,
    borderTopWidth: 4,
    gap: 2,
    justifyContent: 'space-between',
  },
  levelColLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  levelColCount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  passBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  passBannerText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  legendChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  legendChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  spreadTable: {
    gap: 6,
  },
  spreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  spreadName: {
    fontSize: 13,
    fontWeight: '600',
  },
  spreadPills: {
    flexDirection: 'row',
    gap: 4,
  },
  countPill: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: 'center',
  },
  countPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },  launchCount: {
    fontSize: 30,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  launchTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  srsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  srsBucketBox: {
    flex: 1,
    minWidth: 92,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 3,
  },
  srsBucketCount: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  srsBucketName: {
    fontSize: 12,
    fontWeight: '800',
  },
  srsBucketSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierBtn: {
    flex: 1,
    minWidth: 88,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tierBtnName: {
    fontSize: 12,
    fontWeight: '800',
  },
  tierBtnRange: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelPill: {
    minWidth: 54,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unlockProgressBox: {
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 8,
  },
  unlockProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  unlockProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  unlockProgressValue: {
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 12,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    minHeight: 38,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectTile: {
    width: '47%',
    flexGrow: 1,
    minHeight: 118,
    padding: 14,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileKindTag: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tileStageTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  tileCharacter: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  tileMeaning: {
    fontSize: 14,
    fontWeight: '800',
  },
  tileReading: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyMinedBox: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    gap: 8,
    alignItems: 'flex-start',
  },
  emptyMinedTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyMinedSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyActionBtn: {
    marginTop: 6,
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: RADII.pill,
    justifyContent: 'center',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  minedList: {
    gap: 8,
  },
  minedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 10,
  },
  minedLeft: {
    flex: 1,
    gap: 2,
  },
  minedChars: {
    fontSize: 16,
    fontWeight: '800',
  },
  minedMeaning: {
    fontSize: 13,
    fontWeight: '700',
  },
  minedContext: {
    fontSize: 12,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    borderRadius: RADII.xl,
    borderWidth: 2,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalMeta: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalCharacter: {
    fontSize: 44,
    fontWeight: '900',
    marginTop: 2,
  },
  closeModalBtn: {
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalMeaning: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalReading: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalPitch: {
    fontSize: 13,
    fontWeight: '700',
  },
  grammarFormulaBox: {
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1.5,
  },
  grammarFormulaText: {
    fontSize: 13,
    fontWeight: '800',
  },
  mnemonicBox: {
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    gap: 4,
  },
  mnemonicTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  mnemonicBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  contextBlock: {
    gap: 8,
    marginTop: 4,
  },
  contextItem: {
    gap: 2,
  },
  contextJa: {
    fontSize: 15,
    fontWeight: '800',
  },
  contextFuri: {
    fontSize: 12,
  },
  contextEn: {
    fontSize: 13,
  },
});
