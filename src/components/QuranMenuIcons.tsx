import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

/**
 * Duotone ink icons for the Quran menu: thick ink outlines with two or three
 * flat fills, in the same stamp-card style as the rest of the app. Drawn on
 * a 56×56 grid.
 */

export type QuranMenuIconName =
  | 'mushaf'
  | 'words'
  | 'read'
  | 'prayer'
  | 'makhraj'
  | 'tajweed'
  | 'letters'
  | 'numbers'
  | 'islam';

const INK = '#16161A';
const W = 2.5; // outline weight
const line = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const C = {
  green: '#1B7F45',
  greenLight: '#BFE3CC',
  gold: '#F2C230',
  goldLight: '#FDF3D3',
  amber: '#AD5E00',
  amberLight: '#FAEBD8',
  purple: '#7B3FD6',
  purpleLight: '#D9C8F7',
  indigo: '#25348C',
  indigoLight: '#C9CFEE',
  red: '#E5402A',
  redLight: '#FCE7E3',
  blue: '#1A6FD1',
  greyLight: '#E4E2DC',
  grey: '#8A8991',
  white: '#FFFFFF',
};

function Mushaf() {
  return (
    <>
      {/* rehal (stand) */}
      <Path d="M9 42 L47 42 L42 50 L14 50 Z" fill={C.gold} {...line} />
      {/* pages */}
      <Path d="M28 15 C22 11 14 10 8 12 L8 38 C14 36 22 37 28 41 Z" fill={C.greenLight} {...line} />
      <Path d="M28 15 C34 11 42 10 48 12 L48 38 C42 36 34 37 28 41 Z" fill={C.green} {...line} />
      <Path d="M13 19 L23 20 M13 24 L23 25 M13 29 L21 30" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M33 20 L43 19 M33 25 L43 24 M35 30 L43 29" stroke={C.white} strokeWidth={1.6} strokeLinecap="round" />
    </>
  );
}

function Words() {
  return (
    <>
      <G rotation={12} origin="32, 24">
        <Rect x={19} y={8} width={26} height={33} rx={3} fill={C.purpleLight} {...line} />
      </G>
      <G rotation={-8} origin="23, 31">
        <Rect x={10} y={14} width={26} height={33} rx={3} fill={C.purple} {...line} />
        <Path d="M15 28 C18 24 22 32 26 28 C28 26 30 27 31 29" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </G>
      <Circle cx={36} cy={44} r={5.5} fill={C.gold} {...line} />
    </>
  );
}

function Read() {
  return (
    <>
      <Path d="M28 25 C23 22 16 21 9 23 L9 46 C16 44 23 45 28 48 Z" fill={C.indigoLight} {...line} />
      <Path d="M28 25 C33 22 40 21 47 23 L47 46 C40 44 33 45 28 48 Z" fill={C.indigo} {...line} />
      {/* play */}
      <Circle cx={28} cy={13} r={9} fill={C.gold} {...line} />
      <Path d="M25.5 8.8 L33 13 L25.5 17.2 Z" fill={INK} />
    </>
  );
}

function Prayer() {
  return (
    <>
      {/* minaret */}
      <Path d="M44 49 L44 22 L47 17 L50 22 L50 49" fill={C.amberLight} {...line} />
      {/* hall and dome */}
      <Rect x={7} y={33} width={34} height={16} fill={C.amberLight} {...line} />
      <Path d="M10 33 C10 22 18 17 24 15 C30 17 38 22 38 33 Z" fill={C.amber} {...line} />
      <Line x1={24} y1={15} x2={24} y2={10} {...line} />
      {/* crescent */}
      <Path d="M26 3.5 A4.2 4.2 0 1 0 26 11.5 A3.3 3.3 0 1 1 26 3.5 Z" fill={C.gold} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      {/* door */}
      <Path d="M20 49 L20 42 C20 38.5 28 38.5 28 42 L28 49 Z" fill={INK} />
    </>
  );
}

function Makhraj() {
  return (
    <>
      <Path
        d="M15 49 L15 40 C8 35 7 22 13 15 C19 8 32 8 36 17 L38 23 L42 28 L38 30 L38 35 C38 38 35 39 32 39 L28 39 L28 49 Z"
        fill={C.redLight}
        {...line}
      />
      <Path d="M33 32.5 L38 32.5" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Path d="M45 23 C48 27 48 33 45 37" stroke={C.red} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M50 18 C55 25 55 35 50 42" stroke={C.red} strokeWidth={3} strokeLinecap="round" fill="none" />
    </>
  );
}

