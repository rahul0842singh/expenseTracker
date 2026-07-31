import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import DonutChart, { DonutSegment } from '../components/DonutChart';
import ScreenHeader from '../components/ScreenHeader';
import { getCategory } from '../data/categories';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR, formatINRCompact } from '../utils/currency';
import { colors, font, radius, spacing } from '../theme/theme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function AnalyticsScreen() {
  const { expenses, monthlyTotal } = useExpenses();

  const spendByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    expenses
      .filter((e) => e.kind === 'expense')
      .forEach((e) => {
        totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
      });
    const segments: DonutSegment[] = Array.from(totals.entries())
      .map(([id, value]) => {
        const category = getCategory(id);
        return { label: category.label, value, color: category.color };
      })
      .sort((a, b) => b.value - a.value);
    return segments;
  }, [expenses]);

  const totalSpend = spendByCategory.reduce((s, seg) => s + seg.value, 0);

  const { weekTotals, peakDayLabel } = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dow = (today.getDay() + 6) % 7;
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
    const maxIdx = totals.reduce((best, v, i) => (v > totals[best] ? i : best), 0);
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return { weekTotals: totals, peakDayLabel: totals[maxIdx] > 0 ? dayNames[maxIdx] : null };
  }, [expenses]);

  const maxWeekVal = Math.max(...weekTotals, 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="ExpenseTracker" subtitle="Insight into your financial growth." rightIcon="settings-outline" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Analytics</Text>

        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            <Ionicons name="pie-chart-outline" size={16} color={colors.textMuted} />
          </View>
          <View style={styles.donutRow}>
            <DonutChart
              segments={spendByCategory}
              centerValue={formatINRCompact(totalSpend)}
              centerLabel="Total Spent"
            />
            <View style={styles.legend}>
              {spendByCategory.slice(0, 5).map((seg) => {
                const pct = totalSpend > 0 ? Math.round((seg.value / totalSpend) * 100) : 0;
                return (
                  <View key={seg.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {seg.label}
                      </Text>
                      <Text style={styles.legendAmount}>{formatINRCompact(seg.value)}</Text>
                    </View>
                    <Text style={styles.legendPct}>{pct}%</Text>
                  </View>
                );
              })}
              {spendByCategory.length === 0 ? (
                <Text style={styles.legendLabel}>No expenses yet</Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Weekly Trends</Text>
            <Ionicons name="bar-chart-outline" size={16} color={colors.textMuted} />
          </View>
          <View style={styles.barsRow}>
            {weekTotals.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(6, (v / maxWeekVal) * 100)}%`,
                        backgroundColor: v === Math.max(...weekTotals) && v > 0 ? colors.accent : colors.textFaint,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.peakText}>
            {peakDayLabel ? `Your peak spending day was ${peakDayLabel}.` : 'No spending recorded this week yet.'}
          </Text>
        </Card>

        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.monthAmount}>{formatINR(monthlyTotal)}</Text>
          <Text style={styles.monthSub}>Total spent across all categories</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  pageTitle: { color: colors.text, fontSize: 24, fontWeight: font.bold, marginTop: -spacing.sm },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: colors.text, fontSize: 12, fontWeight: font.medium },
  legendAmount: { color: colors.textFaint, fontSize: 10, marginTop: 1 },
  legendPct: { color: colors.accent, fontSize: 12, fontWeight: font.bold },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    alignItems: 'flex-end',
  },
  barCol: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  barTrack: {
    width: 10,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: radius.pill },
  barLabel: { color: colors.textFaint, fontSize: 10 },
  peakText: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
  monthAmount: { color: colors.text, fontSize: 26, fontWeight: font.bold },
  monthSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
