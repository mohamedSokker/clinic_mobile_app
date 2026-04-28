import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Check,
  Calendar,
  FileText,
  Activity as ActivityIcon,
  ChevronLeft,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { COLORS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { getPatientActivityLog } from "@/services/doctorService";

export default function RecentActivityScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();

  const fetchActivity = async ({ pageParam = 1 }) => {
    return getPatientActivityLog(patientId, pageParam, 10);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["patient-activity", patientId],
      queryFn: fetchActivity,
      getNextPageParam: (lastPage) => {
        if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
        return undefined;
      },
      enabled: !!patientId,
      initialPageParam: 1,
    });

  const allEvents = data?.pages.flatMap((page) => page.events) || [];

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1 }}>


        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: 40 }}
            />
          ) : allEvents.length === 0 ? (
            <GlassCard style={s.emptyCard}>
              <ActivityIcon size={48} color="rgba(164, 171, 188, 0.2)" />
              <Text style={s.emptyText}>No activity records found yet.</Text>
            </GlassCard>
          ) : (
            <FlatList
              data={allEvents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={
                <View style={s.intro}>
                  <Text style={s.introTitle}>Recent Activity</Text>
                  <Text style={s.introSub}>
                    The patient's complete clinical journey and interaction history.
                  </Text>
                </View>
              }
              renderItem={({ item: e, index: i }) => (
                <View key={e.id || i} style={s.timelineItem}>
                  <View style={s.timelineThread}>
                    <View
                      style={[
                        s.threadLine,
                        i === 0 && s.threadLineFirst,
                        i === allEvents.length - 1 &&
                          !hasNextPage &&
                          s.threadLineLast,
                      ]}
                    />
                    <View
                      style={[
                        s.threadNode,
                        e.type === "consultation" && s.threadNodeActive,
                      ]}
                    >
                      {e.type === "consultation" ? (
                        <Check size={12} color={COLORS.onPrimary} />
                      ) : e.type === "reservation" ? (
                        <Calendar
                          size={12}
                          color={
                            e.status === "cancelled"
                              ? COLORS.error
                              : COLORS.primary
                          }
                        />
                      ) : (
                        <FileText size={10} color="#94a3b8" />
                      )}
                    </View>
                  </View>
                  <View style={s.timelineContent}>
                    <Text
                      style={[
                        s.timelineDate,
                        e.type === "consultation" && { color: COLORS.primary },
                      ]}
                    >
                      {formatDistanceToNow(new Date(e.date), {
                        addSuffix: true,
                      }).toUpperCase()}
                    </Text>
                    <Text style={s.timelineTitle}>{e.title}</Text>
                    <Text style={s.timelineSub}>{e.sub}</Text>
                    <Text style={s.fullDate}>
                      {format(new Date(e.date), "MMMM dd, yyyy • hh:mm a")}
                    </Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                <View style={{ paddingVertical: 20 }}>
                  {isFetchingNextPage ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : hasNextPage ? (
                    <TouchableOpacity
                      style={s.loadMoreManual}
                      onPress={() => fetchNextPage()}
                    >
                      <Text style={s.loadMoreManualText}>LOAD MORE</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.endText}>End of clinical history</Text>
                  )}
                </View>
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },

  scrollContent: { padding: 24, paddingBottom: 100 },
  intro: { marginBottom: 32 },
  introTitle: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  introSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
  },
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: "row", gap: 20, marginBottom: 30 },
  timelineThread: { alignItems: "center", width: 24 },
  threadLine: {
    position: "absolute",
    width: 2,
    height: "140%",
    backgroundColor: "rgba(255,255,255,0.05)",
    top: 0,
  },
  threadLineFirst: { top: 24 },
  threadLineLast: { height: 24 },
  threadNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1a2433",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  threadNodeActive: {
    backgroundColor: COLORS.primary,
    borderColor: "rgba(64,206,243,0.3)",
  },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineDate: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  timelineTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  timelineSub: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 13,
    lineHeight: 18,
  },
  fullDate: {
    color: "rgba(164, 171, 188, 0.3)",
    fontSize: 11,
    marginTop: 8,
  },
  emptyCard: { alignItems: "center", padding: 60, borderRadius: 30, gap: 20 },
  emptyText: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 16,
    fontWeight: "600",
  },
  loadMoreManual: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginTop: 8,
  },
  loadMoreManualText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  endText: {
    color: "rgba(164, 171, 188, 0.3)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
});
