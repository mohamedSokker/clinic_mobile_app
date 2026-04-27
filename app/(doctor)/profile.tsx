import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  RefreshControl,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  LogOut,
  Edit3,
  ChevronRight,
  Calendar,
  Users,
  Star,
  Award,
  Clock,
  MapPin,
  Stethoscope,
  Briefcase,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { COLORS, FONT_FAMILY, GRADIENTS, RADIUS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DoctorUser } from "@/types/user";

const { width } = Dimensions.get("window");

export default function DoctorProfileScreen() {
  const { profile, logout, user, refreshProfile } = useAuthStore();
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const doctorProfile = profile as DoctorUser;

  // Stats for the doctor
  const stats = [
    {
      label: "Patients",
      val: doctorProfile.doctor?.patientsCount || "0",
      icon: Users,
      color: "#40cef3",
    },
    {
      label: "Experience",
      val: `${doctorProfile.doctor?.yearsExperience || 0}y`,
      icon: Briefcase,
      color: "#a855f7",
    },
    {
      label: "Rating",
      val: doctorProfile.doctor?.rating?.toFixed(1) || "0.0",
      icon: Star,
      color: "#fbbf24",
    },
    {
      label: "Success",
      val: `${doctorProfile.doctor?.successRate || 100}%`,
      icon: Award,
      color: "#10b981",
    },
  ];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const handleLogout = () => setShowSignOutModal(true);

  if (!profile) return null;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Doctor Hero */}
        <View style={s.hero}>
          <View style={s.badgeContainer}>
            <View style={s.statusBadge}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>ACTIVE PRACTITIONER</Text>
            </View>
          </View>

          <View style={s.heroMain}>
            <View style={s.imageWrapper}>
              <Image
                source={{
                  uri:
                    profile.photoURL ||
                    "https://lh3.googleusercontent.com/a/ACg8ocL_G5v5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5=s96-c",
                }}
                style={s.heroImg}
              />
              <LinearGradient
                colors={["transparent", "rgba(7, 14, 26, 0.8)"]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={s.heroInfo}>
              <Text style={s.doctorName}>
                {doctorProfile.doctor?.doctorName || profile.name}
              </Text>
              <Text style={s.specialtyText}>
                {doctorProfile.doctor?.specialization || "Medical Specialist"}
              </Text>
              <View style={s.locationRow}>
                <MapPin size={12} color="rgba(255,255,255,0.4)" />
                <Text style={s.locationText}>
                  {doctorProfile.doctor?.clinicName || "Private Clinic"} •{" "}
                  {doctorProfile.doctor?.location || "Main Center"}
                </Text>
              </View>

              <View style={s.heroActions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => router.push("/(doctor)/edit-profile")}
                >
                  <Edit3 size={16} color={COLORS.primary} />
                  <Text style={s.editBtnText}>Edit Professional Bio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          {stats.map((item, i) => (
            <GlassCard key={i} style={s.statCard}>
              <View
                style={[s.statIconBox, { backgroundColor: `${item.color}15` }]}
              >
                <item.icon size={18} color={item.color} />
              </View>
              <Text style={s.statVal}>{item.val}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* About Section */}
        <GlassCard style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Stethoscope size={20} color={COLORS.primary} />
              <Text style={s.sectionTitle}>Professional Summary</Text>
            </View>
          </View>
          <Text style={s.aboutText}>
            {doctorProfile.doctor?.about ||
              "No professional biography provided. Update your profile to showcase your expertise and clinical background to patients."}
          </Text>

          {doctorProfile.doctor?.specialties &&
            doctorProfile.doctor.specialties.length > 0 && (
              <View style={s.tagsContainer}>
                {doctorProfile.doctor.specialties.map((tag, i) => (
                  <View key={i} style={s.tag}>
                    <Text style={s.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
        </GlassCard>

        {/* Account Actions */}
        <View style={s.actionGroup}>
          <TouchableOpacity style={s.actionItem}>
            <View
              style={[
                s.actionIcon,
                { backgroundColor: "rgba(64, 206, 243, 0.1)" },
              ]}
            >
              <Calendar size={20} color={COLORS.primary} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Schedule Management</Text>
              <Text style={s.actionSub}>
                Configure working hours and slot durations
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>

          <TouchableOpacity style={s.actionItem} onPress={handleLogout}>
            <View
              style={[
                s.actionIcon,
                { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              ]}
            >
              <LogOut size={20} color={COLORS.error} />
            </View>
            <View style={s.actionInfo}>
              <Text style={[s.actionTitle, { color: COLORS.error }]}>
                Sign Out
              </Text>
              <Text style={s.actionSub}>
                Securely terminate your current session
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sign Out Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={s.modalOverlay}>
          <GlassCard style={s.modalContent}>
            <View style={s.modalIcon}>
              <LogOut size={32} color={COLORS.error} />
            </View>
            <Text style={s.modalTitle}>Sign Out</Text>
            <Text style={s.modalSub}>
              Are you sure you want to end your professional session? You will
              need to re-authenticate to manage your clinic.
            </Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalConfirmBtn}
                onPress={() => {
                  setShowSignOutModal(false);
                  logout();
                }}
              >
                <Text style={s.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrame: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  scrollContent: { padding: 20 },
  hero: { marginBottom: 30 },
  badgeContainer: { marginBottom: 15 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  statusText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroMain: { flexDirection: "row", gap: 20, alignItems: "center" },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(64, 206, 243, 0.2)",
  },
  heroImg: { width: "100%", height: "100%", borderRadius: 60 },
  heroInfo: { flex: 1 },
  doctorName: {
    color: COLORS.onSurface,
    fontSize: 26,
    fontWeight: "900",
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -1,
  },
  specialtyText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
  },
  heroActions: { marginTop: 15 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.2)",
    alignSelf: "flex-start",
  },
  editBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statVal: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },

  sectionCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  sectionHeader: { marginBottom: 15 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
  },
  aboutText: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 14,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tagText: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" },

  actionGroup: { gap: 12 },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfo: { flex: 1 },
  actionTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  actionSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 32,
    alignItems: "center",
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    marginBottom: 8,
  },
  modalSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalCancelText: { color: COLORS.onSurface, fontWeight: "700" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.error,
  },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
