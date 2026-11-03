import { Platform, Text, TextInput, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { ZenKakuGothicNew_400Regular } from '@expo-google-fonts/zen-kaku-gothic-new/400Regular';
import { ZenKakuGothicNew_500Medium } from '@expo-google-fonts/zen-kaku-gothic-new/500Medium';
import { ZenKakuGothicNew_700Bold } from '@expo-google-fonts/zen-kaku-gothic-new/700Bold';
import { ZenKakuGothicNew_900Black } from '@expo-google-fonts/zen-kaku-gothic-new/900Black';

type Tier = '400' | '500' | '700' | '900';

// Zen Kaku Gothic New covers Latin, kana and kanji in one family,
// so the same face carries English labels and Japanese glyphs.
const FAMILY: Record<Tier, string> = {
  '400': 'ZenKakuGothicNew_400Regular',
  '500': 'ZenKakuGothicNew_500Medium',
  '700': 'ZenKakuGothicNew_700Bold',
  '900': 'ZenKakuGothicNew_900Black',
};

function tierFor(weight: unknown): Tier {
  const w = weight === 'bold' ? 700 : parseInt(String(weight ?? '400'), 10) || 400;
  if (w >= 900) return '900';
  if (w >= 700) return '700';
  if (w >= 500) return '500';
  return '400';
}

function resolveFamily(style: any): string {
  const tier = tierFor(StyleSheet.flatten(style)?.fontWeight);
  if (Platform.OS === 'web') return `${FAMILY[tier]}, sans-serif`;
  return FAMILY[tier];
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
          style: [props.style, { fontFamily: resolveFamily(props.style), fontWeight: 'normal' }],
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
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
    ZenKakuGothicNew_900Black,
  });
  return loaded || Boolean(error);
}

export const FONT = FAMILY;
// Older imports
export const FONT_LATIN = FAMILY;
export const FONT_JAPANESE = FAMILY;
export type { Tier };
