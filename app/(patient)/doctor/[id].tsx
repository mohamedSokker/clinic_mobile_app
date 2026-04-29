import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Star,
  BadgeCheck,
  Video,
  Home,
  Check,
} from "lucide-react-native";
import { getDoctor } from "@/services/doctorService";
import {
  getAvailableTimeSlots,
  createReservation,
} from "@/services/reservationService";
import { useAuthStore } from "@/stores/authStore";
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import Toast from "react-native-toast-message";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar } from "@/components/ui/Avatar";

const { width: SW } = Dimensions.get("window");

// Build a 7-day window starting from today
function buildWeekDays(baseDate: Date) {
  const days: { date: Date; dayLabel: string; dayNum: number }[] = [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push({ date: d, dayLabel: names[d.getDay()], dayNum: d.getDate() });
  }
  return days;
}

export default function DoctorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { height: screenHeight } = useWindowDimensions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<
    "video" | "inperson"
  >("video");
  const [symptoms, setSymptoms] = useState("");
  const [booking, setBooking] = useState(false);

  const weekDays = buildWeekDays(weekStart);

  const { data: doctor } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => getDoctor(id),
    enabled: !!id,
  });

  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["availableSlots", id, selectedDate?.toISOString()],
    queryFn: () =>
      getAvailableTimeSlots(
        doctor!.id,
        selectedDate!,
        doctor!.slotDurationMinutes,
        doctor!.schedule,
      ),
    enabled: !!doctor && !!selectedDate,
  });

  const { data: weekAvailability } = useQuery({
    queryKey: ["weekAvailability", doctor?.id, weekStart.toDateString()],
    queryFn: async () => {
      const days = buildWeekDays(weekStart);
      return Promise.all(
        days.map((d) =>
          getAvailableTimeSlots(
            doctor!.id,
            d.date,
            doctor!.slotDurationMinutes,
            doctor!.schedule,
          ),
        ),
      );
    },
    enabled: !!doctor,
  });

  const queryClient = useQueryClient();

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !doctor || !user || !profile) {
      Toast.show({ type: "error", text1: "Please select a date and time" });
      return;
    }
    setBooking(true);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const bookingDateTime = dayjs(selectedDate)
        .hour(h)
        .minute(m)
        .second(0)
        .millisecond(0)
        .toDate();

      await createReservation({
        doctorId: doctor.id,
        patientId: user.uid,
        patientName: profile.name,
        patientPhotoURL: profile.photoURL,
        patientMobile: profile.mobile,
        clinicName: doctor.clinicName,
        doctorName: doctor.doctorName,
        dateTime: bookingDateTime,
        symptoms: symptoms.trim(),
        isEmergency: false,
      });

      // Invalidate queries to refresh available slots
      queryClient.invalidateQueries({ queryKey: ["availableSlots", id] });
      queryClient.invalidateQueries({
        queryKey: ["weekAvailability", doctor.id],
      });

      Toast.show({
        type: "success",
        text1: "✅ Booking Confirmed!",
        text2: `${doctor.clinicName} at ${selectedTime}`,
      });
      router.push(`/(patient)/queue/${doctor.id}` as any);
    } catch {
      Toast.show({
        type: "error",
        text1: "Booking failed",
        text2: "Slot may no longer be available",
      });
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) return null;

  // Derived display values
  const patientsLabel = doctor.patientsCount
    ? doctor.patientsCount >= 1000
      ? `${(doctor.patientsCount / 1000).toFixed(1)}k+`
      : `${doctor.patientsCount}+`
    : "0";
  const successLabel = doctor.successRate ? `${doctor.successRate}%` : "0%";
  const cityLabel = doctor.location?.split(",")[0] ?? "City";
  const expLabel = doctor.yearsExperience
    ? `${doctor.yearsExperience} yrs exp`
    : "";
  const badge = doctor.badgeTitle ?? "Specialist";
  const videoPrice =
    doctor.videoConsultCost ?? Math.round((doctor.visitCost ?? 0) * 0.65);
  const inPersonPrice = doctor.inPersonCost ?? doctor.visitCost ?? 0;

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
          {/* ── Profile Hero — full-width cinematic photo ── */}
          <View style={[s.heroWrap, { height: screenHeight * 0.5 }]}>
            {doctor.photoURL ? (
              <Image
                source={{ uri: doctor.photoURL }}
                style={s.heroImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require("../../../assets/doctor_default.png")}
                style={s.heroImage}
                resizeMode="contain"
              />
              // <View
              //   style={[
              //     s.heroImage,
              //     { backgroundColor: COLORS.surfaceContainerHighest },
              //   ]}
              // />
            )}
            {/* Gradient overlay from bottom */}
            <LinearGradient
              colors={["transparent", "rgba(7,14,26,0.55)", COLORS.background]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* Content pinned to bottom of hero */}
            <View style={s.heroContent}>
              {badge && badge !== "" && (
                <View style={s.heroBadgeRow}>
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeText}>{badge.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              <Text style={s.heroName}>{doctor.doctorName}</Text>
              <Text style={s.heroSpecialty}>{doctor.specialization}</Text>
              <View style={s.heroMeta}>
                <View style={s.heroMetaItem}>
                  <Star size={18} color="#facc15" fill="#facc15" />
                  <Text style={s.heroMetaValue}>
                    {doctor.rating.toFixed(1)}
                  </Text>
                  <Text style={s.heroMetaDim}>
                    ({doctor.reviewCount.toLocaleString()} Reviews)
                  </Text>
                </View>
                {expLabel ? (
                  <>
                    <View style={s.heroDivider} />
                    <View style={s.heroMetaItem}>
                      <BadgeCheck size={18} color={COLORS.primary} />
                      <Text style={s.heroMetaDim}>{expLabel}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Stats Grid (3 glass cards) ── */}
          <View style={s.statsGrid}>
            {[
              { label: "Patients", value: patientsLabel },
              { label: "Success", value: successLabel },
              { label: "Clinic", value: cityLabel },
            ].map((stat, i) => (
              <View key={i} style={s.statCard}>
                <Text style={s.statLabel}>{stat.label.toUpperCase()}</Text>
                <Text style={s.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* ── Bio Section ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>PROFESSIONAL BIO</Text>
            <Text style={s.bioText}>
              {doctor.about ||
                "Distinguished specialist dedicated to advanced clinical care and diagnostic precision. Our practice leverages the latest medical technologies to ensure optimal health outcomes."}
            </Text>
            {/* Specialty tags */}
            {doctor.specialties && doctor.specialties.length > 0 && (
              <View style={s.tagRow}>
                {doctor.specialties.map((tag, i) => (
                  <View key={i} style={s.tag}>
                    <Text style={s.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Booking Panel (glass) ── */}
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

            {/* ── Date Picker Row (7 days) ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.datePicker}
            >
              {weekDays.map((d, i) => {
                const isWorkDay = (doctor?.workingDays || []).includes(
                  d.dayLabel,
                );
                const isSelected =
                  selectedDate?.toDateString() === d.date.toDateString();

                // Check if fully booked or all slots passed
                const daySlots = weekAvailability ? weekAvailability[i] : [];
                const hasFutureSlots = daySlots.length > 0;
                const isFullyBooked =
                  hasFutureSlots && daySlots.every((s) => s.taken);

                const isUnavailable =
                  !isWorkDay || !hasFutureSlots || isFullyBooked;

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (isUnavailable) return;
                      setSelectedDate(d.date);
                      setSelectedTime(null);
                    }}
                    style={[
                      s.dateCell,
                      isSelected && s.dateCellActive,
                      isUnavailable && s.dateCellDisabled,
                      isFullyBooked && s.dateCellTaken,
                    ]}
                    activeOpacity={!isUnavailable ? 0.8 : 1}
                  >
                    <Text
                      style={[
                        s.dateDayLabel,
                        isSelected && s.dateDayLabelActive,
                        isUnavailable && { opacity: 0.3 },
                      ]}
                    >
                      {d.dayLabel.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        s.dateDayNum,
                        isSelected && s.dateDayNumActive,
                        isUnavailable && { opacity: 0.3 },
                      ]}
                    >
                      {d.dayNum}
                    </Text>
                    {isFullyBooked && <Text style={s.takenDayLabel}>full</Text>}
                    {!isFullyBooked && !hasFutureSlots && isWorkDay && (
                      <Text style={s.takenDayLabel}>closed</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Available Slots ── */}
            <View style={s.slotsSection}>
              <View style={s.slotsHeader}>
                <Text style={s.sectionLabel}>AVAILABLE SLOTS</Text>
                {availableSlots.length > 0 && (
                  <View style={s.slotsBadge}>
                    <Text style={s.slotsBadgeText}>
                      {availableSlots.length} slots left
                    </Text>
                  </View>
                )}
              </View>

              {!selectedDate ? (
                <Text style={s.slotPrompt}>
                  Pick a date above to see available times.
                </Text>
              ) : slotsLoading ? (
                <Text style={s.slotPrompt}>Loading slots…</Text>
              ) : availableSlots.length === 0 ? (
                <Text style={s.slotPrompt}>
                  No slots available for this date.
                </Text>
              ) : (
                <View style={s.slotsGrid}>
                  {availableSlots.map((slotObj, i) => {
                    const slot = slotObj.time;
                    const isTaken = slotObj.taken;
                    const active = selectedTime === slot;
                    // Format 24h → 12h AM/PM
                    const [hh, mm] = slot.split(":").map(Number);
                    const ampm = hh < 12 ? "AM" : "PM";
                    const h12 = hh % 12 || 12;
                    const label = `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => !isTaken && setSelectedTime(slot)}
                        style={[
                          s.slotCell,
                          active && s.slotCellActive,
                          isTaken && s.slotCellTaken,
                        ]}
                        activeOpacity={isTaken ? 1 : 0.8}
                        disabled={isTaken}
                      >
                        <Text
                          style={[
                            s.slotText,
                            active && s.slotTextActive,
                            isTaken && s.slotTextTaken,
                          ]}
                        >
                          {label}
                        </Text>
                        {/* {isTaken && <Text style={s.takenText}>taken</Text>} */}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Consultation Type ── */}
            <View style={s.consultSection}>
              <Text style={s.sectionLabel}>CONSULTATION TYPE</Text>
              <View style={s.consultRow}>
                {/* Video Call */}
                <TouchableOpacity
                  style={[
                    s.consultCard,
                    consultationType === "video" && s.consultCardActive,
                  ]}
                  onPress={() => setConsultationType("video")}
                  activeOpacity={0.85}
                >
                  <View style={s.consultIconWrap}>
                    <Video size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.consultType}>Video Call</Text>
                    <Text style={s.consultPrice}>
                      {videoPrice > 0 ? `${videoPrice} EGP` : "Free"}
                    </Text>
                  </View>
                  {consultationType === "video" && (
                    <View style={s.consultCheck}>
                      <Check
                        size={10}
                        color={COLORS.onPrimary}
                        strokeWidth={3}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* In-Person */}
                <TouchableOpacity
                  style={[
                    s.consultCard,
                    consultationType === "inperson" && s.consultCardActive,
                  ]}
                  onPress={() => setConsultationType("inperson")}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      s.consultIconWrap,
                      { backgroundColor: "rgba(94,216,255,0.1)" },
                    ]}
                  >
                    <Home size={22} color={COLORS.tertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.consultType}>In-Person</Text>
                    <Text style={s.consultPrice}>
                      {inPersonPrice > 0 ? `${inPersonPrice} EGP` : "Free"}
                    </Text>
                  </View>
                  {consultationType === "inperson" && (
                    <View style={s.consultCheck}>
                      <Check
                        size={10}
                        color={COLORS.onPrimary}
                        strokeWidth={3}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Optional symptoms ── */}
            {selectedDate && selectedTime && (
              <View style={s.symptomsSection}>
                <Text style={s.sectionLabel}>SYMPTOMS / NOTES (OPTIONAL)</Text>
                <TextInput
                  style={s.symptomsInput}
                  placeholder="Describe your current medical condition…"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  value={symptoms}
                  onChangeText={setSymptoms}
                  multiline
                  selectionColor={COLORS.primary}
                />
              </View>
            )}

            {/* ── Confirm button — matches HTML's gradient pill ── */}
            <TouchableOpacity
              onPress={handleBook}
              disabled={!selectedDate || !selectedTime || booking}
              activeOpacity={0.9}
              style={s.confirmBtnWrap}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  s.confirmBtn,
                  (!selectedDate || !selectedTime) && s.confirmBtnDisabled,
                ]}
              >
                <Text style={s.confirmBtnText}>
                  {booking
                    ? "CONFIRMING…"
                    : selectedTime
                      ? `CONFIRM APPOINTMENT — ${selectedTime}`
                      : "SELECT DATE & TIME"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* ─────────────── Styles ─────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 48 },

  // Hero
  heroWrap: {
    width: "100%",
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
    fontSize: 36,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
    lineHeight: 42,
  },
  heroSpecialty: {
    color: COLORS.primary,
    fontSize: 17,
    fontFamily: FONT_FAMILY.bodyMedium,
    marginBottom: 8,
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

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    backgroundColor: "rgba(17,26,40,0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.2)",
    gap: 4,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontFamily: FONT_FAMILY.display,
    textAlign: "center",
  },

  // Bio
  section: { paddingHorizontal: 20, marginBottom: 24, gap: 12 },
  sectionLabel: {
    color: "#475569",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  bioText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 24,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },

  // Booking panel
  bookingPanel: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "rgba(17,26,40,0.6)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.2)",
    padding: 24,
    gap: 24,
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  // Date picker
  datePicker: { gap: 10 },
  dateCell: {
    width: 56,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: "center",
    gap: 6,
  },
  dateCellActive: { backgroundColor: COLORS.primary },
  dateCellDisabled: { opacity: 0.3 },
  dateDayLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  dateDayLabelActive: { color: COLORS.onPrimary, opacity: 0.8 },
  dateDayNum: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.display,
  },
  dateDayNumActive: { color: COLORS.onPrimary },

  // Slots
  slotsSection: { gap: 14 },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotCell: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: (SW - 32 - 48 - 20) / 3,
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  slotCellActive: {
    borderColor: "rgba(64,206,243,0.45)",
    backgroundColor: "rgba(64,206,243,0.1)",
  },
  slotText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  slotTextActive: { color: COLORS.primary, fontFamily: FONT_FAMILY.label },

  // Consultation type
  consultSection: { gap: 14 },
  consultRow: { flexDirection: "column", gap: 12 },
  consultCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  consultCardActive: { borderColor: "rgba(64,206,243,0.4)" },
  consultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(64,206,243,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  consultType: {
    color: "#fff",
    fontSize: 13,
    fontFamily: FONT_FAMILY.headline,
  },
  consultPrice: {
    color: "#64748b",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  consultCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Symptoms
  symptomsSection: { gap: 12 },
  symptomsInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    height: 100,
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlignVertical: "top",
  },

  // Confirm button
  confirmBtnWrap: { marginTop: 8 },
  confirmBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#04b5d9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: {
    color: COLORS.onPrimary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dateCellTaken: {
    backgroundColor: "rgba(215, 56, 59, 0.05)",
    borderColor: "rgba(215, 56, 59, 0.1)",
  },
  takenDayLabel: {
    fontSize: 8,
    color: COLORS.error,
    fontWeight: "800",
    textTransform: "uppercase",
    position: "absolute",
    bottom: 4,
  },
  slotCellTaken: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.05)",
    opacity: 0.5,
  },
  slotTextTaken: {
    color: "rgba(255,255,255,0.3)",
    textDecorationLine: "line-through",
  },
  takenText: {
    fontSize: 8,
    color: COLORS.error,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 2,
  },
});
