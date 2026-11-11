import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADII } from '../theme/tokens';
import { BISMILLAH, SURAHS } from '../data/surahs';
import { AyahNumberMark } from './AyahNumberMark';
import { ChapterInfo, MushafPage, PageWord, loadChapters, loadMushafPage } from '../lib/mushaf-pages';

const TRIAL = 22; // trial font size for measuring lines
const PAPER_PAD = 16;
const fitCache = new Map<string, number>(); // "page:width" -> fitted font size

/**
 * One Madani Mushaf page: 15 lines, full lines spread edge to edge, a surah
 * header (and Bismillah) where a surah starts. The ayah being recited is
 * highlighted; tapping a word reports it (e.g. to play it).
 */
export function MushafPageView({
  page,
  width,
  highlightKey,
  onWord,
  onLoaded,
}: {
  page: number;
  width: number; // available width, for sizing the text
  highlightKey?: string | null;
  onWord?: (w: PageWord) => void;
  onLoaded?: (p: MushafPage) => void;
}) {
  const { colors } = useTheme();
  const [data, setData] = useState<MushafPage | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadMushafPage(page)
      .then((p) => {
        if (!alive) return;
        setData(p);
        onLoaded?.(p);
      })
      .catch(() => alive && setFailed(true));
    loadChapters()
      .then((c) => alive && setChapters(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, attempt]);

  // Mushaf lines must stay whole. Lay the page out once at a trial size,
  // measure the widest line, then size the text so it just fits the box.
  // Width available for a line: the page width less the paper's padding and border.
  const box = Math.max(0, width - 2 * PAPER_PAD - 3);
  // Natural line widths at the trial size, for the page data they belong to.
  // (They don't depend on the box, so a resize only re-sizes the text.)
  const widths = useRef<{ data: MushafPage | null; map: Map<number, number> }>({ data: null, map: new Map() });
  if (widths.current.data !== data) widths.current = { data, map: new Map() };
  const [measured, setMeasured] = useState(0);
  const [fit, setFit] = useState<{ data: MushafPage; size: number } | null>(null);
  const measure = (line: number, w: number) => {
    widths.current.map.set(line, w);
    setMeasured((n) => n + 1);
  };
  // Size the text once every line is measured, and again if the box resizes.
  useEffect(() => {
    const map = widths.current.map;
    if (!data || !box || map.size < data.lines.length) return;
    const key = `${page}:${Math.round(box)}`;
    const widest = Math.max(...map.values());
    const size = fitCache.get(key) ?? Math.max(13, Math.min(32, Math.floor((TRIAL * box) / widest - 0.5)));
    fitCache.set(key, size);
    setFit({ data, size });
  }, [measured, box, data, page]);
  // A page already sized at this width shows straight away.
  const known = data && box ? fitCache.get(`${page}:${Math.round(box)}`) : undefined;
  const fitted = fit && fit.data === data ? fit.size : known ?? null;
  const fontSize = fitted ?? TRIAL;
  const lineHeight = Math.round(fontSize * 2);

  return (
    <View style={[styles.paper, { backgroundColor: colors.mushafPaper, borderColor: colors.mushafBorder }]}>
      {failed ? (
        <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" style={styles.placeholder}>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Couldn't load page {page}. Tap to try again.
          </Text>
        </Pressable>
      ) : !data ? (
        <View style={[styles.placeholder, { minHeight: lineHeight * 15 }]}>
          <ActivityIndicator color={colors.indigo} />
        </View>
      ) : (
        <View style={{ opacity: fitted === null ? 0 : 1 }}>
        {data.lines.map((line) => {
          const chapter = line.surahStart ? chapters?.[line.surahStart - 1] : undefined;
          const full = line.words.length >= 5;
          return (
            <View key={line.line}>
              {line.surahStart ? (
                <View style={styles.headerWrap}>
                  <View style={[styles.surahHeader, { borderColor: colors.quranSabaq, backgroundColor: colors.quranSabaqBg }]}>
                    <Text style={[styles.surahArabic, { color: colors.quranSabaq }]}>
                      {chapter ? `سورة ${chapter.arabic}` : ''}
                    </Text>
                    <Text style={[styles.surahLatin, { color: colors.textSecondary }]}>
                      {SURAHS[line.surahStart - 1]?.name}
                    </Text>
                  </View>
                  {line.surahStart !== 1 && line.surahStart !== 9 ? (
                    <Text style={[styles.bismillah, { color: colors.ink, fontSize, lineHeight }]}>{BISMILLAH}</Text>
                  ) : null}
                </View>
              ) : null}
              <View
                onLayout={fitted === null ? (e) => measure(line.line, e.nativeEvent.layout.width) : undefined}
                style={[
                  styles.line,
                  fitted === null
                    ? styles.lineMeasure // natural width, for measuring
                    : { justifyContent: full ? 'space-between' : 'center' },
                ]}
              >
                {line.words.map((w) => {
                  const lit = highlightKey === w.ayahKey;
                  return (
                    <Pressable
                      key={`${w.ayahKey}:${w.position}`}
                      onPress={() => onWord?.(w)}
                      accessibilityRole="button"
                      accessibilityLabel={w.isEnd ? `End of ayah ${w.ayahKey}` : `Word ${w.position} of ${w.ayahKey}`}
                      style={[styles.word, lit && { backgroundColor: colors.indigoBg }]}
                    >
                      {w.isEnd ? (
                        <View style={{ height: lineHeight, justifyContent: 'center' }}>
                          <AyahNumberMark number={w.ayah} fontSize={fontSize} />
                        </View>
                      ) : (
                        <Text style={{ fontSize, lineHeight, color: colors.ink }}>{w.text}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        </View>
      )}
      <Text style={[styles.pageNum, { color: colors.textMuted }]}>{page}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { borderWidth: 1.5, borderRadius: RADII.sm, paddingHorizontal: PAPER_PAD, paddingTop: 12, paddingBottom: 8 },
  placeholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  note: { fontSize: 14, textAlign: 'center' },
  line: { flexDirection: 'row-reverse', flexWrap: 'nowrap', alignItems: 'center', columnGap: 2 },
  lineMeasure: { alignSelf: 'flex-end' }, // shrink to the words' width
  word: { borderRadius: 4, paddingHorizontal: 1 },
  headerWrap: { alignItems: 'center', marginVertical: 6, gap: 2 },
  surahHeader: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: RADII.sm,
    alignItems: 'center',
    paddingVertical: 4,
  },
  surahArabic: { fontSize: 22, lineHeight: 42 },
  surahLatin: { fontSize: 11, fontWeight: '700', marginTop: -6, marginBottom: 2 },
  bismillah: { textAlign: 'center' },
  pageNum: { textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 6, fontVariant: ['tabular-nums'] },
});
