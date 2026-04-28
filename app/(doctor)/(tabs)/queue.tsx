import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Filter, Search } from "lucide-react-native";
import { ReservationCard } from "@/components/doctor/ReservationCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { getPaginatedReservationsForDoctor } from "@/services/reservationService";
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { useInfiniteQuery } from "@tanstack/react-query";

export default function DoctorQueue() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["doctor-queue", "paginated"],
    queryFn: ({ pageParam = 1 }) =>
      getPaginatedReservationsForDoctor(new Date(), pageParam, 3),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const reservations = data?.pages.flatMap((page) => page.reservations) || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReservationCard
            reservation={item}
            position={item.queuePosition}
            onPress={() =>
              router.push(`/(doctor)/patient/${item.patientId}?reservationId=${item.id}` as any)
            }
            onViewDetails={() =>
              router.push(`/(doctor)/patient-details/${item.patientId}` as any)
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.loader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : hasNextPage ? (
            <TouchableOpacity onPress={() => fetchNextPage()} style={styles.loader}>
              <Text style={{ color: COLORS.primary, fontFamily: FONT_FAMILY.label }}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={() =>
          !isLoading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No patients in queue</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.display,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
  },
  headerActions: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { padding: SPACING.xl, paddingBottom: 100 },
  loader: { paddingVertical: 20 },
  empty: { paddingVertical: 100, alignItems: "center" },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontFamily: FONT_FAMILY.body,
    fontSize: 16,
  },
});
