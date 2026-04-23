import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY } from '@/lib/theme';
import type { DoctorSchedule, WorkingHours } from '@/types/doctor';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

interface SchedulePickerProps {
  schedule: DoctorSchedule;
  workingDays: string[];
  slotDuration: number;
  onScheduleChange: (schedule: DoctorSchedule) => void;
  onWorkingDaysChange: (days: string[]) => void;
  onSlotDurationChange: (duration: number) => void;
}

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
      {HALF_HOURS.map(h => (
        <TouchableOpacity
          key={h}
          onPress={() => onChange(h)}
          style={[styles.timeChip, h === value && styles.timeChipActive]}
        >
          <Text style={[styles.timeChipText, h === value && styles.timeChipTextActive]}>{h}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export function SchedulePicker({
  schedule,
  workingDays,
  slotDuration,
  onScheduleChange,
  onWorkingDaysChange,
  onSlotDurationChange,
}: SchedulePickerProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      onWorkingDaysChange(workingDays.filter(d => d !== day));
      const newSchedule = { ...schedule };
      delete newSchedule[day as keyof DoctorSchedule];
      onScheduleChange(newSchedule);
    } else {
      onWorkingDaysChange([...workingDays, day]);
      onScheduleChange({
        ...schedule,
        [day]: { start: '09:00', end: '17:00', hasBreak: false },
      });
      setExpandedDay(day);
    }
  };

  const updateDayHours = (day: string, field: keyof WorkingHours, value: any) => {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day as keyof DoctorSchedule], [field]: value },
    });
  };

  return (
    <View style={styles.container}>
      {/* Day toggles */}
      <Text style={styles.sectionLabel}>Working Days</Text>
      <View style={styles.daysRow}>
        {DAYS.map(day => {
          const active = workingDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => toggleDay(day)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Per-day hours */}
      {DAYS.filter(d => workingDays.includes(d)).map(day => {
        const hours = schedule[day as keyof DoctorSchedule];
        const isExpanded = expandedDay === day;
        return (
          <GlassCard key={day} style={styles.dayCard} variant="subtle" radius={RADIUS.md}>
            <TouchableOpacity
              style={styles.dayHeader}
              onPress={() => setExpandedDay(isExpanded ? null : day)}
            >
              <Text style={styles.dayName}>{DAY_LABELS[day]}</Text>
              <View style={styles.dayTime}>
                <Clock size={13} color={COLORS.secondary} />
                <Text style={styles.dayTimeText}>
                  {hours?.start ?? '09:00'} — {hours?.end ?? '17:00'}
                </Text>
              </View>
            </TouchableOpacity>

            {isExpanded && hours && (
              <View style={styles.dayDetails}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TimePicker value={hours.start} onChange={v => updateDayHours(day, 'start', v)} />
                <Text style={[styles.timeLabel, { marginTop: 8 }]}>End Time</Text>
                <TimePicker value={hours.end} onChange={v => updateDayHours(day, 'end', v)} />

                <TouchableOpacity
                  style={styles.breakToggle}
                  onPress={() => updateDayHours(day, 'hasBreak', !hours.hasBreak)}
                >
                  <View style={[styles.checkBox, hours.hasBreak && styles.checkBoxActive]}>
                    {hours.hasBreak && <View style={styles.checkMark} />}
                  </View>
                  <Text style={styles.breakLabel}>Lunch Break</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        );
      })}

      {/* Slot duration */}
      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Appointment Duration</Text>
      <View style={styles.daysRow}>
        {SLOT_DURATIONS.map(d => (
          <TouchableOpacity
            key={d}
            onPress={() => onSlotDurationChange(d)}
            style={[styles.slotChip, slotDuration === d && styles.dayChipActive]}
          >
            <Text style={[styles.dayChipText, slotDuration === d && styles.dayChipTextActive]}>
              {d} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  sectionLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  dayChipActive: {
    backgroundColor: 'rgba(197, 126, 255, 0.15)',
    borderColor: COLORS.secondary,
  },
  dayChipText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.label },
  dayChipTextActive: { color: COLORS.secondary },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  dayCard: { padding: SPACING.md, marginBottom: 4 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.title },
  dayTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayTimeText: { color: COLORS.secondary, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.bodyMedium },
  dayDetails: { marginTop: SPACING.sm, gap: 4 },
  timeLabel: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.label, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: RADIUS.md, marginRight: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  timeChipActive: { backgroundColor: 'rgba(197, 126, 255, 0.2)', borderColor: COLORS.secondary },
  timeChipText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.body },
  timeChipTextActive: { color: COLORS.secondary, fontFamily: FONT_FAMILY.title },
  breakToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  checkBox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: { borderColor: COLORS.secondary, backgroundColor: 'rgba(197, 126, 255, 0.15)' },
  checkMark: { width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.secondary },
  breakLabel: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
});
