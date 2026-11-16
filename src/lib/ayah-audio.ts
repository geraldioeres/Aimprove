import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Per-ayah recitation for the reader: play an ayah (or run on through the
 * surah), repeat each one, and optionally leave a silent gap after each play
 * as long as the ayah itself, so the reader can repeat it (listen and echo).
 *
 * Audio comes from the everyayah / Quran.com mirrors, one MP3 per ayah.
 */

export interface Reciter {
  id: string;
  name: string;
  note: string;
  url: (surah: number, ayah: number) => string;
  // Quran.com recitation with word timings for these same files, if any.
  timingsId?: number;
}

const pad = (n: number) => String(n).padStart(3, '0');
const file = (s: number, a: number) => `${pad(s)}${pad(a)}.mp3`;

export const RECITERS: Reciter[] = [
  {
    id: 'husary-muallim',
    name: 'Al-Husary (Muallim)',
    note: 'Slow teaching recitation, made for repeating after',
    url: (s, a) => `https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/${file(s, a)}`,
    timingsId: 12,
  },
  {
    id: 'husary',
    name: 'Al-Husary',
    note: 'Clear, steady murattal',
    url: (s, a) => `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/${file(s, a)}`,
    timingsId: 6,
  },
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    note: 'Popular murattal',
    url: (s, a) => `https://verses.quran.com/Alafasy/mp3/${file(s, a)}`,
    timingsId: 7,
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    note: 'Calm, measured murattal',
    url: (s, a) => `https://mirrors.quranicaudio.com/everyayah/Ghamadi_40kbps/${file(s, a)}`,
  },
  {
    id: 'minshawi',
    name: 'Al-Minshawi (Murattal)',
    note: 'Classic murattal',
    url: (s, a) => `https://verses.quran.com/Minshawi/Murattal/mp3/${file(s, a)}`,
    timingsId: 9,
  },
];

export const REPEAT_OPTIONS = [1, 3, 5] as const;

// ---------------------------------------------------------------------------
// Word timings: when each word starts and ends in a reciter's ayah file, from
// Quran.com (the same files we play). Kept on the device once loaded.

/** [word position (1-based), start ms, end ms] */
export type WordTiming = [number, number, number];
const timingMemory = new Map<string, WordTiming[] | null>();

