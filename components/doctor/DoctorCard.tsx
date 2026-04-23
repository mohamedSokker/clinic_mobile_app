import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Building2, Star } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { COLORS, RADIUS, FONT_FAMILY } from "@/lib/theme";
import type { Doctor } from "@/types/doctor";

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
}

// Maps specialization to a badge color, matching HTML's design
const BADGE_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  ophthalmology: {
    bg: "rgba(64,206,243,0.12)",
    text: "#40cef3",
    label: "Vitreous Specialist",
  },
  cardiology: {
    bg: "rgba(197,126,255,0.12)",
    text: "#c57eff",
    label: "Lead Cardiologist",
  },
  neurology: {
    bg: "rgba(94,216,255,0.12)",
    text: "#5ed8ff",
    label: "Neuro-Specialist",
  },
  dermatology: {
    bg: "rgba(245,158,11,0.12)",
    text: "#F59E0B",
    label: "Dermatologist",
  },
  general: {
    bg: "rgba(64,206,243,0.12)",
    text: "#40cef3",
    label: "Senior Surgeon",
  },
};

function getBadge(spec: string) {
  const key = spec.toLowerCase();
  return (
    BADGE_COLORS[key] ?? {
      bg: "rgba(64,206,243,0.12)",
      text: "#40cef3",
      label: spec,
    }
  );
}

export function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  const badge = getBadge(doctor.specialization);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={s.card}>
      {/* Photo + Badge + Name */}
      <View style={s.topRow}>
        <Avatar
          uri={doctor.photoURL}
          name={doctor.doctorName}
          size={96}
          borderColor="rgba(255,255,255,0.05)"
        />
        <View style={s.info}>
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>
              {badge.label.toUpperCase()}
            </Text>
          </View>
          <Text style={s.name}>{doctor.doctorName}</Text>
          <Text style={s.specialty}>{doctor.specialization}</Text>
        </View>
      </View>

      {/* Meta rows */}
      <View style={s.metaBlock}>
        <View style={s.metaRow}>
          <Building2 size={18} color={COLORS.primary} />
          <Text style={s.metaText}>{doctor.clinicName}</Text>
        </View>
        <View style={s.metaRow}>
          <Star size={18} color={COLORS.primary} fill={COLORS.primary} />
          <Text style={s.metaText}>
            {doctor.rating.toFixed(1)}
            {"  "}
            <Text style={s.reviewCount}>({doctor.reviewCount} reviews)</Text>
          </Text>
        </View>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        onPress={onPress}
        style={s.bookBtn}
        activeOpacity={0.85}
      >
        <Text style={s.bookBtnText}>Book Consultation</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(28,38,55,0.6)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.2)",
    // glass shadow
    shadowColor: "#40cef3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    // elevation: 6,
  },
  topRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  info: { flex: 1, paddingTop: 4, gap: 4 },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  badgeText: { fontSize: 9, fontFamily: FONT_FAMILY.label, letterSpacing: 1.2 },

  name: {
    color: COLORS.onSurface,
    fontSize: 19,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  specialty: {
    color: "rgba(164,171,188,0.8)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },

  metaBlock: { gap: 14, marginBottom: 24 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaText: { color: "#cbd5e1", fontSize: 14, fontFamily: FONT_FAMILY.body },
  reviewCount: { color: "#64748b", fontSize: 14, fontFamily: FONT_FAMILY.body },

  bookBtn: {
    backgroundColor: "#1c2637",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
  },
  bookBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.3,
  },
});
