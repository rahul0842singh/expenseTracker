import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePickerModal from '../components/DatePickerModal';
import UpiBadge from '../components/UpiBadge';
import { CATEGORIES } from '../data/categories';
import { UPI_APPS } from '../data/upiApps';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR } from '../utils/currency';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatFriendlyDate(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AddExpenseScreen() {
  const { addExpense, todayTotal } = useExpenses();

  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState(UPI_APPS[0].id);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [reason, setReason] = useState('');

  const parsedAmount = parseFloat(amount);
  const canSave = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleSave = () => {
    if (!canSave) {
      Alert.alert('Enter a valid amount', 'Amount must be greater than 0.');
      return;
    }
    const now = new Date();
    const expenseDate = new Date(selectedDate);
    expenseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);

    addExpense({
      amount: parsedAmount,
      kind: 'expense',
      categoryId,
      reason: reason.trim() || CATEGORIES.find((c) => c.id === categoryId)?.label || 'Expense',
      upiAppId: selectedUpiApp,
      date: expenseDate.toISOString(),
    });
    setAmount('');
    setReason('');
    setSelectedDate(new Date());
    Alert.alert('Saved', 'Your expense has been recorded.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={styles.todayPill}>
            <Text style={styles.todayPillLabel}>Today</Text>
            <Text style={styles.todayPillValue}>{formatINR(todayTotal)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={[...colors.heroGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCard}
          >
            <Text style={styles.amountFieldLabel}>ENTER AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
              />
            </View>
          </LinearGradient>

          <Text style={styles.label}>Date of Transaction</Text>
          <TouchableOpacity
            style={styles.inputBox}
            activeOpacity={0.75}
            onPress={() => setDatePickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <Text style={styles.dateText}>{formatFriendlyDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textFaint} />
          </TouchableOpacity>

          <DatePickerModal
            visible={datePickerVisible}
            value={selectedDate}
            onClose={() => setDatePickerVisible(false)}
            onSelect={setSelectedDate}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.filter((c) => c.id !== 'income').map((c) => {
              const selected = categoryId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Ionicons
                    name={c.icon}
                    size={14}
                    color={selected ? colors.accent : colors.textMuted}
                  />
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Pay via UPI App</Text>
          <View style={styles.upiGrid}>
            {UPI_APPS.map((app) => {
              const selected = selectedUpiApp === app.id;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.upiChip, selected && styles.upiChipSelected]}
                  onPress={() => setSelectedUpiApp(app.id)}
                  activeOpacity={0.8}
                >
                  <UpiBadge app={app} size={30} />
                  <Text
                    style={[styles.upiChipText, selected && styles.upiChipTextSelected]}
                    numberOfLines={1}
                  >
                    {app.shortLabel}
                  </Text>
                  {selected ? (
                    <View style={styles.upiCheck}>
                      <Ionicons name="checkmark" size={10} color={colors.bg} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Reason / Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="What was this expense for?"
            placeholderTextColor={colors.textFaint}
            multiline
          />

          <TouchableOpacity style={styles.receiptBox}>
            <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
            <Text style={styles.receiptText}>Attach Receipt (Optional)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} disabled={!canSave} activeOpacity={0.85}>
            <LinearGradient
              colors={[...colors.saveGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: font.bold, letterSpacing: -0.3 },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  todayPillLabel: { color: colors.textMuted, fontSize: 11 },
  todayPillValue: { color: colors.danger, fontSize: 12, fontWeight: font.bold },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  amountCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.card,
  },
  amountFieldLabel: {
    color: 'rgba(248, 250, 252, 0.55)',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: font.semibold,
    marginBottom: spacing.sm,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  rupeeSign: { color: colors.accent, fontSize: 34, fontWeight: font.bold, marginRight: 6 },
  amountInput: {
    color: colors.text,
    fontSize: 44,
    fontWeight: font.heavy,
    minWidth: 110,
    textAlign: 'center',
    padding: 0,
    letterSpacing: -1,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: font.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  dateText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: font.medium,
  },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  categoryChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  categoryChipText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium },
  categoryChipTextSelected: { color: colors.accent, fontWeight: font.semibold },
  upiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  upiChip: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  upiChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  upiChipText: { color: colors.textMuted, fontSize: 11, fontWeight: font.medium, flexShrink: 1 },
  upiChipTextSelected: { color: colors.text, fontWeight: font.semibold },
  upiCheck: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  receiptText: { color: colors.textMuted, fontSize: 13 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.lg,
    ...shadow.glow,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: font.bold },
});
