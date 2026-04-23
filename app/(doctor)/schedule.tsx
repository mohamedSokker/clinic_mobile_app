import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Save } from "lucide-react-native";
import { SchedulePicker } from "@/components/doctor/SchedulePicker";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/stores/authStore";
import { getDoctorByUid, updateDoctorSchedule } from "@/services/doctorService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import type { DoctorSchedule } from "@/types/doctor";
import Toast from "react-native-toast-message";
import { useQuery } from "@tanstack/react-query";

export default function ScheduleScreen() {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<DoctorSchedule>({});
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", user?.uid],
    queryFn: () => getDoctorByUid(user!.uid),
    enabled: !!user,
  });

  useEffect(() => {
    if (doctor) {
      setSchedule(doctor.schedule ?? {});
      setWorkingDays(doctor.workingDays ?? []);
      setSlotDuration(doctor.slotDurationMinutes ?? 30);
    }
  }, [doctor]);

  const handleSave = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await updateDoctorSchedule(
        doctor.id,
        schedule,
        workingDays,
        slotDuration,
      );
      Toast.show({
        type: "success",
        text1: "✅ Schedule saved!",
        text2: "Patients can now see your available slots",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to save schedule" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Working Schedule</Text>
            <Text style={styles.subtitle}>
              Set your availability for patients
            </Text>
          </View>
          {!isLoading && doctor && (
            <SchedulePicker
              schedule={schedule}
              workingDays={workingDays}
              slotDuration={slotDuration}
              onScheduleChange={setSchedule}
              onWorkingDaysChange={setWorkingDays}
              onSlotDurationChange={setSlotDuration}
            />
          )}
          <GradientButton
            onPress={handleSave}
            label="Save Schedule"
            loading={saving}
            size="lg"
            variant="secondary"
            icon={<Save size={18} color="#fff" />}
            style={{ marginTop: SPACING.xl }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  header: { marginBottom: SPACING.xl },
  title: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE["2xl"],
    fontFamily: FONT_FAMILY.display,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.body,
    marginTop: 4,
  },
});
