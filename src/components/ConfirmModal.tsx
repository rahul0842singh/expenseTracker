import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

export default function ConfirmModal({
  visible,
  title,
  message,
  icon = 'alert-circle-outline',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
            <Ionicons name={icon} size={26} color={destructive ? colors.danger : colors.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.noBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.noBtnText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesBtn, destructive && styles.yesBtnDanger]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.yesBtnText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconWrapDanger: {
    backgroundColor: colors.dangerSoft,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: font.bold,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  noBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  noBtnText: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  yesBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
  },
  yesBtnDanger: {
    backgroundColor: colors.danger,
  },
  yesBtnText: { color: colors.white, fontSize: 14, fontWeight: font.bold },
});
