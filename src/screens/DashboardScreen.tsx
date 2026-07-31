import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetModal from '../components/BudgetModal';
import Card from '../components/Card';
import ConfirmModal from '../components/ConfirmModal';
import ScreenHeader from '../components/ScreenHeader';
import TransactionRow from '../components/TransactionRow';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Expense } from '../types/expense';
import { formatINR, formatINRCompact } from '../utils/currency';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardScreen() {
  const { expenses, monthlyTotal, todayTotal, removeExpense } = useExpenses();
  const { user, logout, updateBudget } = useAuth();
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const hasBudget = Boolean(user?.monthlyBudget);

  // Prompt for a budget once per session the first time we see this user
  // has none set — but only after auth has actually loaded a real user,
  // so it doesn't flash during the initial loading state.
  useEffect(() => {
    if (user && !user.monthlyBudget) setBudgetModalVisible(true);
  }, [user?.id]);

  const currentMonthLabel = useMemo(
    () => new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    []
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
      return;
    }
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const recent = useMemo(() => expenses.slice(0, 4), [expenses]);

  const weekBars = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dow = (today.getDay() + 6) % 7; // Monday = 0
    startOfWeek.setDate(today.getDate() - dow);
    startOfWeek.setHours(0, 0, 0, 0);

    const totals = new Array(7).fill(0);
    expenses
      .filter((e) => e.kind === 'expense')
      .forEach((e) => {
        const d = new Date(e.date);
        const diffDays = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 7) totals[diffDays] += e.amount;
      });
    const max = Math.max(...totals, 1);
    return totals.map((t) => t / max);
  }, [expenses]);

  const budgetLimit = user?.monthlyBudget ?? 0;
  const budgetPct = budgetLimit > 0 ? Math.min(1, monthlyTotal / budgetLimit) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="ExpenseTracker"
        subtitle={`Welcome back, ${user?.name ?? 'there'}`}
        showAvatar
        avatarLabel={(user?.name ?? 'U').charAt(0).toUpperCase()}
        rightIcon="log-out-outline"
        onRightPress={handleLogout}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[...colors.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <View style={styles.totalTopRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL SPENT THIS MONTH</Text>
              <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
            </View>
            <View style={styles.rupeeBadge}>
              <Text style={styles.rupeeBadgeText}>₹ INR</Text>
            </View>
          </View>
          <Text style={styles.totalAmount}>{formatINR(monthlyTotal)}</Text>
          <View style={styles.heroBottomRow}>
            <View style={styles.trendPill}>
              <Ionicons name="trending-down" size={12} color={colors.accent} />
              <Text style={styles.trendText}>4.2% less than last month</Text>
            </View>
            <Text style={styles.todayText}>Today · {formatINRCompact(todayTotal)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <Text style={styles.sectionLink}>Last 7 Days</Text>
        </View>
        <Card style={styles.insightsCard}>
          <View style={styles.barsRow}>
            {weekBars.map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(6, h * 100)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.budgetRow}
            activeOpacity={0.7}
            onPress={() => setBudgetModalVisible(true)}
          >
            <View style={styles.budgetIconWrap}>
              <Ionicons name="pulse" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.budgetLabel} numberOfLines={1} ellipsizeMode="tail">
                Monthly Budget · {currentMonthLabel}
              </Text>
              {hasBudget ? (
                <>
                  <Text style={styles.budgetValues}>
                    {formatINRCompact(monthlyTotal)} / {formatINRCompact(budgetLimit)}
                  </Text>
                  <View style={styles.budgetTrack}>
                    <View style={[styles.budgetFill, { width: `${budgetPct * 100}%` }]} />
                  </View>
                </>
              ) : (
                <Text style={styles.setBudgetLink}>Tap to set a budget</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </TouchableOpacity>
        </Card>

        {recent.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('History')}
              >
                <Text style={styles.sectionLink}>View All</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <Card style={styles.txCard}>
              {recent.map((e, idx) => (
                <View key={e.id}>
                  <TransactionRow expense={e} onDelete={setPendingDelete} />
                  {idx < recent.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <BudgetModal
        visible={budgetModalVisible}
        currentBudget={user?.monthlyBudget ?? null}
        isFirstTime={!hasBudget}
        onClose={() => setBudgetModalVisible(false)}
        onSave={async (amount) => {
          await updateBudget(amount);
          setBudgetModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={pendingDelete !== null}
        title="Delete this transaction?"
        message={pendingDelete ? `${pendingDelete.reason} · ${formatINR(pendingDelete.amount)}` : undefined}
        icon="trash-outline"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeExpense(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  totalCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  totalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: 'rgba(248, 250, 252, 0.65)',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: font.semibold,
  },
  monthLabel: {
    color: 'rgba(248, 250, 252, 0.9)',
    fontSize: 13,
    fontWeight: font.semibold,
    marginTop: 4,
  },
  rupeeBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rupeeBadgeText: { color: colors.textMuted, fontSize: 10, fontWeight: font.semibold },
  totalAmount: {
    color: colors.white,
    fontSize: 38,
    fontWeight: font.heavy,
    marginTop: spacing.sm,
    letterSpacing: -1,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  trendText: { color: colors.accent, fontSize: 11, fontWeight: font.medium },
  todayText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: font.bold, letterSpacing: -0.2 },
  sectionLink: { color: colors.accent, fontSize: 12, fontWeight: font.medium },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  insightsCard: { gap: spacing.lg },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 96,
    alignItems: 'flex-end',
  },
  barCol: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  barTrack: {
    width: 10,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  barLabel: { color: colors.textFaint, fontSize: 10, fontWeight: font.medium },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  budgetIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetLabel: { color: colors.text, fontSize: 13, fontWeight: font.semibold, marginBottom: 4 },
  budgetValues: { color: colors.textMuted, fontSize: 11, fontWeight: font.medium, marginBottom: 7 },
  budgetTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  budgetFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  setBudgetLink: { color: colors.accent, fontSize: 12, fontWeight: font.semibold },
  txCard: { paddingVertical: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
});
