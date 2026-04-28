import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  getReservationById,
  getReservationsForDoctor,
  getReservationsForLab,
} from "@/services/reservationService";
import { COLORS, FONT_FAMILY, GRADIENTS, RADIUS, SPACING } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import type { Reservation } from "@/types/reservation";

export default function ReservationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [targetRes, setTargetRes] = useState<Reservation | null>(null);
  const [queue, setQueue] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (!targetRes) return;
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [targetRes]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await getReservationById(id);
      setTargetRes(res);
      await fetchQueue(res);
    } catch (err) {
      console.error("Fetch reservation details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (baseRes?: Reservation) => {
    const res = baseRes || targetRes;
    if (!res) return;

    try {
      let data: Reservation[] = [];
      const date = new Date(res.dateTime);
      
      if (res.doctorId) {
        data = await getReservationsForDoctor(res.doctorId, date);
      } else if (res.labId) {
        data = await getReservationsForLab(res.labId, date);
      }
      
      // Sort by time/position
      const sorted = data.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setQueue(sorted);
    } catch (err) {
      console.error("Fetch queue error:", err);
    }
  };

  const calculateDuration = (res: Reservation) => {
    if (res.entryTime && res.exitTime) {
      const start = dayjs(res.entryTime);
      const end = dayjs(res.exitTime);
      const diff = end.diff(start, "minute");
      return `${diff} mins`;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!targetRes) {
    return (
      <View style={s.errorContainer}>
        <Text style={s.errorText}>Reservation not found</Text>
      </View>
    );
  }

  const entityName = targetRes.doctorName || targetRes.labName || "Medical Consultation";

  return (
    <View style={s.container}>
      <BackgroundDecor />
      <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <Text style={s.headerSubtitle}>Queue Tracker</Text>
            <Text style={s.headerTitle}>{entityName}</Text>
          </View>

          <View style={s.listContainer}>
            {queue.map((item, index) => {
              const isMine = item.id === targetRes.id;
              const duration = calculateDuration(item);
              const time = dayjs(item.dateTime).format("hh:mm A");
              const photo = item.patientPhotoURL || item.patient?.user?.photoURL;
              
              return (
                <View 
                  key={item.id} 
                  style={[
                    s.card, 
                    isMine && s.activeCard
                  ]}
                >
                  <View style={s.cardLeft}>
                    <View style={s.timeBox}>
                      <Text style={[s.timeText, isMine && s.activeText]}>{time}</Text>
                      {duration && <Text style={s.durationText}>{duration}</Text>}
                    </View>
                    <View style={s.lineBox}>
                      <View style={[s.dot, item.status === 'done' ? s.dotDone : (item.status === 'inside' ? s.dotActive : s.dotPending)]} />
                      {index < queue.length - 1 && <View style={s.line} />}
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <Image 
                      source={photo ? { uri: photo } : require("@/assets/doctor_default.png")} 
                      style={s.avatar}
                    />
                    <View style={s.info}>
                      <Text style={[s.patientName, isMine && s.activeText]}>
                        {item.patientName} {isMine && "(You)"}
                      </Text>
                      <View style={s.statusBadge}>
                        <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {isMine && (
                      <View style={s.turnIndicator}>
                        <MaterialIcons name="stars" size={24} color={COLORS.primary} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "done": return "#00E676";
    case "inside": return "#FFD700";
    case "cancelled": return "rgba(255,255,255,0.3)";
    default: return COLORS.primary;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#070e1a" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#070e1a" },
  errorText: { color: "#fff", fontSize: 16 },
  scroll: { padding: 20 },
  header: { marginBottom: 24 },
  headerSubtitle: { color: COLORS.primary, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  listContainer: { paddingLeft: 10 },
  card: {
    flexDirection: "row",
    marginBottom: 0,
    minHeight: 80,
  },
  activeCard: {
    backgroundColor: "rgba(64, 206, 243, 0.08)",
    borderRadius: 16,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  cardLeft: {
    width: 80,
    alignItems: "center",
  },
  timeBox: {
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  activeText: { color: COLORS.primary, fontWeight: "800" },
  durationText: { color: "#00E676", fontSize: 10, marginTop: 2, fontWeight: "700" },
  lineBox: {
    flex: 1,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#070e1a",
    zIndex: 1,
  },
  dotDone: { backgroundColor: "#00E676" },
  dotActive: { backgroundColor: "#FFD700" },
  dotPending: { backgroundColor: "rgba(255,255,255,0.2)" },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  turnIndicator: {
    paddingRight: 10,
  },
});
