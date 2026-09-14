import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../../theme';

interface Point {
  timestamp: number;
  equity: number;
}

interface EquityCurveChartProps {
  data: Point[];
  height?: number;
}

export function EquityCurveChart({ data, height = 160 }: EquityCurveChartProps) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width);

  if (data.length < 2 || width === 0) {
    return <View style={{ height, width: '100%' }} onLayout={onLayout} />;
  }

  const values = data.map((d) => d.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(min, 1) * 0.02 || 1;
  const isPositive = values[values.length - 1]! >= values[0]!;
  const color = isPositive ? palette.positive : palette.negative;

  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - ((d.equity - min) / range) * (height - 16) - 8,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#equityFill)" stroke="none" />
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
