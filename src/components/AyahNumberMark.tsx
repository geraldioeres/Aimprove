import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (n: number | string) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

// The classic mushaf ornament, drawn on a 40×40 grid: a scalloped ring of
// petals around a thin inner circle, in mushaf blue.
const BLUE = '#2E6DB4';
const BLUE_TEXT = '#1F4E8C';
const FILL = '#F1F6FC';
const PETALS = 16;
const C = 20;

// One wavy outline: a small arc bulging out between each pair of petal points.
const SCALLOP = (() => {
  const rIn = 15.2; // where the scallops meet
  const bulge = 2.4; // how far each scallop curves out
  let d = '';
  for (let i = 0; i <= PETALS; i++) {
    const a = (i / PETALS) * Math.PI * 2 - Math.PI / 2;
    const x = C + rIn * Math.cos(a);
    const y = C + rIn * Math.sin(a);
    if (i === 0) {
      d += `M${x.toFixed(2)} ${y.toFixed(2)}`;
    } else {
      const mid = ((i - 0.5) / PETALS) * Math.PI * 2 - Math.PI / 2;
      const cx = C + (rIn + bulge * 2) * Math.cos(mid);
      const cy = C + (rIn + bulge * 2) * Math.sin(mid);
      d += ` Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  return `${d} Z`;
})();

/**
 * The end-of-ayah ornament, as printed in a mushaf: a blue scalloped rosette
 * with the ayah number inside, sized to sit with text of `fontSize`.
 */
export function AyahNumberMark({ number, fontSize = 22 }: { number: number; fontSize?: number }) {
  const digits = String(number).length;
  const size = Math.round(fontSize * (digits >= 3 ? 1.6 : 1.45));
  const textSize = Math.round(size * (digits >= 3 ? 0.29 : digits === 2 ? 0.37 : 0.44));
  return (
    <View accessible accessibilityLabel={`Ayah ${number}`} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Path d={SCALLOP} fill={FILL} stroke={BLUE} strokeWidth={1.3} strokeLinejoin="round" />
        <Circle cx={C} cy={C} r={12.2} fill="none" stroke={BLUE} strokeWidth={0.9} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text
          style={[styles.num, { fontSize: textSize, lineHeight: Math.round(textSize * 1.2), color: BLUE_TEXT }]}
          numberOfLines={1}
        >
          {toArabicDigits(number)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  num: { fontWeight: '700', textAlign: 'center', includeFontPadding: false } as any,
});
