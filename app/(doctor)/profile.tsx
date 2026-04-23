import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut, CheckCircle } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { StarRating } from "@/components/ui/StarRating";
import { useAuthStore } from "@/stores/authStore";
import { getDoctorByUid } from "@/services/doctorService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  SPECIALIZATIONS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

export default function DoctorProfile() {
  const { user, logout } = useAuthStore();

  const { data: doctor } = useQuery({
    queryKey: ["doctor", user?.uid],
    queryFn: () => getDoctorByUid(user!.uid),
    enabled: !!user?.uid,
  });

  const handleLogout = () => {
    Alert.alert(
      "Secure Logout",
      "Are you sure you want to terminate your clinical session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Terminate Session", style: "destructive", onPress: logout },
      ],
    );
  };

  const specColor = doctor?.specialization
    ? (SPECIALIZATIONS.find(
        (s) => s.label.toLowerCase() === doctor.specialization.toLowerCase(),
      )?.color ?? COLORS.primary)
    : COLORS.primary;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Avatar
              uri={doctor?.photoURL}
              name={doctor?.doctorName}
              size={110}
              borderColor="rgba(64, 206, 243, 0.2)"
            />
            <View style={styles.nameBadgeWrapper}>
              <Text style={styles.headerLabel}>CLINICAL LEAD</Text>
              <Text style={styles.name}>
                {(doctor?.doctorName ?? "Doctor").toUpperCase()}
              </Text>
              <Text style={styles.clinic}>{doctor?.clinicName}</Text>
            </View>
            <View
              style={[
                styles.specBadge,
                { backgroundColor: "rgba(64, 206, 243, 0.05)" },
              ]}
            >
              <Text style={styles.specText}>
                {doctor?.specialization?.toUpperCase() || "GENERALIST"}
              </Text>
            </View>
            {doctor && (
              <StarRating
                rating={doctor.rating || 0}
                reviewCount={doctor.reviewCount || 0}
                size={14}
              />
            )}
          </View>

          {/* Subscription Section */}
          {doctor?.subscriptionActive && (
            <GlassCard
              style={styles.subCard}
              variant="primary"
              radius={RADIUS.xl}
            >
              <CheckCircle size={16} color={COLORS.primary} />
              <Text style={styles.subText}>PLATFORM LICENSE ACTIVE</Text>
            </GlassCard>
          )}

          {/* Info Section */}
          <GlassCard
            style={styles.infoCard}
            variant="subtle"
            radius={RADIUS.xl}
            shadow={true}
          >
            {[
              { label: "PRACTICE LOCATION", value: doctor?.location ?? "—" },
              { label: "CONTACT REFERENCE", value: doctor?.mobile ?? "—" },
              {
                label: "CONSULTATION FEE",
                value: `${doctor?.visitCost ?? 0} EGP`,
              },
              {
                label: "SESSION DURATION",
                value: `${doctor?.slotDurationMinutes ?? 30} MINS`,
              },
              {
                label: "OPERATIONAL DAYS",
                value: doctor?.workingDays?.join(", ").toUpperCase() ?? "—",
              },
            ].map((p, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>{p.label}</Text>
                  <Text style={styles.infoValue}>{p.value}</Text>
                </View>
              </View>
            ))}
          </GlassCard>

          {/* Logout Section */}
          <View style={styles.footer}>
            <GradientButton
              onPress={handleLogout}
              label="Revoke Access"
              variant="ghost"
              size="lg"
              style={{ marginTop: SPACING.xl }}
            />
            <Text style={styles.versionText}>
              v2.4.0 • Practice Hub Precision
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.xl, paddingBottom: 60, gap: SPACING.lg },
  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
    gap: SPACING.lg,
  },
  nameBadgeWrapper: { alignItems: "center", gap: 4 },
  headerLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  name: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE["3xl"],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  clinic: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.6,
  },
  specBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  specText: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },

  subCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  subText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.label,
    fontSize: 10,
    letterSpacing: 1,
  },

  infoCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  infoRow: { paddingVertical: SPACING.xs },
  infoText: { flex: 1, gap: 2 },
  infoLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    opacity: 0.5,
  },
  infoValue: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.title,
  },

  footer: { alignItems: "center", gap: SPACING.md, paddingBottom: 20 },
  versionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    opacity: 0.3,
    letterSpacing: 1,
  },
});
