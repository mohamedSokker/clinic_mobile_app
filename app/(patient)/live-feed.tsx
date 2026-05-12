import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { 
  getPaginatedReservationsForPatient, 
  cancelReservation 
} from "@/services/reservationService";
import { COLORS, FONT_FAMILY, GRADIENTS, RADIUS } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/stores/authStore";
import type { Reservation } from "@/types/reservation";

dayjs.extend(utc);
dayjs.extend(timezone);

const { width: SW } = Dimensions.get("window");

export default function LiveFeedScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams();
  const { profile } = useAuthStore();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReservations = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (!profile?.id) return;
    if (!isRefresh && (loadingMore || !hasMore)) return;

    if (isRefresh) {
      setRefreshing(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const data = await getPaginatedReservationsForPatient(pageNum, 10);
      
      if (isRefresh) {
        setReservations(data.reservations);
        setPage(1);
      } else {
        setReservations(prev => [...prev, ...data.reservations]);
        setPage(pageNum);
      }
      
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error("Fetch reservations error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load live feed.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [profile?.id, hasMore, loadingMore]);

  useEffect(() => {
    fetchReservations(1, true);
  }, [profile?.id]);

  const onRefresh = () => {
    fetchReservations(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchReservations(page + 1);
    }
  };

  const getReservationStatus = (res: Reservation) => {
    const resTime = dayjs(res.expectedTime || res.dateTime).local();
    const nowTime = dayjs();
    const appointmentTime = "00:00"; // Placeholder as in schedule.tsx

    const diffMins = resTime.diff(nowTime, "minute");
    const absMins = Math.abs(diffMins);
    const hours = Math.floor(absMins / 60);
    const mins = absMins % 60;
    const countdown = `${diffMins < 0 ? "-" : ""}${hours
      .toString()
      .padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

    switch (res.status) {
      case "done":
        return {
          status: "COMPLETED",
          time: appointmentTime,
          color: "#00E676",
          icon: "check-circle",
        };
      case "inside":
        return {
          status: "ONGOING",
          time: appointmentTime,
          color: "#FFD700",
          icon: "rotate-right",
        };
      case "waiting":
        return {
          status: "WAITING",
          time: appointmentTime,
          color: "#FFAB40",
          icon: "how-to-reg",
        };
      case "no-show":
        return {
          status: "MISSED",
          time: appointmentTime,
          color: "#FF5252",
          icon: "event-busy",
        };
      case "cancelled":
        return {
          status: "CANCELLED",
          time: appointmentTime,
          color: "rgba(255,255,255,0.3)",
          icon: "cancel",
        };
    }

    if (diffMins < 0) {
      return {
        status: "MISSED",
        time: appointmentTime,
        color: "#FF5252",
        icon: "event-busy",
      };
    }

    return {
      status: "PENDING",
      time: countdown,
      color: "#FF5252",
      icon: "schedule",
    };
  };

  const openMap = (res: Reservation) => {
    const lat = res.doctor?.latitude || res.lab?.latitude;
    const lng = res.doctor?.longitude || res.lab?.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Toast.show({
        type: "info",
        text1: "No Location Data",
        text2: "This clinic hasn't provided coordinates yet.",
      });
    }
  };

  const handleCancel = async (res: Reservation) => {
    try {
      await cancelReservation(res.id, profile?.id!, profile?.name!);
      Toast.show({
        type: "success",
        text1: "Cancelled",
        text2: "Your reservation has been cancelled.",
      });
      onRefresh();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel reservation.",
      });
    }
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const { status, color, icon } = getReservationStatus(item);
    const entityName =
      item.doctor?.doctorName ||
      item.lab?.labName ||
      item.doctorName ||
      item.labName;
    const entityClinic =
      item.doctor?.clinicName ||
      item.lab?.labName ||
      item.clinicName ||
      item.labName;
    const entityLocation =
      item.doctor?.location || item.lab?.location || "Main Branch";
    const entityPhoto =
      item.doctor?.user?.photoURL ||
      item.lab?.user?.photoURL ||
      item.doctor?.photoURL ||
      item.lab?.photoURL;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(patient)/reservation-details/${item.id}`)
        }
        style={[s.timelineRow, { borderLeftColor: color }]}
      >
        <View style={s.timelineLeft}>
          <View style={s.entityAvatarRing}>
            <Image
              source={
                entityPhoto
                  ? { uri: entityPhoto }
                  : require("@/assets/doctor_default.png")
              }
              style={s.entityAvatar}
            />
          </View>
        </View>

        <View style={s.timelineContent}>
          <View style={s.timelineHeader}>
            <Text style={s.timelineTitle} numberOfLines={1}>
              {entityName}
            </Text>
            <View
              style={[
                s.miniStatusBadge,
                { backgroundColor: `${color}15` },
              ]}
            >
              <Text style={[s.miniStatusText, { color }]}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={s.timelineClinic} numberOfLines={1}>
            {entityClinic} • {entityLocation}
          </Text>

          <View style={s.timelineDetailsRow}>
            <View style={s.detailItem}>
              <MaterialIcons
                name="event"
                size={12}
                color="rgba(255,255,255,0.4)"
              />
              <Text style={s.detailText}>
                {dayjs(item.dateTime).local().format("MMM D")} at{" "}
                {dayjs(item.dateTime).local().format("hh:mm A")}
              </Text>
            </View>
            {item.selectedTest && (
              <View style={s.detailItem}>
                <MaterialIcons
                  name="biotech"
                  size={12}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={s.detailText}>{item.selectedTest}</Text>
              </View>
            )}
          </View>

          {item.symptoms && (
            <View style={s.symptomsBox}>
              <Text style={s.symptomsLabel}>Symptoms:</Text>
              <Text style={s.symptomsText} numberOfLines={2}>
                {item.symptoms}
              </Text>
            </View>
          )}
        </View>

        <View style={s.timelineRight}>
          {(item.doctor?.latitude || item.lab?.latitude) && (
            <TouchableOpacity
              style={s.miniMapBtn}
              onPress={() => openMap(item)}
            >
              <MaterialIcons
                name="map"
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {status === "PENDING" && (
            <TouchableOpacity
              style={s.cancelIconBtn}
              onPress={() => handleCancel(item)}
            >
              <MaterialIcons
                name="close"
                size={18}
                color={COLORS.error}
              />
            </TouchableOpacity>
          )}
          <MaterialIcons
            name={icon as any}
            size={20}
            color={color}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerTextContainer}>
            <Text style={s.headerTitle}>Live Queue Tracker</Text>
            <Text style={s.headerSubtitle}>Complete monitoring of your appointments</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={reservations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            ListFooterComponent={() => 
              loadingMore ? (
                <View style={s.footerLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : null
            }
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
  list: { padding: 20, paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, alignItems: "center", marginTop: 100 },
  emptyText: { color: "rgba(255,255,255,0.3)", marginTop: 16, fontSize: 16 },
  footerLoading: { paddingVertical: 20, alignItems: "center" },

  // Timeline Row Styles (from schedule.tsx)
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(28, 38, 55, 0.4)",
    padding: 16,
    borderRadius: 24,
    borderLeftWidth: 4,
    gap: 12,
  },
  timelineLeft: {
    paddingTop: 4,
  },
  entityAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 2,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  entityAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  timelineTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timelineClinic: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  timelineDetailsRow: {
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
  },
  symptomsBox: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  symptomsLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  symptomsText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  timelineRight: {
    alignItems: "center",
    gap: 12,
    width: 32,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  cancelIconBtn: {
    padding: 4,
  },
  miniMapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
