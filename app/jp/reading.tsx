import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import { useLearningStore } from '../../src/store/useLearningStore';
import { JPReadingSentence, JPReadingToken } from '../../src/data/jp-seed';

export default function JapaneseReadingMiningScreen() {
  const { colors } = useTheme();
  const passages = useLearningStore((s) => s.jpPassages);
  const minedCards = useLearningStore((s) => s.jpMinedCards);
  const mineSentenceCard = useLearningStore((s) => s.mineSentenceCard);

  const [selectedPassageId, setSelectedPassageId] = useState(
    passages[0]?.id || 'read-morning-study'
  );
  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{
    token: JPReadingToken;
    sentence: JPReadingSentence;
  } | null>(null);
  const [mineNotice, setMineNotice] = useState<string | null>(null);

  const activePassage =
    passages.find((p) => p.id === selectedPassageId) || passages[0];

  const handleMineToken = async () => {
    if (!selectedWord || !selectedWord.token.meaning || !selectedWord.token.reading) {
      return;
    }
    const surface = selectedWord.token.baseForm || selectedWord.token.surface;
    await mineSentenceCard({
      sourcePassageId: activePassage.id,
      characters: surface,
      reading: selectedWord.token.reading,
      meaning: selectedWord.token.meaning,
      contextSentenceJa: selectedWord.sentence.ja,
      contextSentenceEn: selectedWord.sentence.en,
    });
    setMineNotice(
      `Added "${surface}" (${selectedWord.token.reading}) to your Apprentice I SRS queue!`
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* Passage Selector & Controls */}
      <View style={styles.selectorRow}>
        {passages.map((p) => {
          const isSelected = p.id === activePassage.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                setSelectedPassageId(p.id);
                setSelectedWord(null);
                setMineNotice(null);
              }}
              accessibilityRole="button"
              style={[
                styles.passageTab,
                {
                  backgroundColor: isSelected
                    ? colors.jpVocab
                    : colors.bgSurface,
                  borderColor: isSelected ? colors.jpVocab : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.passageTabTitle,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {p.jlptLevel} • {p.titleJa}
              </Text>
              <Text
                style={[
                  styles.passageTabSub,
                  {
                    color: isSelected
                      ? 'rgba(255,255,255,0.85)'
                      : colors.textSecondary,
                  },
                ]}
              >
                {p.titleEn}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Reader Display Toggles */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setShowFurigana((v) => !v)}
          accessibilityRole="button"
          style={[
            styles.toggleBtn,
            {
              backgroundColor: showFurigana
                ? colors.jpVocabBg
                : colors.bgSurface,
              borderColor: showFurigana ? colors.jpVocab : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.toggleBtnText,
              { color: showFurigana ? colors.jpVocab : colors.textSecondary },
            ]}
          >
            Furigana: {showFurigana ? 'ON' : 'OFF'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowTranslation((v) => !v)}
          accessibilityRole="button"
          style={[
            styles.toggleBtn,
            {
              backgroundColor: showTranslation
                ? colors.jpRadicalBg
                : colors.bgSurface,
              borderColor: showTranslation ? colors.jpRadical : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.toggleBtnText,
              {
                color: showTranslation
                  ? colors.jpRadical
                  : colors.textSecondary,
              },
            ]}
          >
            English Translation: {showTranslation ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
      </View>

      {/* Reading Passage Surface */}
      <View
        style={[
          styles.readerCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.passageHeadline, { color: colors.textPrimary }]}>
          {activePassage.titleJa}
        </Text>
        <Text style={[styles.passageSummary, { color: colors.textSecondary }]}>
          {activePassage.summary} • Tap any underlined word below to look up its definition and mine it to SRS.
        </Text>

        <View style={styles.sentenceList}>
          {activePassage.sentences.map((sent) => (
            <View
              key={sent.id}
              style={[
                styles.sentenceBlock,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.tokenFlow}>
                {sent.tokens.map((tok, idx) => {
                  const isInteractive = Boolean(tok.meaning && tok.reading);
                  const isActive =
                    selectedWord?.token === tok &&
                    selectedWord?.sentence.id === sent.id;

                  if (!isInteractive) {
                    return (
                      <View key={idx} style={styles.plainTokenWrap}>
                        {showFurigana ? <View style={styles.furiSpacer} /> : null}
                        <Text
                          style={[
                            styles.tokenSurfacePlain,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {tok.surface}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setSelectedWord({ token: tok, sentence: sent });
                        setMineNotice(null);
                      }}
                      accessibilityRole="button"
                      style={[
                        styles.interactiveTokenWrap,
                        {
                          backgroundColor: isActive
                            ? colors.jpVocabBg
                            : 'transparent',
                          borderBottomColor: isActive
                            ? colors.jpVocab
                            : colors.borderStrong,
                        },
                      ]}
                    >
                      {showFurigana ? (
                        <Text
                          style={[
                            styles.furiganaText,
                            { color: colors.jpVocab },
                          ]}
                        >
                          {tok.reading}
                        </Text>
                      ) : null}
                      <Text
                        style={[
                          styles.tokenSurfaceInteractive,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {tok.surface}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {showTranslation ? (
                <Text style={[styles.sentenceEn, { color: colors.textSecondary }]}>
                  {sent.en}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Tap-to-Lookup Dictionary & 1-Tap SRS Mining Sheet */}
      <View
        style={[
          styles.dictionarySheet,
          {
            backgroundColor: colors.bgSurface,
            borderColor: selectedWord ? colors.jpVocab : colors.border,
          },
        ]}
      >
        {selectedWord ? (
          <>
            <View style={styles.dictTopRow}>
              <View>
                <Text style={[styles.dictWord, { color: colors.textPrimary }]}>
                  {selectedWord.token.baseForm || selectedWord.token.surface}
                </Text>
                <Text style={[styles.dictReading, { color: colors.jpVocab }]}>
                  Reading: {selectedWord.token.reading}
                  {selectedWord.token.jlpt ? ` • ${selectedWord.token.jlpt}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={handleMineToken}
                accessibilityRole="button"
                style={[
                  styles.mineBtn,
                  { backgroundColor: colors.jpVocab },
                ]}
              >
                <Text style={styles.mineBtnText}>+ Mine to SRS Queue</Text>
              </Pressable>
            </View>

            <Text style={[styles.dictMeaning, { color: colors.textPrimary }]}>
              Definition: {selectedWord.token.meaning}
            </Text>
            <Text style={[styles.dictSentenceContext, { color: colors.textSecondary }]}>
              Context: {selectedWord.sentence.ja}
            </Text>

            {mineNotice ? (
              <View
                style={[
                  styles.mineSuccessBanner,
                  { backgroundColor: colors.successBg, borderColor: colors.success },
                ]}
              >
                <Text style={[styles.mineSuccessText, { color: colors.success }]}>
                  {mineNotice}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.dictPlaceholder, { color: colors.textSecondary }]}>
            Tap any word in the passage above to inspect its reading, dictionary definition, and add it to your Japanese SRS queue in one tap. Currently mined cards: {minedCards.length}.
          </Text>
        )}
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
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  passageTab: {
    flex: 1,
    minWidth: 150,
    padding: SPACING.md,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 2,
  },
  passageTabTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  passageTabSub: {
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  readerCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  passageHeadline: {
    fontSize: 22,
    fontWeight: '800',
  },
  passageSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  sentenceList: {
    gap: SPACING.md,
  },
  sentenceBlock: {
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    gap: 8,
  },
  tokenFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    rowGap: 8,
  },
  plainTokenWrap: {
    justifyContent: 'flex-end',
    paddingVertical: 2,
  },
  furiSpacer: {
    height: 14,
  },
  tokenSurfacePlain: {
    fontSize: 20,
    lineHeight: 28,
  },
  interactiveTokenWrap: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderBottomWidth: 2,
    marginHorizontal: 1,
  },
  furiganaText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  tokenSurfaceInteractive: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  sentenceEn: {
    fontSize: 13,
    lineHeight: 19,
  },
  dictionarySheet: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: SPACING.lg,
    gap: 10,
  },
  dictTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dictWord: {
    fontSize: 24,
    fontWeight: '800',
  },
  dictReading: {
    fontSize: 14,
    fontWeight: '700',
  },
  mineBtn: {
    paddingHorizontal: 22,
    minHeight: 46,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dictMeaning: {
    fontSize: 15,
    fontWeight: '700',
  },
  dictSentenceContext: {
    fontSize: 13,
  },
  mineSuccessBanner: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 4,
  },
  mineSuccessText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dictPlaceholder: {
    fontSize: 13,
    lineHeight: 19,
  },
});

