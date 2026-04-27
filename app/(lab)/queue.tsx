import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Settings2,
  MoreVertical,
  Clock,
  Users,
  RefreshCcw,
  CheckCircle,
  Activity,
  ArrowRight,
  Plus,
  FlaskConical,
} from "lucide-react-native";
import { getLabQueue } from "@/services/labService";
import { COLORS, RADIUS, FONT_FAMILY, GRADIENTS, SPACING } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { format } from "date-fns";

const { width: SW } = Dimensions.get("window");

export default function LabQueueScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["labQueue"],
    queryFn: getLabQueue,
    refetchInterval: 10000, // Real-time operations as requested
  });

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!data) return null;

  const { labInfo, stats, queue } = data;

  const filteredQueue = queue.filter((item: any) =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      >

          {/* Stats Bento Grid */}
          <View style={s.statsGrid}>
            <GlassCard style={s.statCard}>
              <View style={s.statIconWrap}>
                <Clock size={24} color={COLORS.primary} />
                <Text style={s.statLabel}>TOTAL</Text>
              </View>
              <Text style={s.statValue}>{stats.totalActive}</Text>
              <Text style={s.statSub}>Active Entries</Text>
            </GlassCard>

            <GlassCard style={s.statCard}>
              <View style={s.statIconWrap}>
                <Clock size={24} color="#facc15" />
                <Text style={s.statLabel}>PENDING</Text>
              </View>
              <Text style={[s.statValue, { color: "#facc15" }]}>
                {stats.pending}
              </Text>
              <Text style={s.statSub}>Awaiting Triage</Text>
            </GlassCard>

            <GlassCard style={[s.statCard, s.statCardHighlight]}>
              <View style={s.statIconWrap}>
                <RefreshCcw size={24} color={COLORS.primary} />
                <Text style={s.statLabel}>IN PROGRESS</Text>
              </View>
              <Text style={[s.statValue, { color: COLORS.primary }]}>
                {stats.inProgress}
              </Text>
              <Text style={s.statSub}>Lab Processing</Text>
            </GlassCard>

            <GlassCard style={s.statCard}>
              <View style={s.statIconWrap}>
                <CheckCircle size={24} color="#10b981" />
                <Text style={s.statLabel}>COMPLETED</Text>
              </View>
              <Text style={[s.statValue, { color: "#10b981" }]}>
                {stats.completedToday}
              </Text>
              <Text style={s.statSub}>Reported Today</Text>
            </GlassCard>
          </View>

          {/* Search & Filter */}
          <View style={s.searchRow}>
            <Text style={s.sectionTitle}>Active Queue</Text>
            <View style={s.searchActions}>
              <View style={s.searchBar}>
                <Search size={18} color="rgba(255,255,255,0.3)" />
                <TextInput
                  placeholder="Filter by patient..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={s.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={s.filterBtn}>
                <Settings2 size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Queue List */}
          <View style={s.queueList}>
            {filteredQueue.map((item: any, idx: number) => (
              <View
                key={item.id}
                style={[s.queueItem, idx % 2 === 1 && s.queueItemAlt]}
              >
                <View style={s.queueItemHeader}>
                  <View style={s.patientInfo}>
                    <Avatar
                      uri={item.patientPhoto}
                      name={item.patientName}
                      size={44}
                    />
                    <View>
                      <Text style={s.patientName}>{item.patientName}</Text>
                      <Text style={s.patientId}>{item.patientId}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <MoreVertical size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>

                <View style={s.tagRow}>
                  {item.tags?.map((tag: string, tidx: number) => (
                    <View key={tidx} style={s.tag}>
                      <Text style={s.tagText}>{tag.toUpperCase()}</Text>
                    </View>
                  )) || (
                    <View style={s.tag}>
                      <Text style={s.tagText}>
                        {item.selectedTest?.toUpperCase() || "GENERAL"}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={s.queueItemFooter}>
                  <View style={s.timeInfo}>
                    <Text style={s.timeText}>
                      {format(new Date(item.time), "HH:mm a")}
                    </Text>
                    <Text style={s.expText}>
                      Exp:{" "}
                      {item.expectedTime
                        ? format(new Date(item.expectedTime), "HH:mm a")
                        : "--:--"}
                    </Text>
                  </View>
                  <View style={s.statusBadge}>
                    <View
                      style={[
                        s.statusDot,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    />
                    <Text
                      style={[
                        s.statusText,
                        { color: getStatusColor(item.status) },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom Dashboards */}
          <View style={s.bottomDash}>
            <GlassCard style={s.matrixCard}>
              <View style={s.cardHeader}>
                <Activity size={20} color={COLORS.primary} />
                <Text style={s.cardTitle}>Lab Efficiency Matrix</Text>
              </View>
              <View style={s.matrixRow}>
                <View style={s.matrixLabelWrap}>
                  <Text style={s.matrixLabel}>Diagnostics Accuracy</Text>
                  <Text style={s.matrixValue}>{labInfo.accuracy}%</Text>
                </View>
                <View style={s.progressBar}>
                  <View
                    style={[s.progressFill, { width: `${labInfo.accuracy}%` }]}
                  />
                </View>
              </View>
              <View style={s.matrixRow}>
                <View style={s.matrixLabelWrap}>
                  <Text style={s.matrixLabel}>Avg. Turnaround Time</Text>
                  <Text style={s.matrixValue}>
                    {labInfo.avgTurnaroundTime}m
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: "85%" }]} />
                </View>
              </View>
            </GlassCard>

            <GlassCard style={s.crewCard}>
              <Text style={s.cardTitle}>Technician Status</Text>
              <Text style={s.crewQuote}>
                "Vitreous precision is the hallmark of modern diagnostics."
              </Text>
              <View style={s.crewAvatars}>
                {labInfo.crew.map((member: any, midx: number) => (
                  <View
                    key={member.id}
                    style={[
                      s.crewAvatarWrap,
                      { zIndex: 10 - midx, marginLeft: midx === 0 ? 0 : -15 },
                    ]}
                  >
                    <Avatar
                      uri={member.photoURL}
                      name={member.name}
                      size={44}
                      borderColor="#070e1a"
                    />
                  </View>
                ))}
                {labInfo.crew.length > 3 && (
                  <View style={[s.crewMore, { marginLeft: -15, zIndex: 0 }]}>
                    <Text style={s.crewMoreText}>
                      +{labInfo.crew.length - 3}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={s.manageBtn}>
                <Text style={s.manageBtnText}>Manage Lab Crew</Text>
                <ArrowRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </GlassCard>
          </View>
        </ScrollView>
      </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "inside":
    case "in progress":
      return COLORS.primary;
    case "pending":
    case "waiting":
      return "#facc15";
    case "done":
    case "completed":
      return "#10b981";
    default:
      return "rgba(255,255,255,0.3)";
  }
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    marginTop: 40,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  headerLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    marginTop: 8,
    lineHeight: 20,
  },
  newBtn: {
    // width: 50,
    // height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    cursor: "pointer",
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 32 },
  statCard: { width: (SW - 52) / 2, padding: 16, borderRadius: 20 },
  statCardHighlight: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(64,206,243,0.3)",
  },
  statIconWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "900",
  },
  statSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  searchRow: { marginTop: 40, gap: 16 },
  sectionTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  searchActions: { flexDirection: "row", gap: 12 },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  queueList: { marginTop: 24, gap: 12 },
  queueItem: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  queueItemAlt: { backgroundColor: "rgba(255,255,255,0.04)" },
  queueItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  patientName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  patientId: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    marginTop: 2,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(64,206,243,0.05)",
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
  },
  queueItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
  },
  timeInfo: { gap: 4 },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "500",
  },
  expText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bottomDash: { marginTop: 48, gap: 24 },
  matrixCard: { padding: 24, borderRadius: 24 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  matrixRow: { marginBottom: 20 },
  matrixLabelWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matrixLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },
  matrixValue: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  crewCard: { padding: 24, borderRadius: 24 },
  crewQuote: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    fontStyle: "italic",
    marginTop: 8,
  },
  crewAvatars: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  crewAvatarWrap: { borderRadius: 22, overflow: "hidden" },
  crewMore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#070e1a",
  },
  crewMoreText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  manageBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
  },
});
