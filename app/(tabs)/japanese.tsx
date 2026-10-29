import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
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

export default function JapaneseHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useLearningStore();

  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(
    Math.floor((state.currentJPLevel - 1) / 10)
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(state.currentJPLevel);
  const [filterKind, setFilterKind] = useState<JPSubjectKind | 'all' | 'mined'>('all');
  const [inspectedSubject, setInspectedSubject] = useState<JPSubject | null>(null);

  const dueReviews = selectDueJapaneseReviews(state);
  const availableLessons = selectAvailableJapaneseLessons(state);

  // Calculate SRS Bucket Totals across all unlocked items + mined cards
  const assignmentsList = Object.values(state.jpAssignments);
  const apprenticeCount =
    assignmentsList.filter((a) => a.srsStage >= 1 && a.srsStage <= 4).length +
    state.jpMinedCards.filter((m) => m.srsStage >= 1 && m.srsStage <= 4).length;
  const guruCount =
    assignmentsList.filter((a) => a.srsStage >= 5 && a.srsStage <= 6).length +
    state.jpMinedCards.filter((m) => m.srsStage >= 5 && m.srsStage <= 6).length;
  const masterCount =
    assignmentsList.filter((a) => a.srsStage === 7).length +
    state.jpMinedCards.filter((m) => m.srsStage === 7).length;
  const enlightenedCount =
    assignmentsList.filter((a) => a.srsStage === 8).length +
    state.jpMinedCards.filter((m) => m.srsStage === 8).length;
  const burnedCount =
    assignmentsList.filter((a) => a.srsStage === 9).length +
    state.jpMinedCards.filter((m) => m.srsStage === 9).length;

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
        return { fg: colors.jpRadical, bg: colors.jpRadicalBg, label: 'Radical' };
      case 'kanji':
        return { fg: colors.jpKanji, bg: colors.jpKanjiBg, label: 'Kanji' };
      case 'vocab':
        return { fg: colors.jpVocab, bg: colors.jpVocabBg, label: 'Vocab' };
      case 'grammar':
        return { fg: colors.jpGrammar, bg: colors.jpGrammarBg, label: 'Grammar' };
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Study Session Launch Bar */}
      <View style={styles.sessionBar}>
        <Pressable
          onPress={() => router.push('/japanese/review')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            {
              backgroundColor:
                dueReviews.totalCount > 0 ? colors.jpKanji : colors.bgSurface,
              borderColor:
                dueReviews.totalCount > 0 ? colors.jpKanji : colors.border,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.launchCount,
              { color: dueReviews.totalCount > 0 ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            {dueReviews.totalCount}
          </Text>
          <Text
            style={[
              styles.launchTitle,
              {
                color:
                  dueReviews.totalCount > 0 ? '#FFFFFF' : colors.textSecondary,
              },
            ]}
          >
            Due Typed Reviews
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/japanese/lessons')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            {
              backgroundColor:
                availableLessons.length > 0 ? colors.jpVocab : colors.bgSurface,
              borderColor:
                availableLessons.length > 0 ? colors.jpVocab : colors.border,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.launchCount,
              {
                color:
                  availableLessons.length > 0 ? '#FFFFFF' : colors.textPrimary,
              },
            ]}
          >
            {availableLessons.length}
          </Text>
          <Text
            style={[
              styles.launchTitle,
              {
                color:
                  availableLessons.length > 0 ? '#FFFFFF' : colors.textSecondary,
              },
            ]}
          >
            Available Lessons
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/japanese/reading')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.launchCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderStrong,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.launchCount, { color: colors.jpRadical }]}>
            {state.jpPassages.length}
          </Text>
          <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>
            Reading & Mining
          </Text>
        </Pressable>
      </View>

      {/* WaniKani 9-Stage SRS Distribution */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          SRS Stage Distribution ({state.jpSubjects.length.toLocaleString()} Total Curriculum Items)
        </Text>
        <View style={styles.srsGrid}>
          {[
            { name: 'Apprentice', count: apprenticeCount, sub: 'Stages I-IV' },
            { name: 'Guru', count: guruCount, sub: 'Unlocks Next' },
            { name: 'Master', count: masterCount, sub: '1 Month' },
            { name: 'Enlightened', count: enlightenedCount, sub: '4 Months' },
            { name: 'Burned', count: burnedCount, sub: 'Permanent' },
          ].map((b) => (
            <View
              key={b.name}
              style={[
                styles.srsBucketBox,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.srsBucketCount, { color: colors.textPrimary }]}>
                {b.count}
              </Text>
              <Text style={[styles.srsBucketName, { color: colors.textPrimary }]}>
                {b.name}
              </Text>
              <Text style={[styles.srsBucketSub, { color: colors.textMuted }]}>
                {b.sub}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Full WaniKani Level 1-60 Navigator */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.levelHeaderRow}>
          <View>
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
                onPress={() => router.push('/japanese/reading')}
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
                    <Text style={[styles.tileKindTag, { color: kindStyle.fg }]}>
                      {kindStyle.label}
                    </Text>
                    <Text
                      style={[
                        styles.tileStageTag,
                        { color: isLocked ? colors.textMuted : colors.textSecondary },
                      ]}
                    >
                      {stageName}
                    </Text>
                  </View>
                  <Text style={[styles.tileCharacter, { color: colors.textPrimary }]}>
                    {subj.characters}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.tileMeaning, { color: colors.textPrimary }]}
                  >
                    {subj.meanings[0]}
                  </Text>
                  {subj.readings.length > 0 ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.tileReading, { color: colors.textSecondary }]}
                    >
                      {subj.readings[0]}
                    </Text>
                  ) : (
                    <Text style={[styles.tileReading, { color: colors.textMuted }]}>
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
  sessionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  launchCard: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  launchCount: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  launchTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    padding: 10,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 2,
  },
  srsBucketCount: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  srsBucketName: {
    fontSize: 12,
    fontWeight: '700',
  },
  srsBucketSub: {
    fontSize: 10,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierBtn: {
    flex: 1,
    minWidth: 95,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  tierBtnName: {
    fontSize: 12,
    fontWeight: '800',
  },
  tierBtnRange: {
    fontSize: 11,
    fontWeight: '600',
  },
  levelSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelPill: {
    minWidth: 54,
    paddingHorizontal: 10,
    minHeight: 38,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unlockProgressBox: {
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
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
    fontWeight: '600',
  },
  unlockProgressValue: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectTile: {
    width: '48%',
    minHeight: 112,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileKindTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tileStageTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  tileCharacter: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  tileMeaning: {
    fontSize: 14,
    fontWeight: '700',
  },
  tileReading: {
    fontSize: 12,
  },
  emptyMinedBox: {
    padding: SPACING.lg,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  emptyMinedTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyMinedSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyActionBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: RADII.sm,
    justifyContent: 'center',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  minedList: {
    gap: 8,
  },
  minedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: 10,
  },
  minedLeft: {
    flex: 1,
    gap: 2,
  },
  minedChars: {
    fontSize: 16,
    fontWeight: '700',
  },
  minedMeaning: {
    fontSize: 13,
    fontWeight: '600',
  },
  minedContext: {
    fontSize: 12,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
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
    fontWeight: '700',
  },
  modalCharacter: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 2,
  },
  closeModalBtn: {
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalMeaning: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalReading: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalPitch: {
    fontSize: 13,
    fontWeight: '600',
  },
  grammarFormulaBox: {
    padding: 10,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  grammarFormulaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mnemonicBox: {
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: 4,
  },
  mnemonicTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mnemonicBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  contextBlock: {
    gap: 6,
    marginTop: 4,
  },
  contextItem: {
    gap: 2,
  },
  contextJa: {
    fontSize: 15,
    fontWeight: '700',
  },
  contextFuri: {
    fontSize: 12,
  },
  contextEn: {
    fontSize: 13,
  },
});
