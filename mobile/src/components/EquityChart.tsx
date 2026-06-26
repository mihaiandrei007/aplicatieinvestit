import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';
import { theme } from '../theme';

/**
 * Grafic-linie simplu al evoluției capitalului. Fără axe complexe — doar forma
 * tendinței, cu o linie de bază la capitalul de start.
 */
export function EquityChart({
  values,
  baseline,
  width = 320,
  height = 120,
}: {
  values: number[];
  baseline?: number;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;

  const pad = 8;
  const min = Math.min(...values, baseline ?? Infinity);
  const max = Math.max(...values, baseline ?? -Infinity);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (values.length - 1)) * (width - 2 * pad);
  const y = (v: number) => height - pad - ((v - min) / range) * (height - 2 * pad);

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = values[values.length - 1]!;
  const first = values[0]!;
  const lineColor = last >= first ? theme.colors.green : theme.colors.red;

  return (
    <View style={{ backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius, padding: 4 }}>
      <Svg width={width} height={height}>
        {baseline !== undefined && (
          <Line
            x1={pad}
            y1={y(baseline)}
            x2={width - pad}
            y2={y(baseline)}
            stroke={theme.colors.muted}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}
        <Polyline points={points} fill="none" stroke={lineColor} strokeWidth={2.5} />
      </Svg>
    </View>
  );
}
