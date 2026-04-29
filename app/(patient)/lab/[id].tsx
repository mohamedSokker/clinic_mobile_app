import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  FlaskConical,
  Calendar,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import { getLabById, getLabAvailableTimeSlots } from "@/services/labService";
import { createReservation } from "@/services/reservationService";
import { useAuthStore } from "@/stores/authStore";
import { COLORS, RADIUS, FONT_FAMILY, GRADIENTS, SPACING } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar } from "@/components/ui/Avatar";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const { width: SW } = Dimensions.get("window");

// Build a 7-day window starting from today
function buildWeekDays(baseDate: Date) {
  const days: {
    date: Date;
    dayLabel: string;
    dayNum: number;
    fullDay: string;
  }[] = [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push({
      date: d,
      dayLabel: names[d.getDay()],
      dayNum: d.getDate(),
      fullDay: fullNames[d.getDay()],
    });
  }
  return days;
}

export default function LabDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(today);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const weekDays = buildWeekDays(weekStart);

  const {
    data: lab,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lab", id],
    queryFn: () => getLabById(id),
    enabled: !!id,
  });

  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["labSlots", id, selectedDate?.toISOString()],
    queryFn: () =>
      getLabAvailableTimeSlots(id, selectedDate!, lab!.workingHours),
    enabled: !!lab && !!selectedDate,
  });

  const { data: weekAvailability } = useQuery({
    queryKey: ["weekAvailability", lab?.id, weekStart.toDateString()],
    queryFn: async () => {
      const days = buildWeekDays(weekStart);
      return Promise.all(
        days.map((d) =>
          getLabAvailableTimeSlots(lab!.id, d.date, lab!.workingHours),
        ),
      );
    },
    enabled: !!lab,
  });

  const queryClient = useQueryClient();

  const handleBooking = async () => {
    if (
      !selectedAnalysis ||
      !selectedDate ||
      !selectedTime ||
      !lab ||
      !user ||
      !profile
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Selection",
        text2: "Please pick an analysis, date, and time.",
      });
      return;
    }

    setIsBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const bookingDateTime = dayjs(selectedDate)
        .hour(hours)
        .minute(minutes)
        .second(0)
        .millisecond(0)
        .toDate();

      await createReservation({
        labId: lab.id,
        patientId: user.uid,
        patientName: profile.name,
        patientPhotoURL: profile.photoURL,
        patientMobile: profile.mobile,
        labName: lab.labName,
        selectedTest: selectedAnalysis,
        dateTime: bookingDateTime,
        isEmergency: false,
      });

      // Invalidate queries to refresh available slots
      queryClient.invalidateQueries({ queryKey: ["labSlots", id] });
      queryClient.invalidateQueries({ queryKey: ["weekAvailability", lab.id] });

      Toast.show({
        type: "success",
        text1: "Reservation Confirmed!",
        text2: `${selectedAnalysis} at ${selectedTime}`,
      });
      
      router.push("/(patient)/history" as any);
    } catch (err) {
      console.error("Booking Error:", err);
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: "Unable to process reservation. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!lab) return null;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ── Lab Hero ── */}
          <View style={s.heroWrap}>
            <Image
              source={{
                uri:
                  lab.user?.photoURL ||
                  "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800",
              }}
              style={s.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(7,14,26,0.55)", COLORS.background]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.heroContent}>
              <View style={s.heroBadgeRow}>
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>DIAGNOSTIC CENTER</Text>
                </View>
              </View>
              <Text style={s.heroName}>{lab.labName}</Text>
              <View style={s.heroMeta}>
                <View style={s.heroMetaItem}>
                  <Star size={18} color="#facc15" fill="#facc15" />
                  <Text style={s.heroMetaValue}>4.9</Text>
                  <Text style={s.heroMetaDim}>(1.2k+ Reviews)</Text>
                </View>
                <View style={s.heroDivider} />
                <View style={s.heroMetaItem}>
                  <BadgeCheck size={18} color={COLORS.primary} />
                  <Text style={s.heroMetaDim}>Verified Lab</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Stats Grid ── */}
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Clock
                size={20}
                color={COLORS.primary}
                style={{ marginBottom: 4 }}
              />
              <Text style={s.statLabel}>OPEN UNTIL</Text>
              <Text style={s.statValue}>18:00</Text>
            </View>
            <View style={s.statCard}>
              <MapPin
                size={20}
                color={COLORS.secondary}
                style={{ marginBottom: 4 }}
              />
              <Text style={s.statLabel}>LOCATION</Text>
              <Text style={s.statValue}>{lab.location.split(",")[0]}</Text>
            </View>
            <View style={s.statCard}>
              <FlaskConical
                size={20}
                color={COLORS.tertiary}
                style={{ marginBottom: 4 }}
              />
              <Text style={s.statLabel}>SERVICES</Text>
              <Text style={s.statValue}>
                {(lab.analysisTypes as any[])?.length || 0}
              </Text>
            </View>
          </View>

          {/* ── About Section ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>ABOUT THE LABORATORY</Text>
            <Text style={s.bioText}>
              {lab.description ||
                "State-of-the-art diagnostic facility providing high-precision clinical analysis and imaging services. Our laboratory is equipped with the latest medical technology to ensure accurate and timely results for all patients."}
            </Text>
          </View>

          {/* ── Available Analysis ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>AVAILABLE ANALYSIS</Text>
            <View style={s.analysisGrid}>
              {(lab.analysisTypes as any[])?.map((analysis, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    s.analysisCard,
                    selectedAnalysis === analysis.name && s.analysisCardActive
                  ]}
                  onPress={() => setSelectedAnalysis(analysis.name)}
                >
                  <View style={s.analysisIconBg}>
                    <MaterialIcons
                      name="biotech"
                      size={20}
                      color={selectedAnalysis === analysis.name ? "#fff" : COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.analysisName, selectedAnalysis === analysis.name && { color: "#fff" }]}>
                      {analysis.name}
                    </Text>
                    <Text style={[s.analysisPrice, selectedAnalysis === analysis.name && { color: "rgba(255,255,255,0.8)" }]}>
                      ${analysis.cost}
                    </Text>
                  </View>
                  {selectedAnalysis === analysis.name ? (
                    <CheckCircle2 size={20} color="#fff" />
                  ) : (
                    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Booking Panel ── */}
          <View style={s.bookingPanel}>
            {/* Panel Header */}
            <View style={s.panelHeaderRow}>
              <View>
                <Text style={s.panelTitle}>Schedule Appointment</Text>
                <Text style={s.panelSub}>
                  Select your preferred date and time
                </Text>
              </View>
              {/* Week navigation */}
              <View style={s.weekNav}>
                <TouchableOpacity
                  style={s.weekNavBtn}
                  onPress={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() - 7);
                    if (d >= today) setWeekStart(d);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.weekNavArrow}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.weekNavBtn}
                  onPress={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + 7);
                    setWeekStart(d);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.weekNavArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selection */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.datePicker}
            >
              {weekDays.map((d, i) => {
                const weekday = d.fullDay;
                const isActive = lab.workingHours?.[weekday]?.isActive;
                const isSelected =
                  selectedDate?.toDateString() === d.date.toDateString();

                // Check availability
                const daySlots = weekAvailability ? weekAvailability[i] : [];
                const hasFutureSlots = daySlots.length > 0;
                const isFullyBooked =
                  hasFutureSlots &&
                  daySlots.every((s: any) =>
                    typeof s === "string" ? false : s.taken,
                  );

                const isUnavailable =
                  !isActive || !hasFutureSlots || isFullyBooked;

                return (
                  <TouchableOpacity
                    key={i}
                    disabled={isUnavailable}
                    onPress={() => {
                      setSelectedDate(d.date);
                      setSelectedTime(null);
                    }}
                    style={[
                      s.dateCard,
                      isSelected && s.dateCardActive,
                      isUnavailable && s.dateCardDisabled,
                    ]}
                  >
                    <Text style={[s.dateDay, isSelected && { color: "#fff" }]}>
                      {d.dayLabel}
                    </Text>
                    <Text style={[s.dateNum, isSelected && { color: "#fff" }]}>
                      {d.dayNum}
                    </Text>
                    {isFullyBooked && <Text style={s.takenDayLabel}>full</Text>}
                    {!isFullyBooked && !hasFutureSlots && isActive && (
                      <Text style={s.takenDayLabel}>closed</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Selection */}
            <View style={s.slotsSection}>
              <View style={s.slotsHeader}>
                <Text style={s.sectionLabel}>AVAILABLE SLOTS</Text>
                {availableSlots.length > 0 && (
                  <View style={s.slotsBadge}>
                    <Text style={s.slotsBadgeText}>
                      {
                        availableSlots.filter((s: any) =>
                          typeof s === "string" ? true : !s.taken,
                        ).length
                      }{" "}
                      slots left
                    </Text>
                  </View>
                )}
              </View>

              {!selectedDate ? (
                <Text style={s.slotPrompt}>
                  Pick a date above to see available times.
                </Text>
              ) : slotsLoading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginTop: 15 }}
                />
              ) : availableSlots.length === 0 ? (
                <View style={s.emptySlots}>
                  <AlertCircle size={20} color="#64748b" />
                  <Text style={s.emptySlotsText}>Fully booked for this day</Text>
                </View>
              ) : (
                <View style={s.timeGrid}>
                  {availableSlots.map((slotObj: any, index) => {
                    const time =
                      typeof slotObj === "string" ? slotObj : slotObj?.time;
                    if (!time) return null;

                    const isTaken =
                      typeof slotObj === "string" ? false : slotObj.taken;
                    const isActive = selectedTime === time;

                    // Format 24h → 12h AM/PM
                    const [hh, mm] = time.split(":").map(Number);
                    const ampm = hh < 12 ? "AM" : "PM";
                    const h12 = hh % 12 || 12;
                    const label = `${String(h12).padStart(2, "0")}:${String(
                      mm,
                    ).padStart(2, "0")} ${ampm}`;

                    return (
                      <TouchableOpacity
                        key={index}
                        disabled={isTaken}
                        style={[
                          s.timeSlot,
                          isActive && s.timeSlotActive,
                          isTaken && s.timeSlotTaken,
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text
                          style={[
                            s.timeText,
                            isActive && { color: "#fff" },
                            isTaken && s.timeTextTaken,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Confirm Button */}
            <View style={{ marginTop: 32 }}>
              <TouchableOpacity
                style={[s.confirmBtn, (!selectedAnalysis || !selectedTime) && s.confirmBtnDisabled]}
                disabled={!selectedAnalysis || !selectedTime || isBooking}
                onPress={handleBooking}
              >
                <LinearGradient
                  colors={
                    !selectedAnalysis || !selectedTime
                      ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]
                      : [COLORS.primary, COLORS.primaryContainer]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.confirmBtnGradient}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[s.confirmBtnText, (!selectedAnalysis || !selectedTime) && { color: "#64748b" }]}>
                      {selectedTime ? `CONFIRM AT ${selectedTime}` : "COMPLETE SELECTION"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  scroll: { paddingBottom: 60 },
  heroWrap: {
    width: SW,
    aspectRatio: 16 / 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroContent: { padding: 24, gap: 6 },
  heroBadgeRow: { flexDirection: "row", marginBottom: 4 },
  heroBadge: {
    backgroundColor: "rgba(64,206,243,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  heroBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },
  heroName: {
    color: "#fff",
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
  },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaValue: {
    color: "#fff",
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
  },
  heroMetaDim: { color: "#94a3b8", fontSize: 13, fontFamily: FONT_FAMILY.body },
  heroDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    backgroundColor: "rgba(17,26,40,0.8)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.3)",
    gap: 2,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  statValue: { color: "#fff", fontSize: 16, fontFamily: FONT_FAMILY.display },
  section: { paddingHorizontal: 24, marginBottom: 32, gap: 12 },
  sectionLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bioText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
  },
  analysisGrid: { gap: 12 },
  analysisCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  analysisCardActive: {
    backgroundColor: "rgba(64,206,243,0.1)",
    borderColor: COLORS.primary,
  },
  analysisIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(64,206,243,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisName: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
  },
  analysisPrice: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  bookingPanel: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 32,
    backgroundColor: "rgba(17,26,40,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  panelTitle: { color: "#fff", fontSize: 22, fontFamily: FONT_FAMILY.headline },
  panelSub: {
    color: "#64748b",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  weekNav: { flexDirection: "row", gap: 8 },
  weekNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavArrow: { color: COLORS.onSurface, fontSize: 20, lineHeight: 22 },
  datePicker: { gap: 10, marginBottom: 24 },
  dateCard: {
    width: 56,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dateCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateCardDisabled: { opacity: 0.2 },
  dateDay: { color: "#64748b", fontSize: 10, fontFamily: FONT_FAMILY.label },
  dateNum: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_FAMILY.display,
    marginTop: 2,
  },
  takenDayLabel: {
    color: COLORS.error,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    marginTop: 2,
  },
  slotsSection: { gap: 14, marginTop: 24 },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  slotsBadge: {
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  slotsBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
  },
  slotPrompt: {
    color: "#475569",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    paddingVertical: 12,
  },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeSlot: {
    width: (SW - 40 - 48 - 20) / 3,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  timeSlotActive: {
    backgroundColor: "rgba(64,206,243,0.1)",
    borderColor: COLORS.primary,
  },
  timeSlotTaken: {
    opacity: 0.3,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  timeText: { color: "#cbd5e1", fontSize: 13, fontFamily: FONT_FAMILY.headline },
  timeTextTaken: {
    textDecorationLine: "line-through",
  },
  emptySlots: { alignItems: "center", paddingVertical: 20 },
  emptySlotsText: {
    color: "#64748b",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginTop: 8,
  },
  confirmBtn: { borderRadius: RADIUS.full, overflow: "hidden" },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: 1,
  },
});
