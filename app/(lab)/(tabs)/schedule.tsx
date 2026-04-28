import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from "@/lib/theme";
import api from "@/lib/api";

const DAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

interface DaySchedule {
  start: string;
  end: string;
  isActive: boolean;
  note?: string;
}

interface ScheduleData {
  [key: string]: DaySchedule;
}

const DEFAULT_DAY_DATA: DaySchedule = {
  start: "09:00",
  end: "17:00",
  isActive: false,
};

export default function LabScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await api.get("/labs/schedule");
      const existingSchedule = res.data.workingHours || {};
      
      // Ensure all days are present
      const fullSchedule: ScheduleData = {};
      DAYS.forEach((day) => {
        fullSchedule[day.id] = existingSchedule[day.id] || { ...DEFAULT_DAY_DATA };
      });
      
      setSchedule(fullSchedule);
      setIsAvailable(res.data.isAvailable);
    } catch (err) {
      console.error("Fetch Schedule Error:", err);
      const defaultSchedule: ScheduleData = {};
      DAYS.forEach((day) => {
        defaultSchedule[day.id] = { ...DEFAULT_DAY_DATA, isActive: true };
      });
      setSchedule(defaultSchedule);
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (dayId: string, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) => {
      const dayData = prev[dayId] || { ...DEFAULT_DAY_DATA };
      return {
        ...prev,
        [dayId]: {
          ...dayData,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/labs/schedule", {
        workingHours: schedule,
        isAvailable,
      });
      Toast.show({
        type: "success",
        text1: "Cycle Synchronized",
        text2: "Laboratory operational hours updated successfully.",
      });
    } catch (err) {
      console.error("Save Schedule Error:", err);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not synchronize operational cycle.",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalHours = () => {
    let total = 0;
    Object.values(schedule).forEach((day) => {
      if (day.isActive && day.start && day.end) {
        const [h1, m1] = day.start.split(":").map(Number);
        const [h2, m2] = day.end.split(":").map(Number);
        const diff = h2 + m2 / 60 - (h1 + m1 / 60);
        if (diff > 0) total += diff;
      }
    });
    return total.toFixed(1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#070e1a", "#0c1321"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Weekly Hours */}
          <LinearGradient
            colors={["rgba(17, 26, 40, 0.8)", "rgba(28, 38, 55, 0.8)"]}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <MaterialIcons name="update" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Weekly Operating Hours</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>ACTIVE CYCLE</Text>
              </View>
            </View>

            {DAYS.map((day) => {
              const dayData = schedule[day.id] || { ...DEFAULT_DAY_DATA };
              return (
                <View key={day.id} style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, dayData.isActive && { color: COLORS.primary }]}>
                      {day.label}
                    </Text>
                    <Text style={styles.daySubText}>
                      {dayData.isActive ? "Full Capacity" : "Closed"}
                    </Text>
                  </View>
 
                  <View style={styles.timeInputs}>
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>START</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dayData.start}
                        onChangeText={(v) => updateDay(day.id, "start", v)}
                        placeholder="09:00"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                      />
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>END</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dayData.end}
                        onChangeText={(v) => updateDay(day.id, "end", v)}
                        placeholder="17:00"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                      />
                    </View>
                  </View>
 
                  <TouchableOpacity
                    onPress={() => updateDay(day.id, "isActive", !dayData.isActive)}
                    style={[styles.toggleBtn, dayData.isActive && styles.toggleBtnActive]}
                  >
                    <MaterialIcons
                      name={dayData.isActive ? "check-circle" : "radio-button-unchecked"}
                      size={20}
                      color={dayData.isActive ? COLORS.primary : "rgba(255,255,255,0.2)"}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </LinearGradient>

          {/* Overview & Save */}
          <LinearGradient
            colors={["rgba(17, 26, 40, 0.8)", "rgba(28, 38, 55, 0.8)"]}
            style={[styles.card, { marginBottom: 32 }]}
          >
            <Text style={styles.smallCardTitle}>QUICK OVERVIEW</Text>
            
            <View style={styles.overviewRow}>
              <View style={styles.overviewIconBox}>
                <MaterialIcons name="hourglass-top" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.overviewValue}>{calculateTotalHours()} hrs</Text>
                <Text style={styles.overviewLabel}>WEEKLY UPTIME</Text>
              </View>
            </View>

            <View style={styles.capacitySection}>
              <View style={styles.capacityHeader}>
                <Text style={styles.capacityText}>Total Capacity</Text>
                <Text style={styles.capacityValue}>120 Diagnostics</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "78%" }]} />
              </View>
              <Text style={styles.utilizationText}>78% utilization based on current settings</Text>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>SAVE OPERATIONAL CYCLE</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* System Health Decor */}
          <View style={styles.decorContainer}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBF-Zqm6pkrZUDJQ6FDUVtKtD2LP6aCsWmY3ObwQqBmfWVfe9RSAUZJNeG-p8DTnIXQoJDKdApMor1g7DObQYZ0x7UNQnrVxhz3-MlPRixv5yfKzIfci-bCK6fzsIrsF1z8X4I1oJx8iX7mxgUJ69eypXozJwEIlnxsWOstR8nEerCIz3PghAOqb0yiBM-RANtGe4GcWc_s2Z418zyGE4uKAXjWdKfnLLZizO-_fMIv1MG-bg31AEtTyVEJ376J53cFZqR6LUgFA" }}
              style={styles.decorImage}
            />
            <LinearGradient
              colors={["transparent", COLORS.surface]}
              style={styles.decorOverlay}
            >
              <Text style={styles.decorTag}>LIVE DIAGNOSTICS</Text>
              <Text style={styles.decorText}>Automation core is 100% synchronized with new schedule.</Text>
            </LinearGradient>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070e1a",
  },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 24, marginBottom: 32 },
  title: {
    color: COLORS.onSurface,
    fontSize: 28,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
    opacity: 0.8,
  },
  card: {
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 24,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  cardTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 1,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  dayInfo: { flex: 1, flexShrink: 1, marginRight: 8 },
  dayName: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  daySubText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    textTransform: "uppercase",
    marginTop: 2,
  },
  timeInputs: { flexDirection: "row", gap: 8, marginRight: 12 },
  timeField: { alignItems: "center" },
  timeLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: COLORS.onSurface,
    fontSize: 11,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
  },
  toggleBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnActive: {
    // Optional active state
  },
  smallCardTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 24,
  },
  overviewRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  overviewIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  overviewValue: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  overviewLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  capacitySection: { marginBottom: 32 },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  capacityText: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  capacityValue: { color: COLORS.onSurface, fontSize: 12, fontWeight: "700" },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  utilizationText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "right",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  saveButtonText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 1,
  },
  decorContainer: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    height: 180,
  },
  decorImage: { width: "100%", height: "100%", opacity: 0.6 },
  decorOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: "flex-end",
  },
  decorTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  decorText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
});
