import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY } from '@/lib/theme';

interface BookingCalendarProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  availableSlots: string[];
  workingDays: string[];
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  loading?: boolean;
}

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function BookingCalendar({
  selectedDate,
  selectedTime,
  availableSlots,
  workingDays,
  onDateChange,
  onTimeChange,
  loading = false,
}: BookingCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isWorkingDay = (date: Date) => {
    const day = DAY_ABBREVS[date.getDay()];
    return workingDays.includes(day);
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <GlassCard style={styles.monthRow} variant="subtle" radius={RADIUS.md}>
        <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
          <ChevronLeft size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
          <ChevronRight size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </GlassCard>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAY_ABBREVS.map(d => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
          const date = new Date(viewYear, viewMonth, day);
          const past = isPast(day);
          const working = isWorkingDay(date);
          const selected = isSelected(day);
          const disabled = past || !working;

          return (
            <TouchableOpacity
              key={day}
              onPress={() => !disabled && onDateChange(date)}
              disabled={disabled}
              style={[
                styles.cell,
                selected && styles.cellSelected,
                !disabled && !selected && working && styles.cellAvailable,
                disabled && styles.cellDisabled,
              ]}
            >
              <Text style={[
                styles.cellText,
                selected && styles.cellTextSelected,
                disabled && styles.cellTextDisabled,
                working && !disabled && !selected && { color: COLORS.onSurface },
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time slots */}
      {selectedDate && (
        <View style={styles.slotsSection}>
          <Text style={styles.slotsLabel}>Available Times</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading slots...</Text>
          ) : availableSlots.length === 0 ? (
            <Text style={styles.noSlots}>No available slots for this day</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.slotsRow}>
                {availableSlots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => onTimeChange(slot)}
                    style={[styles.slotChip, selectedTime === slot && styles.slotChipActive]}
                  >
                    <Text style={[styles.slotText, selectedTime === slot && styles.slotTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  monthLabel: { color: COLORS.onSurface, fontSize: FONT_SIZE.md, fontFamily: FONT_FAMILY.title },
  navBtn: { padding: 8 },
  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around' },
  dayHeader: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.label, width: 40, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  cellSelected: { backgroundColor: COLORS.primary },
  cellAvailable: { backgroundColor: COLORS.surfaceContainerLow },
  cellDisabled: { opacity: 0.2 },
  cellText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.label },
  cellTextSelected: { color: COLORS.background, fontFamily: FONT_FAMILY.headline },
  cellTextDisabled: { color: COLORS.outlineVariant },
  slotsSection: { marginTop: SPACING.sm },
  slotsLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  slotsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  slotChipActive: { backgroundColor: 'rgba(64, 206, 243, 0.2)', borderColor: COLORS.primary },
  slotText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.label },
  slotTextActive: { color: COLORS.primary, fontFamily: FONT_FAMILY.headline },
  loadingText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
  noSlots: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body, fontStyle: 'italic' },
});