export async function loadWordTimings(timingsId: number, surah: number, ayah: number): Promise<WordTiming[] | null> {
  const key = `aimprove.timings.v1.${timingsId}.${surah}:${ayah}`;
  if (timingMemory.has(key)) return timingMemory.get(key)!;
  let timings: WordTiming[] | null = null;
  try {
    const hit = await AsyncStorage.getItem(key);
    if (hit) timings = JSON.parse(hit);
  } catch {
    // fall through to the network
  }
  if (!timings) {
    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?audio=${timingsId}&words=false`
      );
      if (!res.ok) return null;
      const segments: number[][] = (await res.json()).verse?.audio?.segments ?? [];
      // Each segment is [first word index, end word index, start ms, end ms];
      // the word is the end index (1-based).
      timings = segments
        .filter((g) => g.length >= 4)
        .map((g) => [g[1], g[2], g[3]] as WordTiming);
      if (timings.length) AsyncStorage.setItem(key, JSON.stringify(timings)).catch(() => {});
    } catch {
      return null; // offline: no word highlight this time
    }
  }
  timingMemory.set(key, timings && timings.length ? timings : null);
  return timingMemory.get(key)!;
}

/** The word being recited at `ms`: the last one that has started. */
function wordAt(timings: WordTiming[], ms: number): number | null {
  let word: number | null = null;
  for (const [w, start] of timings) {
    if (start <= ms) word = w;
    else break;
  }
  return word;
}

export interface AudioPrefs {
  reciter: string;
  repeat: (typeof REPEAT_OPTIONS)[number];
  echo: boolean; // pause after each play so the reader can repeat it
}

const PREFS_KEY = 'aimprove.ayahAudio.v1';
const DEFAULT_PREFS: AudioPrefs = { reciter: 'husary-muallim', repeat: 1, echo: false };
/** Listen-and-repeat setup used by the Read screen's practice mode. */
export const PRACTICE_PREFS: AudioPrefs = { reciter: 'husary-muallim', repeat: 3, echo: true };
/** Where the reader was last ({ surah, ayah }), for "Continue". */
export const LAST_READ_KEY = 'aimprove.reader.last.v1';

export type PlayerPhase = 'idle' | 'loading' | 'playing' | 'echo';

export interface PlayerState {
  surah: number | null; // surah of the current ayah
  ayah: number | null; // current ayah number in that surah
  phase: PlayerPhase;
  rep: number; // 1-based play count for the current ayah
  word: number | null; // word being recited (1-based), when the reciter has word timings
  error: string | null;
}

let audioModeSet = false;
const ensureAudioMode = () => {
  if (audioModeSet) return;
  audioModeSet = true;
  Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
};

// The reader's ayah player registers its pause here, so a word tap can stop it.
let pauseAyahPlayer: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Single words: Quran.com's word-by-word recordings, one file per word.

let wordSound: Audio.Sound | null = null;
let wordPlaying: string | null = null; // "78:20:1"
const wordListeners = new Set<(id: string | null) => void>();
const setWordPlaying = (id: string | null) => {
  wordPlaying = id;
  wordListeners.forEach((l) => l(id));
};

const wordUrl = (surah: number, ayah: number, word: number) =>
  `https://audio.qurancdn.com/wbw/${pad(surah)}_${pad(ayah)}_${pad(word)}.mp3`;

/** Play one word of an ayah ("78:20", word 1 = first word). Stops any ayah recitation. */
export async function playWord(ayahKey: string, word: number) {
  const [s, a] = ayahKey.split(':').map(Number);
  const id = `${ayahKey}:${word}`;
  pauseAyahPlayer?.();
  ensureAudioMode();
  const previous = wordSound;
  wordSound = null;
  previous?.unloadAsync().catch(() => {});
  setWordPlaying(id);
  try {
    const { sound } = await Audio.Sound.createAsync({ uri: wordUrl(s, a, word) }, { shouldPlay: true }, (st) => {
      if (st.isLoaded && st.didJustFinish) {
        if (wordPlaying === id) setWordPlaying(null);
        sound.unloadAsync().catch(() => {});
        if (wordSound === sound) wordSound = null;
      }
    });
    if (wordPlaying !== id) {
      sound.unloadAsync().catch(() => {}); // another word was tapped meanwhile
      return;
    }
    wordSound = sound;
  } catch {
    if (wordPlaying === id) setWordPlaying(null);
  }
}

/** The word now playing ("78:20:1"), for highlighting its tile. */
export function useWordPlaying(): string | null {
  const [id, setId] = useState<string | null>(wordPlaying);
  useEffect(() => {
    wordListeners.add(setId);
    return () => {
      wordListeners.delete(setId);
    };
  }, []);
  return id;
}

const stopWord = () => {
  const s = wordSound;
  wordSound = null;
  s?.unloadAsync().catch(() => {});
  if (wordPlaying) setWordPlaying(null);
};

export function useAyahPlayer(surah: number, ayahCount: number) {
  const [prefs, setPrefs] = useState<AudioPrefs>(DEFAULT_PREFS);
  const [state, setState] = useState<PlayerState>({ surah: null, ayah: null, phase: 'idle', rep: 1, word: null, error: null });
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const runId = useRef(0); // bumping it cancels the running sequence
  const sound = useRef<Audio.Sound | null>(null);
  const wake = useRef<(() => void) | null>(null); // ends the current wait early

  // A choice made before saved settings finish loading (e.g. practice mode) wins.
  const touched = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => raw && !touched.current && setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }))
      .catch(() => {});
  }, []);

  const updatePrefs = useCallback((patch: Partial<AudioPrefs>) => {
    touched.current = true;
    setPrefs((p) => {
      const next = { ...p, ...patch };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const unload = async () => {
    const s = sound.current;
    sound.current = null;
    if (s) {
      try {
        await s.unloadAsync();
      } catch {
        // already gone
      }
    }
  };

  const cancel = useCallback(() => {
    runId.current++;
    wake.current?.();
    void unload();
  }, []);

  // Plays one file to the end. Resolves with its length in ms, or null if cancelled.
  const playOnce = (uri: string, id: number, onPosition?: (ms: number) => void) =>
    new Promise<number | null>(async (resolve, reject) => {
      let done = false;
      const finish = (v: number | null) => {
        if (done) return;
        done = true;
        wake.current = null;
        resolve(v);
      };
      wake.current = () => finish(null);
      try {
        const status = { shouldPlay: true, progressUpdateIntervalMillis: onPosition ? 60 : 500 };
        const { sound: s } = await Audio.Sound.createAsync({ uri }, status, (st: AVPlaybackStatus) => {
          if (!st.isLoaded) {
            if (st.error) reject(new Error(st.error));
            return;
          }
          if (st.didJustFinish) finish(st.durationMillis ?? st.positionMillis ?? 0);
          else if (st.isPlaying) onPosition?.(st.positionMillis);
        });
        if (id !== runId.current) {
          await s.unloadAsync().catch(() => {});
          return finish(null);
        }
        sound.current = s;
      } catch (e) {
        if (!done) reject(e);
      }
    });

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        wake.current = null;
        resolve();
      }, ms);
      wake.current = () => {
        clearTimeout(t);
        wake.current = null;
        resolve();
      };
    });

  // A list that may carry on into another surah (a page), so a change of
  // surah on the screen doesn't stop it.
  const crossSurah = useRef(false);

  /**
   * Play a list of ayat in order, repeating each as set. Resolves true if
   * the whole list played, false if it was stopped or failed.
   */
  const playList = useCallback(
    async (items: { surah: number; ayah: number }[], opts?: { crossSurah?: boolean }) => {
      cancel();
      const id = runId.current;
      crossSurah.current = Boolean(opts?.crossSurah);
      ensureAudioMode();
      stopWord();
      for (let i = 0; i < items.length; i++) {
        const { surah: s, ayah: a } = items[i];
        const { reciter, repeat, echo } = prefsRef.current;
        const r = RECITERS.find((x) => x.id === reciter) || RECITERS[0];
        // Word timings for this ayah (and the next, ahead of time).
        let timings: WordTiming[] | null = null;
        if (r.timingsId) {
          loadWordTimings(r.timingsId, s, a).then((t) => (timings = t));
          const n = items[i + 1];
          if (n) loadWordTimings(r.timingsId, n.surah, n.ayah).catch(() => {});
        }
        let shown: number | null = null;
        const follow = (ms: number) => {
          if (!timings || id !== runId.current) return;
          const w = wordAt(timings, ms);
          if (w !== shown) {
            shown = w;
            setState((st) => (id === runId.current ? { ...st, word: w } : st));
          }
        };
        for (let rep = 1; rep <= repeat; rep++) {
          if (id !== runId.current) return false;
          shown = null;
          setState({ surah: s, ayah: a, phase: 'loading', rep, word: null, error: null });
          let length: number | null;
          try {
            const p = playOnce(r.url(s, a), id, r.timingsId ? follow : undefined);
            setState((st) => (id === runId.current ? { ...st, phase: 'playing' } : st));
            length = await p;
          } catch {
            if (id !== runId.current) return false;
            setState({ surah: s, ayah: a, phase: 'idle', rep, word: null, error: "Couldn't play the audio. Check your connection." });
            return false;
          }
          await unload();
          if (length === null || id !== runId.current) return false;
          if (echo) {
            setState((st) => ({ ...st, phase: 'echo', word: null }));
            // Same length as the ayah, plus a breath.
            await wait(length + 600);
            if (id !== runId.current) return false;
          }
        }
      }
      if (id !== runId.current) return false;
      crossSurah.current = false;
      setState({ surah: null, ayah: null, phase: 'idle', rep: 1, word: null, error: null });
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cancel]
  );

  /** Play from `ayah`, repeating each as set, then on through the surah. */
  const playFrom = useCallback(
    (ayah: number) =>
      playList(Array.from({ length: Math.max(0, ayahCount - ayah + 1) }, (_, i) => ({ surah, ayah: ayah + i }))),
    [surah, ayahCount, playList]
  );

  /** Stop; the current ayah stays selected so play resumes there. */
  const pause = useCallback(() => {
    cancel();
    setState((st) => ({ ...st, phase: 'idle', word: null }));
  }, [cancel]);

  const stop = useCallback(() => {
    cancel();
    crossSurah.current = false;
    setState({ surah: null, ayah: null, phase: 'idle', rep: 1, word: null, error: null });
  }, [cancel]);

  /** Select an ayah without playing, so the big play button starts there. */
  const cue = useCallback(
    (ayah: number) => {
      setState((st) => (st.phase === 'idle' ? { surah, ayah, phase: 'idle', rep: 1, word: null, error: null } : st));
    },
    [surah]
  );

  // A new surah stops playback, unless a page is playing across it.
  useEffect(() => {
    if (!crossSurah.current) stop();
  }, [surah, stop]);
  // Leaving the screen stops it.
  useEffect(() => () => cancel(), [cancel]);

  // Let a tapped word pause the recitation.
  useEffect(() => {
    pauseAyahPlayer = pause;
    return () => {
      if (pauseAyahPlayer === pause) pauseAyahPlayer = null;
    };
  }, [pause]);

  return { state, prefs, updatePrefs, playFrom, playList, pause, stop, cue };
}
