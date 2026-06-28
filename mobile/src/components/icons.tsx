import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

/** Line-art icons (no emoji), in the pro-trader terminal style. */

type IconProps = { color: string; size?: number };

export function IconPortfolio({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M3 13h4l2 5 4-12 2 7h6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMarket({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M4 19V9M9 19V5M14 19v-7M19 19v-11" strokeLinecap="round" />
    </Svg>
  );
}

export function IconGroups({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx={8} cy={9} r={3} />
      <Circle cx={16.5} cy={10} r={2.4} />
      <Path d="M3 19c0-3 2.5-4.5 5-4.5s5 1.5 5 4.5M14 19c0-2.2 1.5-3.6 3.4-3.6S21 16.8 21 19" strokeLinecap="round" />
    </Svg>
  );
}

export function IconTrophy({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path
        d="M7 4h10v3a5 5 0 01-10 0V4zM4 5h3M17 5h3M9 15h6M8 20h8M12 12v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconSearch({ color, size = 17 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx={10.5} cy={10.5} r={6.5} />
      <Path d="M15.5 15.5L21 21" strokeLinecap="round" />
    </Svg>
  );
}

/** Triangle pointing up (gain) or down (loss). */
export function Caret({ up, color, size = 8 }: { up: boolean; color: string; size?: number }) {
  const h = size * 0.875;
  return (
    <Svg width={size} height={h} viewBox="0 0 8 7">
      <Path d={up ? 'M4 0L8 7H0z' : 'M4 7L0 0h8z'} fill={color} />
    </Svg>
  );
}

/** Mini status bar (signal + battery), no emoji. */
export function StatusIcons({ color, muted }: { color: string; muted: string }) {
  return (
    <>
      <Svg width={18} height={12} viewBox="0 0 18 12" fill="none">
        <Rect x={0} y={7} width={3} height={5} rx={1} fill={color} />
        <Rect x={5} y={4} width={3} height={8} rx={1} fill={color} />
        <Rect x={10} y={1.5} width={3} height={10.5} rx={1} fill={color} />
        <Rect x={15} y={1.5} width={3} height={10.5} rx={1} fill={muted} />
      </Svg>
      <Svg width={22} height={12} viewBox="0 0 22 12" fill="none">
        <Rect x={0.5} y={0.5} width={18} height={11} rx={2.5} stroke={color} opacity={0.5} />
        <Rect x={2} y={2} width={14} height={8} rx={1.5} fill={color} />
        <Rect x={20} y={3.5} width={1.5} height={5} rx={0.75} fill={color} opacity={0.5} />
      </Svg>
    </>
  );
}

/** Equity line chart (lime stroke + area). */
export function EquitySparkline({
  values,
  width,
  height = 150,
  color,
}: {
  values: number[];
  width: number;
  height?: number;
  color: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 6;
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${line} ${width},${height} 0,${height}`;
  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={height * 0.27} x2={width} y2={height * 0.27} stroke="#15181C" />
      <Line x1={0} y1={height * 0.63} x2={width} y2={height * 0.63} stroke="#15181C" />
      <Polyline points={area} fill={color} fillOpacity={0.12} />
      <Polyline points={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
      <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1]!)} r={3} fill={color} />
    </Svg>
  );
}
