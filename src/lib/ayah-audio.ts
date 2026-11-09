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
}

const pad = (n: number) => String(n).padStart(3, '0');
const file = (s: number, a: number) => `${pad(s)}${pad(a)}.mp3`;

export const RECITERS: Reciter[] = [
  {
    id: 'husary-muallim',
    name: 'Al-Husary (Muallim)',
    note: 'Slow teaching recitation, made for repeating after',
    url: (s, a) => `https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/${file(s, a)}`,
  },
  {
    id: 'husary',
    name: 'Al-Husary',
    note: 'Clear, steady murattal',
    url: (s, a) => `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/${file(s, a)}`,
  },
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    note: 'Popular murattal',
    url: (s, a) => `https://verses.quran.com/Alafasy/mp3/${file(s, a)}`,
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
  },
];

export const REPEAT_OPTIONS = [1, 3, 5] as const;

export interface AudioPrefs {
  reciter: string;
  repeat: (typeof REPEAT_OPTIONS)[number];
  echo: boolean; // pause after each play so the reader can repeat it
}

const PREFS_KEY = 'aimprove.ayahAudio.v1';
const DEFAULT_PREFS: AudioPrefs = { reciter: 'husary-muallim', repeat: 1, echo: false };

export type PlayerPhase = 'idle' | 'loading' | 'playing' | 'echo';

export interface PlayerState {
  ayah: number | null; // current ayah number in the surah
  phase: PlayerPhase;
  rep: number; // 1-based play count for the current ayah
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
  const [state, setState] = useState<PlayerState>({ ayah: null, phase: 'idle', rep: 1, error: null });
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const runId = useRef(0); // bumping it cancels the running sequence
  const sound = useRef<Audio.Sound | null>(null);
  const wake = useRef<(() => void) | null>(null); // ends the current wait early

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => raw && setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }))
      .catch(() => {});
  }, []);

  const updatePrefs = useCallback((patch: Partial<AudioPrefs>) => {
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
  const playOnce = (uri: string, id: number) =>
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
        const { sound: s } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, (st: AVPlaybackStatus) => {
          if (!st.isLoaded) {
            if (st.error) reject(new Error(st.error));
            return;
          }
          if (st.didJustFinish) finish(st.durationMillis ?? st.positionMillis ?? 0);
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

  /** Play from `ayah`, repeating each as set, then on through the surah. */
  const playFrom = useCallback(
    async (ayah: number) => {
      cancel();
      const id = runId.current;
      ensureAudioMode();
      stopWord();
      for (let a = ayah; a <= ayahCount; a++) {
        const { reciter, repeat, echo } = prefsRef.current;
        const r = RECITERS.find((x) => x.id === reciter) || RECITERS[0];
        for (let rep = 1; rep <= repeat; rep++) {
          if (id !== runId.current) return;
          setState({ ayah: a, phase: 'loading', rep, error: null });
          let length: number | null;
          try {
            const p = playOnce(r.url(surah, a), id);
            setState((st) => (id === runId.current ? { ...st, phase: 'playing' } : st));
            length = await p;
          } catch {
            if (id !== runId.current) return;
            setState({ ayah: a, phase: 'idle', rep, error: "Couldn't play the audio. Check your connection." });
            return;
          }
          await unload();
          if (length === null || id !== runId.current) return;
          if (echo) {
            setState((st) => ({ ...st, phase: 'echo' }));
            // Same length as the ayah, plus a breath.
            await wait(length + 600);
            if (id !== runId.current) return;
          }
        }
      }
      if (id === runId.current) setState({ ayah: null, phase: 'idle', rep: 1, error: null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surah, ayahCount, cancel]
  );

  /** Stop; the current ayah stays selected so play resumes there. */
  const pause = useCallback(() => {
    cancel();
    setState((st) => ({ ...st, phase: 'idle' }));
  }, [cancel]);

  const stop = useCallback(() => {
    cancel();
    setState({ ayah: null, phase: 'idle', rep: 1, error: null });
  }, [cancel]);

  // A new surah or leaving the screen stops playback.
  useEffect(() => {
    stop();
    return () => cancel();
  }, [surah, stop, cancel]);

  // Let a tapped word pause the recitation.
  useEffect(() => {
    pauseAyahPlayer = pause;
    return () => {
      if (pauseAyahPlayer === pause) pauseAyahPlayer = null;
    };
  }, [pause]);

  return { state, prefs, updatePrefs, playFrom, pause, stop };
}
