import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Clock,
  Play,
  FileText,
  Square,
  Activity,
  CheckCircle,
} from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { COLORS, RADIUS, FONT_FAMILY } from "@/lib/theme";
import type { Reservation } from "@/types/reservation";
import { Avatar } from "../ui/Avatar";

interface ReservationCardProps {
  reservation: Reservation;
  position: number;
  onPress?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

export function ReservationCard({
  reservation,
  position,
  onPress,
  onViewDetails,
  showActions = true,
}: ReservationCardProps) {
  const router = useRouter();
  const time =
    (reservation.expectedTime || reservation.dateTime) instanceof Date
      ? (reservation.expectedTime || reservation.dateTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : typeof (reservation.expectedTime || reservation.dateTime) === "string"
        ? new Date(reservation.expectedTime || reservation.dateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "--:--";

  const date =
    (reservation.expectedTime || reservation.dateTime) instanceof Date
      ? (reservation.expectedTime || reservation.dateTime).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      : typeof (reservation.expectedTime || reservation.dateTime) === "string"
        ? new Date(reservation.expectedTime || reservation.dateTime).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })
        : "";

  const isEmergency = reservation.isEmergency;
  const isInside = reservation.status === "inside";
  const patient = reservation.patient;
  const patientPhoto = patient?.user?.photoURL || reservation.patientPhotoURL;
  const patientName = patient?.user?.name || reservation.patientName;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "inside":
        return {
          label: "ONGOING",
          color: "#FFD700", // Gold
          bg: "rgba(255, 215, 0, 0.15)",
          icon: <Activity size={10} color="#FFD700" />,
        };
      case "done":
        return {
          label: "COMPLETED",
          color: "#00E676", // Catchy Green
          bg: "rgba(0, 230, 118, 0.15)",
          icon: <CheckCircle size={10} color="#00E676" />,
        };
      case "waiting":
        return {
          label: "WAITING",
          color: "#FFAB40", // Catchy Orange
          bg: "rgba(255, 171, 64, 0.15)",
          icon: <Clock size={10} color="#FFAB40" />,
        };
      case "pending":
      default:
        return {
          label: status === "pending" ? "PENDING" : status.toUpperCase(),
          color: "#FF5252", // Catchy Red
          bg: "rgba(255, 82, 82, 0.15)",
          icon: <Clock size={10} color="#FF5252" />,
        };
    }
  };

  const statusCfg = getStatusConfig(reservation.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.wrapper}
    >
      <GlassCard
        style={[styles.card, isEmergency && styles.cardEmergency]}
        variant="subtle"
        radius={RADIUS.xl}
        shadow={false}
      >
        <View style={styles.mainInfo}>
          {/* Patient Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Avatar uri={patientPhoto} name={patientName} size={50} />
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isInside
                      ? COLORS.tertiary
                      : COLORS.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.timeInfo}>
              <Text
                style={[
                  styles.timeText,
                  isEmergency && { color: COLORS.error },
                ]}
              >
                {time}
              </Text>
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.nameHeader}>
              <Text style={styles.patientName}>{patientName}</Text>
              <View style={styles.badgeRow}>
                {isEmergency && (
                  <View style={[styles.badge, styles.emergencyBadge]}>
                    <AlertTriangle size={10} color={COLORS.error} />
                    <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
                  </View>
                )}
                <View style={[styles.badge, styles.queueBadge]}>
                  <Text style={styles.queueBadgeText}>
                    #{position.toString().padStart(2, "0")}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                  {statusCfg.icon}
                  <Text
                    style={[styles.statusBadgeText, { color: statusCfg.color }]}
                  >
                    {statusCfg.label}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Age:</Text>
                <Text style={styles.metaValue}>{patient?.age || "24"}y</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Gender:</Text>
                <Text style={styles.metaValue}>
                  {patient?.gender || "Male"}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Type:</Text>
                <Text style={styles.metaValue}>
                  {reservation.status === "confirmed" ? "Follow-up" : "Initial"}
                </Text>
              </View>
            </View>

            <View style={styles.symptomsRow}>
              <FileText size={12} color="rgba(255,255,255,0.3)" />
              <Text style={styles.symptomsText} numberOfLines={1}>
                {reservation.symptoms ||
                  "Regular checkup and clinical evaluation."}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Bottom Row */}
        {showActions && (
          <View style={styles.actions}>
            {onViewDetails && (
              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={onViewDetails}
              >
                <FileText size={16} color={COLORS.primary} />
                <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
              </TouchableOpacity>
            )}
            {reservation.status !== "done" && (
              <TouchableOpacity
                style={[styles.primaryAction, isInside && styles.ongoingAction]}
                onPress={() =>
                  router.push(`/(doctor)/scan/${reservation.id}` as any)
                }
              >
                {isInside ? (
                  <Square size={16} color="#fff" fill="#fff" />
                ) : (
                  <Play size={16} color="#fff" fill="#fff" />
                )}
                <Text style={styles.primaryActionText}>{isInside ? "END SESSION" : "START SESSION"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 6 },
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  cardEmergency: {
    borderLeftColor: COLORS.error,
    backgroundColor: "rgba(255, 113, 108, 0.05)",
  },
  mainInfo: { flexDirection: "row", alignItems: "center", gap: 16 },

  profileSection: { alignItems: "center", minWidth: 70, gap: 8 },
  avatarContainer: { position: "relative" },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#070e1a",
  },
  timeInfo: { alignItems: "center" },
  timeText: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "700",
  },
  dateText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },

  detailsSection: { flex: 1, gap: 6, overflow: "hidden" },
  nameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  patientName: {
    color: COLORS.onSurface,
    fontSize: 17,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    flexShrink: 0,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyBadge: { backgroundColor: "rgba(255, 113, 108, 0.15)" },
  emergencyBadgeText: {
    color: COLORS.error,
    fontSize: 8,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.label,
  },
  queueBadge: { backgroundColor: "rgba(255,255,255,0.05)" },
  queueBadgeText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
  },
  metaValue: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    fontWeight: "600",
  },
  divider: { width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.1)" },

  symptomsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 8,
    borderRadius: 10,
  },
  symptomsText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    fontStyle: "italic",
    flex: 1,
  },

  actions: { 
    flexDirection: "row", 
    gap: 12, 
    alignItems: "center", 
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(64,206,243,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
    gap: 8,
  },
  viewDetailsText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ongoingAction: {
    backgroundColor: COLORS.tertiary,
    shadowColor: COLORS.tertiary,
  },
});
