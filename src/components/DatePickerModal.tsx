import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme/theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildMonthGrid(viewYear: number, viewMonth: number): (Date | null)[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(viewYear, viewMonth, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DatePickerModal({
  visible,
  value,
  onClose,
  onSelect,
  maxDate,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  maxDate?: Date;
}) {
  const [viewDate, setViewDate] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  React.useEffect(() => {
    if (visible) setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [visible, value]);

  const today = startOfDay(new Date());
  const maxAllowed = maxDate ? startOfDay(maxDate) : today;
  const cells = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

  const goPrevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const nextMonthDisabled = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) > maxAllowed;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={goNextMonth}
              style={styles.navBtn}
              disabled={nextMonthDisabled}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={nextMonthDisabled ? colors.textFaint : colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((w, i) => (
              <Text key={i} style={styles.weekLabel}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cellDate, i) => {
              if (!cellDate) return <View key={i} style={styles.cell} />;
              const isFuture = cellDate > maxAllowed;
              const isSelected = isSameDay(cellDate, value);
              const isToday = isSameDay(cellDate, today);
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.cell}
                  disabled={isFuture}
                  onPress={() => {
                    onSelect(cellDate);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                      isToday && !isSelected && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isFuture && styles.dayTextDisabled,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {cellDate.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => {
              onSelect(today);
              onClose();
            }}
          >
            <Ionicons name="today-outline" size={16} color={colors.accent} />
            <Text style={styles.todayBtnText}>Jump to Today</Text>
          </TouchableOpacity>
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
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { color: colors.text, fontSize: 15, fontWeight: font.bold },
  weekRow: { flexDirection: 'row' },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: font.semibold,
    marginBottom: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.accent,
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dayText: { color: colors.text, fontSize: 13, fontWeight: font.medium },
  dayTextDisabled: { color: colors.textFaint },
  dayTextSelected: { color: colors.bg, fontWeight: font.bold },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  todayBtnText: { color: colors.accent, fontSize: 13, fontWeight: font.semibold },
});
