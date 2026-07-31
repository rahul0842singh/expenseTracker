import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCategory } from '../data/categories';
import { getUpiApp } from '../data/upiApps';
import { Expense } from '../types/expense';
import { formatINR } from '../utils/currency';
import { colors, font, radius, spacing } from '../theme/theme';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function TransactionRow({
  expense,
  onDelete,
  showDate = false,
}: {
  expense: Expense;
  onDelete?: (expense: Expense) => void;
  showDate?: boolean;
}) {
  const category = getCategory(expense.categoryId);
  const upiApp = getUpiApp(expense.upiAppId);
  const isIncome = expense.kind === 'income';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${category.color}1F` }]}>
        <Ionicons name={category.icon} size={20} color={category.color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.reason} numberOfLines={1}>
          {expense.reason}
        </Text>
        <View style={styles.subRow}>
          <View style={[styles.upiDot, { backgroundColor: upiApp.color }]} />
          <Text style={styles.sub} numberOfLines={1}>
            {upiApp.name} · {showDate ? `${formatDayLabel(expense.date)}, ` : ''}
            {formatTime(expense.date)}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {isIncome ? '+' : '-'}{formatINR(expense.amount)}
      </Text>
      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(expense)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  middle: {
    flex: 1,
  },
  reason: {
    color: colors.text,
    fontSize: 15,
    fontWeight: font.semibold,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  upiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 12,
    flexShrink: 1,
  },
  amount: {
    fontSize: 15,
    fontWeight: font.bold,
    marginLeft: spacing.sm,
  },
  income: {
    color: colors.accent,
  },
  expense: {
    color: colors.danger,
  },
  deleteBtn: {
    marginLeft: spacing.md,
    padding: 2,
  },
});
