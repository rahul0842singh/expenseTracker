import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UpiApp } from '../data/upiApps';
import { colors, font, radius } from '../theme/theme';

export default function UpiBadge({ app, size = 32 }: { app: UpiApp; size?: number }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius.md, backgroundColor: app.color },
      ]}
    >
      <Text style={[styles.glyph, { fontSize: size * 0.4 }]}>{app.glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: colors.white,
    fontWeight: font.bold,
  },
});
