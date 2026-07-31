import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme/theme';

export default function ScreenHeader({
  title,
  subtitle,
  showAvatar = false,
  avatarLabel = 'U',
  rightIcon = 'notifications-outline',
  onRightPress,
}: {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  avatarLabel?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showAvatar ? (
          <LinearGradient colors={[...colors.saveGradient]} style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </LinearGradient>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={onRightPress} disabled={!onRightPress}>
        <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: font.bold,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: font.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
