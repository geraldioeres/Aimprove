import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { LIGHT_PALETTE } from '../theme/tokens';
import { FONT } from '../theme/fonts';

const LABEL_FONT = Platform.OS === 'web' ? `${FONT['700']}, sans-serif` : FONT['700'];

/**
 * Our own side view of the head (facing left), drawn for the Makhraj screen.
 * Each makhraj id maps to a point on the drawing; 1 (al-Jawf) and 17
 * (al-Khayshum) are areas, so they also light up a region.
 */
export const MAKHRAJ_POINTS: Record<number, { x: number; y: number }> = {
  1: { x: 150, y: 140 },
  2: { x: 207, y: 246 },
  3: { x: 208, y: 206 },
  4: { x: 207, y: 166 },
  5: { x: 194, y: 136 },
  6: { x: 181, y: 128 },
  7: { x: 150, y: 123 },
  8: { x: 164, y: 135 },
  9: { x: 115, y: 126 },
  10: { x: 99, y: 131 },
  11: { x: 106, y: 128 },
  12: { x: 92, y: 138 },
  13: { x: 85, y: 148 },
  14: { x: 92, y: 157 },
  15: { x: 77, y: 153 },
  16: { x: 68, y: 150 },
  17: { x: 140, y: 106 },
};

const C = {
  ink: LIGHT_PALETTE.ink,
  muted: LIGHT_PALETTE.textMuted,
  rule: LIGHT_PALETTE.border,
  desk: LIGHT_PALETTE.bgPrimary,
  card: LIGHT_PALETTE.bgSurface,
  active: LIGHT_PALETTE.indigo,
  activeBg: LIGHT_PALETTE.indigoBg,
  tongue: '#F7D4DA',
  lip: '#EFB9B9',
};

// Face profile, forehead to neck.
const FACE =
  'M150,40 C110,40 92,60 90,86 L72,112 Q66,120 76,124 L80,128 Q74,134 70,142 ' +
  'Q67,148 76,150 Q67,153 70,160 Q72,168 82,172 Q77,185 84,198 Q92,212 120,214 L170,222 L174,300';
const BACK = 'M150,40 C230,30 286,80 286,150 C286,200 262,232 252,300';
const NASAL =
  'M80,124 Q86,102 118,97 Q168,92 206,104 L210,126 Q192,118 176,120 Q140,116 108,122 Q94,125 80,126 Z';
const PALATE = 'M90,136 Q95,127 108,124 Q140,118 176,121 Q192,124 199,135 Q203,145 198,151';
const THROAT_BACK = 'M210,126 Q218,150 216,190 L218,300';
const TONGUE =
  'M96,152 Q100,136 125,132 Q165,126 188,140 Q202,152 202,176 Q202,196 196,208 ' +
  'Q170,212 140,196 Q110,180 100,166 Q94,160 96,152 Z';
const EPIGLOTTIS = 'M196,208 Q206,198 207,214';
const LARYNX_FRONT = 'M196,214 L194,300';
const UPPER_TOOTH = 'M86,135 L80,150 L86,151 L91,137 Z';
const LOWER_TOOTH = 'M84,153 L87,168 L93,166 L89,153 Z';
const UPPER_LIP = 'M80,128 Q74,134 70,142 Q67,148 76,150 L82,149 Q84,138 86,134 Z';
const LOWER_LIP = 'M76,151 Q67,153 70,160 Q72,168 82,172 L86,168 Q84,158 82,152 Z';
const JAWF = 'M207,262 L208,170 Q204,142 170,134 Q130,132 96,146';