function Tajweed() {
  // A page of text with colour-coded stretches, as tajweed-coloured mushafs read.
  const seg = (x1: number, x2: number, y: number, color: string) => (
    <Line key={`${x1}-${y}`} x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" />
  );
  return (
    <>
      <Rect x={6} y={7} width={44} height={42} rx={4} fill={C.white} {...line} />
      {seg(13, 22, 18, INK)}
      {seg(27, 35, 18, C.red)}
      {seg(40, 43, 18, INK)}
      {seg(13, 19, 28, C.blue)}
      {seg(24, 43, 28, INK)}
      {seg(13, 30, 38, INK)}
      {seg(35, 43, 38, C.green)}
      <Circle cx={31} cy={12.5} r={1.8} fill={C.red} />
      <Circle cx={16} cy={33} r={1.8} fill={INK} />
    </>
  );
}

function Letters({ muted }: { muted: boolean }) {
  const tile = muted ? C.greyLight : C.goldLight;
  const ink = muted ? C.grey : INK;
  return (
    <>
      <Rect x={5} y={12} width={21} height={32} rx={3} fill={tile} {...line} stroke={ink} />
      <Rect x={30} y={12} width={21} height={32} rx={3} fill={tile} {...line} stroke={ink} />
      {/* ب */}
      <Path d="M9 25 C9 34 22 34 22 25" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Circle cx={15.5} cy={38} r={2.3} fill={muted ? C.grey : C.red} />
      {/* ا */}
      <Line x1={40.5} y1={18} x2={40.5} y2={38} stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
    </>
  );
}

function Numbers() {
  return (
    <>
      {/* abacus */}
      <Rect x={7} y={9} width={42} height={38} rx={3} fill={C.goldLight} {...line} />
      {[19, 28, 37].map((y) => (
        <Line key={y} x1={7} y1={y} x2={49} y2={y} stroke={INK} strokeWidth={1.6} />
      ))}
      <Circle cx={15} cy={19} r={4} fill={C.indigo} stroke={INK} strokeWidth={1.8} />
      <Circle cx={24} cy={19} r={4} fill={C.indigo} stroke={INK} strokeWidth={1.8} />
      <Circle cx={15} cy={28} r={4} fill={C.red} stroke={INK} strokeWidth={1.8} />
      <Circle cx={15} cy={37} r={4} fill={C.gold} stroke={INK} strokeWidth={1.8} />
      <Circle cx={24} cy={37} r={4} fill={C.gold} stroke={INK} strokeWidth={1.8} />
      <Circle cx={33} cy={37} r={4} fill={C.gold} stroke={INK} strokeWidth={1.8} />
      <Path d="M12 47 L10 52 M44 47 L46 52" {...line} />
    </>
  );
}

function Islam() {
  // A Ramadan lantern (fanous) with a small flame.
  return (
    <>
      <Circle cx={28} cy={6} r={3} fill="none" {...line} />
      <Path d="M20 16 L28 9 L36 16 Z" fill={C.green} {...line} />
      <Path d="M18 16 L38 16 L38 21 L18 21 Z" fill={C.green} {...line} />
      <Path d="M18 21 L38 21 L41 31 L38 42 L18 42 L15 31 Z" fill={C.gold} {...line} />
      <Path d="M24 25 L32 25 L34 31 L32 38 L24 38 L22 31 Z" fill={C.goldLight} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M28 27.5 C31 30.5 30.5 34.5 28 35.5 C25.5 34.5 25 30.5 28 27.5 Z" fill={C.red} />
      <Path d="M20 42 L36 42 L36 46 L20 46 Z" fill={C.green} {...line} />
      <Path d="M24 46 L32 46 L28 51 Z" fill={C.green} {...line} />
    </>
  );
}

export function QuranMenuIcon({
  name,
  size = 56,
  muted = false,
}: {
  name: QuranMenuIconName;
  size?: number;
  muted?: boolean; // greyed out (coming soon)
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'mushaf' ? <Mushaf /> : null}
      {name === 'words' ? <Words /> : null}
      {name === 'read' ? <Read /> : null}
      {name === 'prayer' ? <Prayer /> : null}
      {name === 'makhraj' ? <Makhraj /> : null}
      {name === 'tajweed' ? <Tajweed /> : null}
      {name === 'letters' ? <Letters muted={muted} /> : null}
      {name === 'numbers' ? <Numbers /> : null}
      {name === 'islam' ? <Islam /> : null}
    </Svg>
  );
}
