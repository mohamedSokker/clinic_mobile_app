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
  Clock,
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
  const [consultationType, setConsultationType] = useState<
    "video" | "inperson"
  >("video");
  const [symptoms, setSymptoms] = useState("");
  const [booking, setBooking] = useState(false);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState(false);
  const [estimatedSlot, setEstimatedSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  const weekDays = buildWeekDays(weekStart);

  const { data: doctor } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => getDoctor(id),
    enabled: !!id,
  });

  const { data: weekAvailability, isLoading: slotsLoading } = useQuery({
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

  const findNextAvailableSlot = () => {
    if (!weekAvailability) return null;
    for (let i = 0; i < weekAvailability.length; i++) {
      const daySlots = weekAvailability[i];
      const date = weekDays[i].date;
      const firstFree = daySlots.find((s) => !s.taken);
      if (firstFree) {
        return { date, time: firstFree.time };
      }
    }
    return null;
  };

  const handleJoinQueuePress = () => {
    const slot = findNextAvailableSlot();
    if (!slot) {
      Toast.show({
        type: "error",
        text1: "No available slots",
        text2: "The doctor has no available time in the next 7 days.",
      });
      return;
    }
    setEstimatedSlot(slot);
    setIsQueueModalVisible(true);
  };

  const handleConfirmJoin = async () => {
    if (!estimatedSlot || !doctor || !user || !profile) return;
    setBooking(true);
    try {
      const [h, m] = estimatedSlot.time.split(":").map(Number);
      const bookingDateTime = dayjs(estimatedSlot.date)
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

      queryClient.invalidateQueries({ queryKey: ["availableSlots", id] });
      queryClient.invalidateQueries({
        queryKey: ["weekAvailability", doctor.id],
      });

      setIsQueueModalVisible(false);
      Toast.show({
        type: "success",
        text1: "✅ Reservation Confirmed!",
        text2: `Queue joined for ${estimatedSlot.time}`,
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
            <View style={s.panelHeaderRow}>
              <View>
                <Text style={s.panelTitle}>Join Clinic Queue</Text>
                <Text style={s.panelSub}>
                  Quickly join the queue and get notified
                </Text>
              </View>
            </View>

            {/* ── Working Days Display (Non-clickable) ── */}
            <View style={{ gap: 12 }}>
              <Text style={s.sectionLabel}>WORKING DAYS AVAILABILITY</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.datePicker}
              >
                {weekDays.map((d, i) => {
                  const isWorkDay = (doctor?.workingDays || []).includes(
                    d.dayLabel,
                  );
                  return (
                    <View
                      key={i}
                      style={[s.dateCell, { opacity: isWorkDay ? 1 : 0.5 }]}
                    >
                      <Text style={s.dateDayLabel}>
                        {d.dayLabel.toUpperCase()}
                      </Text>
                      <Text style={s.dateDayNum}>{d.dayNum}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Consultation Type ── */}
            <View style={s.consultSection}>
              <Text style={s.sectionLabel}>CONSULTATION TYPE</Text>
              <View style={s.consultRow}>
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

            {/* ── Join Queue button ── */}
            <TouchableOpacity
              onPress={handleJoinQueuePress}
              disabled={slotsLoading || booking}
              activeOpacity={0.9}
              style={s.confirmBtnWrap}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  s.confirmBtn,
                  (slotsLoading || booking) && s.confirmBtnDisabled,
                ]}
              >
                <Text style={s.confirmBtnText}>
                  {slotsLoading
                    ? "CHECKING QUEUE…"
                    : booking
                      ? "JOINING…"
                      : "JOIN CLINIC QUEUE"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ── Queue Confirmation Modal ── */}
      <JoinQueueModal
        visible={isQueueModalVisible}
        onClose={() => setIsQueueModalVisible(false)}
        onConfirm={handleConfirmJoin}
        estimatedSlot={estimatedSlot}
        loading={booking}
        doctorName={doctor.doctorName}
      />
    </View>
  );
}

function JoinQueueModal({
  visible,
  onClose,
  onConfirm,
  estimatedSlot,
  loading,
  doctorName,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  estimatedSlot: { date: Date; time: string } | null;
  loading: boolean;
  doctorName: string;
}) {
  if (!estimatedSlot) return null;

  const dateLabel = dayjs(estimatedSlot.date).format("dddd, MMM D");
  // Format time for display
  const [hh, mm] = estimatedSlot.time.split(":").map(Number);
  const ampm = hh < 12 ? "AM" : "PM";
  const h12 = hh % 12 || 12;
  const timeLabel = `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 999,
          justifyContent: "center",
          alignItems: "center",
          display: visible ? "flex" : "none",
        },
      ]}
    >
      <View style={s.modalContainer}>
        <LinearGradient
          colors={["rgba(30,41,59,0.95)", "rgba(15,23,42,0.98)"] as any}
          style={s.modalContent}
        >
          <View style={s.modalHeader}>
            <View style={s.modalIcon}>
              <Clock size={32} color={COLORS.primary} />
            </View>
            <Text style={s.modalTitle}>Join Queue</Text>
            <Text style={s.modalSub}>
              Confirm your reservation with {doctorName}
            </Text>
          </View>

          <View style={s.modalTimeBox}>
            <Text style={s.modalDateLabel}>{dateLabel}</Text>
            <Text style={s.modalTimeValue}>{timeLabel}</Text>
            <Text style={s.modalTimeSub}>Estimated Appointment Time</Text>
          </View>

          <View style={s.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={[s.modalBtn, s.modalBtnSecondary]}
            >
              <Text style={s.modalBtnTextSecondary}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[s.modalBtn, s.modalBtnPrimary]}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryContainer]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.modalBtnTextPrimary}>
                {loading ? "JOINING..." : "CONFIRM"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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

  // Date picker (visual only)
  datePicker: { gap: 10 },
  dateCell: {
    width: 56,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: "center",
    gap: 6,
  },
  dateDayLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  dateDayNum: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.display,
  },
  // Modal
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalContent: {
    padding: 32,
    gap: 28,
  },
  modalHeader: {
    alignItems: "center",
    gap: 12,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(64,206,243,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: FONT_FAMILY.display,
    textAlign: "center",
  },
  modalSub: {
    color: "#94a3b8",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
  modalTimeBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  modalDateLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  modalTimeValue: {
    color: "#fff",
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    marginVertical: 4,
  },
  modalTimeSub: {
    color: "#475569",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  modalBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalBtnTextSecondary: {
    color: "#94a3b8",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  modalBtnTextPrimary: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },

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
    backgroundColor: "rgba(255,255,255,0.02)",
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
});
