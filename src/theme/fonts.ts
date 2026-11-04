import { Platform, Text, TextInput, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { ZenKakuGothicNew_400Regular } from '@expo-google-fonts/zen-kaku-gothic-new/400Regular';
import { ZenKakuGothicNew_500Medium } from '@expo-google-fonts/zen-kaku-gothic-new/500Medium';
import { ZenKakuGothicNew_700Bold } from '@expo-google-fonts/zen-kaku-gothic-new/700Bold';
import { ZenKakuGothicNew_900Black } from '@expo-google-fonts/zen-kaku-gothic-new/900Black';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new/400Regular';
import { ScheherazadeNew_700Bold } from '@expo-google-fonts/scheherazade-new/700Bold';

type Tier = '400' | '500' | '700' | '900';

// Zen Kaku Gothic New covers Latin, kana and kanji in one family,
// so the same face carries English labels and Japanese glyphs.
const FAMILY: Record<Tier, string> = {
  '400': 'ZenKakuGothicNew_400Regular',
  '500': 'ZenKakuGothicNew_500Medium',
  '700': 'ZenKakuGothicNew_700Bold',
  '900': 'ZenKakuGothicNew_900Black',
};

// Arabic (Quran text, letters, numerals) uses Scheherazade New: a Naskh face
// built for legibility, with full Quranic marks and generous vowel spacing.
const ARABIC = {
  regular: 'ScheherazadeNew_400Regular',
  bold: 'ScheherazadeNew_700Bold',
};

const ARABIC_CHARS = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/;

const ARABIC_LETTERS = new RegExp(ARABIC_CHARS.source, 'g');

function textOf(children: unknown): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return '';
  if (Array.isArray(children)) return children.map(textOf).join('');
  return '';
}

function tierFor(weight: unknown): Tier {
  const w = weight === 'bold' ? 700 : parseInt(String(weight ?? '400'), 10) || 400;
  if (w >= 900) return '900';
  if (w >= 700) return '700';
  if (w >= 500) return '500';
  return '400';
}

/** Share of letters in `text` that are Arabic (0..1). */
function arabicShare(text: string): number {
  const arabic = (text.match(ARABIC_LETTERS) || []).length;
  if (!arabic) return 0;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return arabic / (arabic + latin);
}

function resolveFamily(style: any, share: number): string {
  const tier = tierFor(StyleSheet.flatten(style)?.fontWeight);
  const arabicFace = tier === '700' || tier === '900' ? ARABIC.bold : ARABIC.regular;
  // Web picks a font per glyph: Zen Kaku has no Arabic letters, so English
  // stays in Zen Kaku and Arabic falls through to Scheherazade.
  if (Platform.OS === 'web') return `${FAMILY[tier]}, ${arabicFace}, sans-serif`;
  // Native uses one font per text run: Scheherazade when it's mostly Arabic.
  return share >= 0.5 ? arabicFace : FAMILY[tier];
}

let patched = false;

function patch(Component: any) {
  const original = Component.render;
  if (!original) return;
  Component.render = function render(this: unknown, props: any, ref: any) {
    const flat = StyleSheet.flatten(props.style) || {};
    if (flat.fontFamily) return original.call(this, props, ref);
    const text = textOf(props.children) || String(props.value ?? props.placeholder ?? '');
    const arabic = ARABIC_CHARS.test(text);
    const extra: any = { fontFamily: resolveFamily(props.style, arabic ? arabicShare(text) : 0), fontWeight: 'normal' };
    // Scheherazade's stacked vowel marks need room: never let a tight
    // line height clip them.
    if (arabic && flat.fontSize && flat.lineHeight && flat.lineHeight < flat.fontSize * 1.8) {
      extra.lineHeight = Math.round(flat.fontSize * 1.8);
    }
    const next = { ...props, style: [props.style, extra] };
    return original.call(this, next, ref);
  };
}

export function applyGlobalFonts() {
  if (patched) return;
  patched = true;
  patch(Text);
  patch(TextInput);
}

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
    ZenKakuGothicNew_900Black,
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  });
  return loaded || Boolean(error);
}

export const FONT = FAMILY;
// Older imports
export const FONT_LATIN = FAMILY;
export const FONT_JAPANESE = FAMILY;
export const FONT_ARABIC = ARABIC;
export type { Tier };
