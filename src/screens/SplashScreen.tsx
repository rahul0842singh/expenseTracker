import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

const HOLD_MS = 4000;
const FADE_OUT_MS = 450;

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleShift = useRef(new Animated.Value(14)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleShift, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    intro.start();

    // Fade the whole screen out so the app underneath is revealed rather
    // than appearing with a hard cut.
    const fadeTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, HOLD_MS);

    // Dismissal is driven by a timer rather than the fade's completion
    // callback: Animated runs on requestAnimationFrame, which the browser
    // pauses while the app is backgrounded. Relying on the callback would
    // leave the user stuck on the splash with no way into the app.
    const dismissTimer = setTimeout(() => onFinish(), HOLD_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
      intro.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.wrap, { opacity: screenOpacity }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[...colors.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <Animated.View
          style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
        >
          <LinearGradient colors={[...colors.saveGradient]} style={styles.logo}>
            <Text style={styles.logoText}>₹</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleShift }] },
          ]}
        >
          ExpenseTracker
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Track every rupee, effortlessly
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footer, { opacity: dotsOpacity }]}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMid]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.footerText}>Secure UPI expense tracking</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: { alignItems: 'center' },
  logo: {
    width: 92,
    height: 92,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  logoText: {
    color: colors.white,
    fontSize: 46,
    fontWeight: font.heavy,
  },
  title: {
    color: colors.white,
    fontSize: 27,
    fontWeight: font.heavy,
    letterSpacing: -0.6,
    marginTop: spacing.xl,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: spacing.md,
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.35)',
  },
  dotMid: { backgroundColor: colors.accent },
  footerText: {
    color: colors.textFaint,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
