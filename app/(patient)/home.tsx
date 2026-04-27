import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Search,
  Bell,
  Plus,
  ArrowRight,
  Video,
  FileText,
  Pill,
  History,
} from "lucide-react-native";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { getAllDoctors } from "@/services/doctorService";
import { COLORS, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery } from "@tanstack/react-query";

const { width: SW } = Dimensions.get("window");

// --- Filter Chips ---
const FILTERS = [
  { id: "all", label: "All Specialists" },
  { id: "ophthalmology", label: "Ophthalmology" },
  { id: "cardiology", label: "Cardiology" },
  { id: "neurology", label: "Neurology" },
  { id: "dermatology", label: "Dermatology" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [activeSpec, setActiveSpec] = useState("all");

  const {
    data: doctors = [],
    isLoading: loading,
    refetch,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => getAllDoctors(),
  });

  const filtered = useMemo(() => {
    let result = doctors;
    if (activeSpec !== "all") {
      result = result.filter((d) =>
        d.specialization.toLowerCase().includes(activeSpec.toLowerCase()),
      );
    }
    return result;
  }, [activeSpec, doctors]);

  const HomeHeader = useMemo(() => {
    return (
      <>
        {/* ── Hero Search Section ── */}
        <View style={s.heroSection}>
          <Text style={s.heroTitle}>
            Find the <Text style={s.heroTitleItalic}>precision</Text> care
            {"\n"}you need.
          </Text>
          <Text style={s.heroSub}>
            Advanced diagnostics and specialized medical experts at your
            fingertips.
          </Text>

          {/* Search bar — navigates to Explore */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(patient)/explore")}
            style={s.searchPill}
          >
            <Search size={20} color={COLORS.primary} style={s.searchIcon} />
            <View style={{ flex: 1 }}>
              <Text style={s.searchPlaceholder}>Search Doctors or Labs...</Text>
            </View>
            <View style={s.searchBtn}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.searchBtnGradient}
              >
                <Text style={s.searchBtnText}>Explore</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Quick Filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
          style={s.filtersContainer}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveSpec(f.id)}
              style={[s.filterChip, activeSpec === f.id && s.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.filterChipText,
                  activeSpec === f.id && s.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Recommended Section Header ── */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Recommended for You</Text>
            <Text style={s.sectionSub}>
              Based on your recent medical history
            </Text>
          </View>
          <TouchableOpacity
            style={s.viewAllBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/(patient)/explore")}
          >
            <Text style={s.viewAllText}>View all</Text>
            <ArrowRight size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </>
    );
  }, [activeSpec, router]);

  return (
    <View style={s.container}>
      {/* Ambient blobs */}
      <View style={s.blobTopRight} />
      <View style={s.blobBottomLeft} />
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={HomeHeader}
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <DoctorCard
                doctor={item}
                onPress={() =>
                  router.push(`/(patient)/doctor/${item.id}` as any)
                }
              />
            </View>
          )}
          ListEmptyComponent={() =>
            !loading ? (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Search size={32} color="rgba(255,255,255,0.05)" />
                </View>
                <Text style={s.emptyTitle}>No Specialists Found</Text>
                <Text style={s.emptySub}>
                  Refine your search to discover clinical experts.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={() => (
            /* ── Clinical Services Bento ── */
            <View style={s.bentoSection}>
              <Text style={s.bentoTitle}>Clinical Services</Text>

              {/* Large Diagnostics card */}
              <View style={s.bentoLarge}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
                  }}
                  style={s.bentoImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(7,14,26,0.5)", "#070e1a"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.bentoLargeContent}>
                  <Text style={s.bentoLargeTitle}>Advanced Diagnostics</Text>
                  <Text style={s.bentoLargeSub}>
                    Utilizing AI-driven screening and high-resolution imaging
                    for unprecedented accuracy.
                  </Text>
                  <TouchableOpacity
                    style={s.bentoLargeBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/(patient)/explore")}
                  >
                    <Text style={s.bentoLargeBtnText}>EXPLORE LABS</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Small tiles row */}
              <View style={s.bentoSmallRow}>
                <View
                  style={[s.bentoSmallWide, s.glassCard, s.borderLeftSecondary]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.bentoSmallTitle}>24/7 Virtual Care</Text>
                    <Text style={s.bentoSmallSub}>
                      Consult on-call via secure video link.
                    </Text>
                  </View>
                  <Video size={36} color={COLORS.secondary} />
                </View>

                <TouchableOpacity
                  style={[s.bentoSmallTile, s.glassCard]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(patient)/history")}
                >
                  <History
                    size={28}
                    color={COLORS.primary}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={s.bentoTileTitle}>Record{"\n"}Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.bentoSmallTile, s.glassCard]}
                  activeOpacity={0.85}
                >
                  <Pill
                    size={28}
                    color={COLORS.tertiary}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={s.bentoTileTitle}>Prescrip-{"\n"}tions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push("/(patient)/explore")}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.fabGradient}
        >
          <Plus size={28} color={COLORS.onPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  blobTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: COLORS.secondaryContainer,
    opacity: 0.12,
  },
  listContent: { paddingBottom: 140 },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 14,
  },
  heroTitle: {
    color: COLORS.onSurface,
    fontSize: 38,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  heroTitleItalic: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.display,
    fontStyle: "italic",
  },
  heroSub: {
    color: "#94a3b8",
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 24,
    maxWidth: SW * 0.78,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 38, 55, 0.8)",
    borderRadius: RADIUS.full,
    paddingLeft: 20,
    paddingRight: 6,
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: {
    color: "#64748b",
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
  },
  searchBtn: { borderRadius: RADIUS.full, overflow: "hidden" },
  searchBtnGradient: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  searchBtnText: {
    color: COLORS.onPrimary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.3,
    fontWeight: "700",
  },
  filtersContainer: { marginTop: 20, marginBottom: 12 },
  filtersRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(28, 38, 55, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.25)",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },
  filterChipTextActive: {
    color: COLORS.onPrimary,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  sectionSub: {
    color: "#94a3b8",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "600",
  },
  cardWrapper: { paddingHorizontal: 20, marginBottom: 24 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
  },
  emptySub: {
    color: "#94a3b8",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 22,
  },
  bentoSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
    paddingBottom: 8,
  },
  bentoTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    marginBottom: 4,
    fontWeight: "700",
  },
  bentoLarge: {
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "rgba(28,38,55,0.6)",
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.2)",
    height: 200,
  },
  bentoImage: { ...StyleSheet.absoluteFillObject, opacity: 0.28 },
  bentoLargeContent: { padding: 24, gap: 8 },
  bentoLargeTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  bentoLargeSub: {
    color: "#cbd5e1",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
    maxWidth: 260,
  },
  bentoLargeBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  bentoLargeBtnText: {
    color: COLORS.onPrimary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  bentoSmallRow: { flexDirection: "column", gap: 12 },
  glassCard: {
    backgroundColor: "rgba(28,38,55,0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(65,72,86,0.2)",
    padding: 20,
  },
  borderLeftSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  bentoSmallWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "space-between",
  },
  bentoSmallTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  bentoSmallSub: {
    color: "#94a3b8",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
    marginTop: 4,
  },
  bentoSmallTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  bentoTileTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.headline,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
