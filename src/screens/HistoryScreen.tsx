import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
import DatePickerModal from '../components/DatePickerModal';
import ScreenHeader from '../components/ScreenHeader';
import TransactionRow from '../components/TransactionRow';
import UpiBadge from '../components/UpiBadge';
import { CATEGORIES, getCategory } from '../data/categories';
import { UPI_APPS, getUpiApp } from '../data/upiApps';
import { useExpenses } from '../context/ExpenseContext';
import { Expense } from '../types/expense';
import { formatINR } from '../utils/currency';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

type TimeRange = 'all' | 'today' | 'week' | 'month';

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

function monthSectionLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
    return `This Month · ${d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function isInRange(dateStr: string, range: TimeRange): boolean {
  if (range === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();

  if (range === 'today') return d.toDateString() === now.toDateString();
  if (range === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  // week: Monday-start current week
  const startOfWeek = new Date(now);
  const dow = (now.getDay() + 6) % 7;
  startOfWeek.setDate(now.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);
  return d.getTime() >= startOfWeek.getTime();
}

export default function HistoryScreen() {
  const { expenses, removeExpense } = useExpenses();
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [upiFilter, setUpiFilter] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('all');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [datePickerFor, setDatePickerFor] = useState<'from' | 'to' | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const activeFilterCount =
    (categoryFilter ? 1 : 0) +
    (upiFilter ? 1 : 0) +
    (range !== 'all' ? 1 : 0) +
    (fromDate || toDate ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter && e.categoryId !== categoryFilter) return false;
      if (upiFilter && e.upiAppId !== upiFilter) return false;
      if (!isInRange(e.date, range)) return false;
      const t = new Date(e.date).getTime();
      if (fromDate && t < startOfDay(fromDate).getTime()) return false;
      if (toDate && t > endOfDay(toDate).getTime()) return false;
      if (q) {
        const upiName = getUpiApp(e.upiAppId).name.toLowerCase();
        const catName = getCategory(e.categoryId).label.toLowerCase();
        if (
          !e.reason.toLowerCase().includes(q) &&
          !upiName.includes(q) &&
          !catName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, query, categoryFilter, upiFilter, range, fromDate, toDate]);

  const filteredSpendTotal = useMemo(
    () => filtered.filter((e) => e.kind === 'expense').reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const sections = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const map = new Map<string, Expense[]>();
    sorted.forEach((e) => {
      const label = monthSectionLabel(e.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(e);
    });
    return Array.from(map.entries()).map(([title, data]) => {
      const total = data.filter((e) => e.kind === 'expense').reduce((sum, e) => sum + e.amount, 0);
      return { title, data, total };
    });
  }, [filtered]);

  const clearAllFilters = () => {
    setCategoryFilter(null);
    setUpiFilter(null);
    setRange('all');
    setFromDate(null);
    setToDate(null);
    setQuery('');
  };

  // Presets and custom range are mutually exclusive to keep results predictable.
  const selectPreset = (r: TimeRange) => {
    setRange(r);
    setFromDate(null);
    setToDate(null);
  };

  const handleDateSelected = (picked: Date) => {
    setRange('all');
    if (datePickerFor === 'from') {
      if (toDate && picked > toDate) {
        setFromDate(toDate);
        setToDate(picked);
      } else {
        setFromDate(picked);
      }
    } else if (datePickerFor === 'to') {
      if (fromDate && picked < fromDate) {
        setToDate(fromDate);
        setFromDate(picked);
      } else {
        setToDate(picked);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="History" />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions…"
            placeholderTextColor={colors.textFaint}
          />
          {query.length > 0 ? (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textFaint}
              onPress={() => setQuery('')}
            />
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? colors.bg : colors.textMuted}
          />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsRow}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !categoryFilter && styles.categoryChipSelected]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text
              style={[styles.categoryChipText, !categoryFilter && styles.categoryChipTextSelected]}
            >
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.filter((c) => c.id !== 'income').map((c) => {
            const selected = categoryFilter === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setCategoryFilter(selected ? null : c.id)}
              >
                <Ionicons name={c.icon} size={13} color={selected ? colors.accent : colors.textMuted} />
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {filtered.length} transaction{filtered.length === 1 ? '' : 's'}
        </Text>
        <Text style={styles.summaryAmount}>-{formatINR(filteredSpendTotal)}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <TransactionRow expense={item} onDelete={setPendingDelete} showDate />
          </View>
        )}
        renderSectionHeader={({ section: { title, total, data } }) => (
          <View style={styles.monthHeaderRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.monthHeaderMeta}>
              {data.length} txn{data.length === 1 ? '' : 's'} · -{formatINR(total)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color={colors.textFaint} />
            <Text style={styles.empty}>No transactions match your filters.</Text>
            {activeFilterCount > 0 || query ? (
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.clearLink}>Clear all filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        stickySectionHeadersEnabled={false}
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

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetLabel}>Time Period</Text>
            <View style={styles.rangeRow}>
              {TIME_RANGES.map((r) => {
                const selected = range === r.id && !fromDate && !toDate;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rangeChip, selected && styles.rangeChipSelected]}
                    onPress={() => selectPreset(r.id)}
                  >
                    <Text style={[styles.rangeChipText, selected && styles.rangeChipTextSelected]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Custom Date Range</Text>
            <View style={styles.dateRangeRow}>
              <TouchableOpacity
                style={[styles.dateBtn, fromDate && styles.dateBtnActive]}
                onPress={() => setDatePickerFor('from')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={fromDate ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.dateBtnText, fromDate && styles.dateBtnTextActive]}>
                  {fromDate ? formatShortDate(fromDate) : 'From date'}
                </Text>
                {fromDate ? (
                  <Ionicons
                    name="close-circle"
                    size={15}
                    color={colors.textFaint}
                    onPress={() => setFromDate(null)}
                  />
                ) : null}
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={14} color={colors.textFaint} />
              <TouchableOpacity
                style={[styles.dateBtn, toDate && styles.dateBtnActive]}
                onPress={() => setDatePickerFor('to')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={toDate ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.dateBtnText, toDate && styles.dateBtnTextActive]}>
                  {toDate ? formatShortDate(toDate) : 'To date'}
                </Text>
                {toDate ? (
                  <Ionicons
                    name="close-circle"
                    size={15}
                    color={colors.textFaint}
                    onPress={() => setToDate(null)}
                  />
                ) : null}
              </TouchableOpacity>
            </View>

            <DatePickerModal
              visible={datePickerFor !== null}
              value={(datePickerFor === 'from' ? fromDate : toDate) ?? new Date()}
              onClose={() => setDatePickerFor(null)}
              onSelect={handleDateSelected}
            />

            <Text style={styles.sheetLabel}>UPI App</Text>
            <View style={styles.upiGrid}>
              <TouchableOpacity
                style={[styles.upiChip, !upiFilter && styles.upiChipSelected]}
                onPress={() => setUpiFilter(null)}
              >
                <Ionicons name="apps-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.upiChipText, !upiFilter && styles.upiChipTextSelected]}>
                  All Apps
                </Text>
              </TouchableOpacity>
              {UPI_APPS.map((app) => {
                const selected = upiFilter === app.id;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.upiChip, selected && styles.upiChipSelected]}
                    onPress={() => setUpiFilter(selected ? null : app.id)}
                  >
                    <UpiBadge app={app} size={22} />
                    <Text
                      style={[styles.upiChipText, selected && styles.upiChipTextSelected]}
                      numberOfLines={1}
                    >
                      {app.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>Show {filtered.length} Result{filtered.length === 1 ? '' : 's'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: font.bold },
  categoryChipsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  categoryChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  categoryChipText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium },
  categoryChipTextSelected: { color: colors.accent, fontWeight: font.semibold },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  summaryText: { color: colors.textMuted, fontSize: 12 },
  summaryAmount: { color: colors.danger, fontSize: 13, fontWeight: font.bold },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: font.bold,
  },
  monthHeaderMeta: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: font.medium,
  },
  rowWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyWrap: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl * 2 },
  empty: { color: colors.textMuted, textAlign: 'center' },
  clearLink: { color: colors.accent, fontSize: 13, fontWeight: font.semibold },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    ...shadow.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: font.bold },
  sheetLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rangeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  rangeChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  rangeChipText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium },
  rangeChipTextSelected: { color: colors.accent, fontWeight: font.semibold },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dateBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  dateBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium, flex: 1 },
  dateBtnTextActive: { color: colors.text, fontWeight: font.semibold },
  upiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  upiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  upiChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  upiChipText: { color: colors.textMuted, fontSize: 11, fontWeight: font.medium },
  upiChipTextSelected: { color: colors.text, fontWeight: font.semibold },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  clearBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: font.semibold },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    ...shadow.glow,
  },
  applyBtnText: { color: colors.bg, fontSize: 14, fontWeight: font.bold },
});
