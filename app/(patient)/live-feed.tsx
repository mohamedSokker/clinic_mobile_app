import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { getLiveClinicQueue } from "@/services/reservationService";
import { COLORS, FONT_FAMILY, GRADIENTS, RADIUS } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/stores/authStore";

export default function LiveFeedScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams();
  const { profile } = useAuthStore();
  const [queue, setQueue] = useState<any[]>([]);
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [myPatientId, setMyPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [doctorId]);

  const fetchData = async () => {
    try {
      const data = await getLiveClinicQueue(doctorId as string);
      setQueue(data.queue);
      setClinicInfo(data.clinicInfo);
      setMyPatientId(data.myPatientId);
    } catch (err) {
      console.error("Fetch live queue error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load live queue.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (res: any) => {
    switch (res.status) {
      case "done":
        return {
          label: "COMPLETED",
          color: "#00E676", // Green
          icon: "check-circle",
        };
      case "inside":
        return {
          label: "ONGOING",
          color: "#FFD700", // Gold
          icon: "rotate-right",
        };
      case "waiting":
        return {
          label: "WAITING",
          color: "#FFAB40", // Orange
          icon: "how-to-reg",
        };
      case "no-show":
        return {
          label: "MISSED",
          color: "#FF5252", // Red
          icon: "event-busy",
        };
      case "cancelled":
        return {
          label: "CANCELLED",
          color: "rgba(255,255,255,0.3)",
          icon: "cancel",
        };
      default:
        return {
          label: "PENDING",
          color: "#FF5252", // Red
          icon: "schedule",
        };
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const { color, icon, label } = getStatusStyle(item);
    const isMe = item.patientId === myPatientId;
    const isDone = item.status === "done";
    const queuePos = item.queuePosition.toString().padStart(2, "0");

    return (
      <View style={[s.card, { borderLeftColor: color }, isMe && s.cardMe]}>
        <View style={s.cardBody}>
          <View style={s.headerRow}>
            <Text style={s.name} numberOfLines={1}>
              {isMe ? "You (Patient)" : `Patient #${queuePos}`}
            </Text>
            <View style={[s.badge, { backgroundColor: `${color}15` }]}>
              <Text style={[s.badgeText, { color }]}>{label}</Text>
            </View>
          </View>

          <View style={s.timeRow}>
            <MaterialIcons
              name="event"
              size={14}
              color="rgba(255,255,255,0.4)"
            />
            <Text style={s.timeText}>
              {item.isEmergency
                ? "Emergency Walk-in"
                : `Est. ${dayjs(item.dateTime).local().format("hh:mm A")}`}
            </Text>
          </View>

          {isDone && item.durationMinutes != null && (
            <View style={[s.timeRow, { marginTop: 6 }]}>
              <MaterialIcons
                name="timer"
                size={14}
                color="rgba(255,255,255,0.4)"
              />
              <Text style={s.timeText}>
                Duration: {item.durationMinutes} mins
              </Text>
            </View>
          )}
        </View>
        <View style={s.cardRight}>
          <MaterialIcons name={icon as any} size={24} color={color} />
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerTextContainer}>
            <Text style={s.headerTitle}>Live Queue Tracker</Text>
            {clinicInfo?.doctorName && (
              <Text style={s.headerSubtitle}>{clinicInfo.doctorName}</Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={queue}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={() => (
              <View style={s.empty}>
                <MaterialIcons
                  name="history"
                  size={64}
                  color="rgba(255,255,255,0.1)"
                />
                <Text style={s.emptyText}>No active queue found</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  cardMe: {
    backgroundColor: "rgba(64,206,243,0.08)",
  },
  cardBody: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: "900" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  cardRight: { marginLeft: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, alignItems: "center", marginTop: 100 },
  emptyText: { color: "rgba(255,255,255,0.3)", marginTop: 16, fontSize: 16 },
});
