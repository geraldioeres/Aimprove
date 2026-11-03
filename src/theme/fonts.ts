import { Platform, Text, TextInput, StyleSheet } from 'react-native';
import {
  useFonts,
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
  NotoSans_800ExtraBold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSansJP_400Regular,
  NotoSansJP_600SemiBold,
  NotoSansJP_700Bold,
  NotoSansJP_800ExtraBold,
} from '@expo-google-fonts/noto-sans-jp';

type Tier = '400' | '600' | '700' | '800';

const LATIN: Record<Tier, string> = {
  '400': 'NotoSans_400Regular',
  '600': 'NotoSans_600SemiBold',
  '700': 'NotoSans_700Bold',
  '800': 'NotoSans_800ExtraBold',
};

const JAPANESE: Record<Tier, string> = {
  '400': 'NotoSansJP_400Regular',
  '600': 'NotoSansJP_600SemiBold',
  '700': 'NotoSansJP_700Bold',
  '800': 'NotoSansJP_800ExtraBold',
};

const JP_CHARS = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/;

function tierFor(weight: unknown): Tier {
  const w = weight === 'bold' ? 700 : parseInt(String(weight ?? '400'), 10) || 400;
  if (w >= 800) return '800';
  if (w >= 700) return '700';
  if (w >= 500) return '600';
  return '400';
}

function textOf(children: unknown): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  return '';
}

/**
 * Latin text uses Noto Sans, Japanese glyphs use Noto Sans JP.
 * Web gets a per-glyph font stack; native picks the Japanese family
 * when the string contains kana or kanji.
 */
function resolveFamily(style: any, children: unknown): string {
  const tier = tierFor(StyleSheet.flatten(style)?.fontWeight);
  if (Platform.OS === 'web') return `${LATIN[tier]}, ${JAPANESE[tier]}, sans-serif`;
  return JP_CHARS.test(textOf(children)) ? JAPANESE[tier] : LATIN[tier];
}

let patched = false;

function patch(Component: any) {
  const original = Component.render;
  if (!original) return;
  Component.render = function render(this: unknown, props: any, ref: any) {
    const flat = StyleSheet.flatten(props.style) || {};
    const next = flat.fontFamily
      ? props
      : {
          ...props,
          style: [
            props.style,
            { fontFamily: resolveFamily(props.style, props.children), fontWeight: 'normal' },
          ],
        };
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
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSans_800ExtraBold,
    NotoSansJP_400Regular,
    NotoSansJP_600SemiBold,
    NotoSansJP_700Bold,
    NotoSansJP_800ExtraBold,
  });
  return loaded || Boolean(error);
}

export const FONT_LATIN = LATIN;
export const FONT_JAPANESE = JAPANESE;
export type { Tier };