export function MakhrajDiagram({
  activeMakhraj,
  onPressMakhraj,
  width = '100%',
}: {
  activeMakhraj: number | null;
  onPressMakhraj?: (id: number) => void;
  width?: number | string;
}) {
  const jawfOn = activeMakhraj === 1;
  const noseOn = activeMakhraj === 17;

  return (
    <Svg
      width={width}
      viewBox="36 76 250 204"
      style={{ aspectRatio: 250 / 204 }}
      accessibilityRole="image"
      accessibilityLabel="Side view of the head showing the throat, tongue, teeth, lips and nose"
    >
      {/* Head */}
      <Path d={`${FACE} L252,300 Z`} fill={C.card} />
      <Path d={BACK} fill="none" stroke={C.ink} strokeWidth={2} />
      <Path d={FACE} fill="none" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />

      {/* Nose */}
      <Path
        d={NASAL}
        fill={noseOn ? C.activeBg : C.desk}
        stroke={noseOn ? C.active : C.rule}
        strokeWidth={noseOn ? 2 : 1.2}
      />

      {/* Throat */}
      <Path d="M196,214 L194,300 L218,300 L216,190 Q218,150 210,126 L199,135 Q203,145 198,151 Q202,170 196,208 Z" fill={C.desk} />
      <Path d={THROAT_BACK} fill="none" stroke={C.ink} strokeWidth={1.5} />
      <Path d={LARYNX_FRONT} fill="none" stroke={C.ink} strokeWidth={1.5} />
      <Path d="M196,252 L208,250 M216,252 L209,250" stroke={C.ink} strokeWidth={1.5} />

      {/* Mouth */}
      <Path d={TONGUE} fill={C.tongue} stroke={C.ink} strokeWidth={1.5} />
      <Path d={EPIGLOTTIS} fill="none" stroke={C.ink} strokeWidth={1.5} />
      <Path d={PALATE} fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={UPPER_LIP} fill={C.lip} stroke={C.ink} strokeWidth={1.2} />
      <Path d={LOWER_LIP} fill={C.lip} stroke={C.ink} strokeWidth={1.2} />
      <Path d={UPPER_TOOTH} fill={C.card} stroke={C.ink} strokeWidth={1.2} />
      <Path d={LOWER_TOOTH} fill={C.card} stroke={C.ink} strokeWidth={1.2} />

      {/* Al-Jawf: the open path of the long vowels */}
      <Path
        d={JAWF}
        fill="none"
        stroke={jawfOn ? C.active : C.muted}
        strokeWidth={jawfOn ? 4 : 1}
        strokeDasharray={jawfOn ? undefined : '3 3'}
        strokeLinecap="round"
        opacity={jawfOn ? 0.55 : 0.6}
      />

      {/* Labels */}
      <G>
        <Label x={112} y={112}>nose</Label>
        <Label x={146} y={170}>tongue</Label>
        <Label x={176} y={88}>roof of mouth</Label>
        <Path d="M176,91 L176,119" stroke={C.muted} strokeWidth={0.8} strokeDasharray="2 2" />
        <Label x={230} y={196} anchor="start">throat</Label>
        <Label x={230} y={251} anchor="start">voice</Label>
        <Label x={230} y={260} anchor="start">box</Label>
        <Label x={56} y={146} anchor="end">lips</Label>
        <Label x={56} y={172} anchor="end">teeth</Label>
        <Path d="M220,193 L227,193 M220,253 L227,253" stroke={C.muted} strokeWidth={0.8} />
        <Path d="M58,168 L84,162" stroke={C.muted} strokeWidth={0.8} />
      </G>

      {/* Points */}
      {Object.entries(MAKHRAJ_POINTS).map(([key, p]) => {
        const id = Number(key);
        if (id === activeMakhraj) return null;
        return (
          <Circle
            key={id}
            cx={p.x}
            cy={p.y}
            r={2.8}
            fill={C.card}
            stroke={C.ink}
            strokeWidth={1.2}
            onPress={onPressMakhraj ? () => onPressMakhraj(id) : undefined}
          />
        );
      })}
      {activeMakhraj != null && MAKHRAJ_POINTS[activeMakhraj] ? (
        <G>
          <Circle
            cx={MAKHRAJ_POINTS[activeMakhraj].x}
            cy={MAKHRAJ_POINTS[activeMakhraj].y}
            r={10}
            fill={C.active}
            opacity={0.18}
          />
          <Circle
            cx={MAKHRAJ_POINTS[activeMakhraj].x}
            cy={MAKHRAJ_POINTS[activeMakhraj].y}
            r={5}
            fill={C.active}
            stroke={C.card}
            strokeWidth={1.5}
          />
        </G>
      ) : null}
    </Svg>
  );
}

function Label({
  x,
  y,
  anchor = 'middle',
  children,
}: {
  x: number;
  y: number;
  anchor?: 'start' | 'middle' | 'end';
  children: string;
}) {
  return (
    <SvgText x={x} y={y} fontSize={8.5} fontFamily={LABEL_FONT} fill={C.muted} textAnchor={anchor}>
      {children}
    </SvgText>
  );
}
