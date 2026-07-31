import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, font } from '../theme/theme';

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 18,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let offsetAccum = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.cardAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map((seg, i) => {
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const strokeDashoffset = -offsetAccum;
            offsetAccum += dash;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      {centerValue ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.centerValue}>{centerValue}</Text>
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  centerValue: { color: colors.text, fontSize: 20, fontWeight: font.bold },
  centerLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});
