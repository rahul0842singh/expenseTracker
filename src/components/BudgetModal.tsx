import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

export default function BudgetModal({
  visible,
  currentBudget,
  isFirstTime,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentBudget: number | null;
  isFirstTime: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(currentBudget ? String(currentBudget) : '');
      setError('');
    }
  }, [visible, currentBudget]);

  const parsed = parseFloat(amount);
  const canSave = !Number.isNaN(parsed) && parsed > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await onSave(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save budget. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={isFirstTime ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={26} color={colors.accent} />
          </View>
          <Text style={styles.title}>
            {isFirstTime ? 'Set Your Monthly Budget' : 'Edit Monthly Budget'}
          </Text>
          <Text style={styles.subtitle}>
            {isFirstTime
              ? "We'll track your spending against this every month."
              : 'Update the limit you want to track spending against.'}
          </Text>

          <View style={styles.amountRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="30,000"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity onPress={handleSave} disabled={!canSave} activeOpacity={0.85} style={{ width: '100%' }}>
            <LinearGradient
              colors={[...colors.saveGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Budget'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isFirstTime ? (
            <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
              <Text style={styles.laterBtnText}>Set up later</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
              <Text style={styles.laterBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
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
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: font.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  rupeeSign: { color: colors.accent, fontSize: 24, fontWeight: font.bold, marginRight: 6 },
  amountInput: {
    color: colors.text,
    fontSize: 28,
    fontWeight: font.heavy,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.sm, textAlign: 'center' },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
    ...shadow.glow,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  laterBtn: { marginTop: spacing.md, paddingVertical: spacing.xs },
  laterBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
});
