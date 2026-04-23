import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FileText, Download, Sparkles } from "lucide-react-native";
import { HistoryCard } from "@/components/patient/HistoryCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/stores/authStore";
import { getDiagnosesForPatient } from "@/services/diagnosisService";
import { COLORS, SPACING, FONT_FAMILY, GRADIENTS, RADIUS } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

export default function HistoryScreen() {
  const { user } = useAuthStore();

  const {
    data: diagnoses = [],
    isLoading: loading,
    refetch,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["diagnoses", user?.uid],
    queryFn: () => getDiagnosesForPatient(user!.uid),
    enabled: !!user?.uid,
  });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={diagnoses}
          keyExtractor={(d) => d.id}
          ListHeaderComponent={() => (
            <>
              {/* AppBar */}
              <View style={s.appBar}>
                <Text style={s.appBarLabel}>VITREOUS CLINIC</Text>
                <Text style={s.appBarTitle}>Clinical History</Text>
                <Text style={s.appBarSub}>
                  A comprehensive, immutable ledger of your diagnostic journey
                  and biometric data.
                </Text>
              </View>

              {/* Summary snapshot */}
              <View style={s.summaryContainer}>
                <GlassCard
                  style={s.summaryCard}
                  variant="primary"
                  radius={RADIUS.xl}
                >
                  <View style={s.summaryStats}>
                    {[
                      {
                        value: diagnoses.length.toString().padStart(2, "0"),
                        label: "VISITS",
                      },
                      {
                        value: diagnoses
                          .reduce(
                            (acc, d) =>
                              acc + ((d as any).analysisFiles?.length ?? 0),
                            0,
                          )
                          .toString()
                          .padStart(2, "0"),
                        label: "FILES",
                      },
                      { value: "01", label: "ACTIVE" },
                    ].map((stat, i) => (
                      <View key={i} style={s.summaryStat}>
                        {i > 0 && <View style={s.summaryDivider} />}
                        <View style={s.statInner}>
                          <Text style={s.statValue}>{stat.value}</Text>
                          <Text style={s.statLabel}>{stat.label}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </View>

              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>CHRONOLOGICAL PIPELINE</Text>
              </View>
            </>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: SPACING.xl, marginBottom: 8 }}>
              <HistoryCard diagnosis={item} onPress={() => {}} />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={() =>
            !loading ? (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <FileText size={32} color="rgba(255,255,255,0.05)" />
                </View>
                <Text style={s.emptyText}>Repository Initialized</Text>
                <Text style={s.emptySub}>
                  Your diagnostic history will appear here after your first
                  consultation.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={() => (
            <View style={s.footer}>
              {/* Data Export */}
              <View style={s.footerSection}>
                <Text style={s.sectionTitle}>Patient Summary</Text>
                <GlassCard
                  style={s.exportCard}
                  variant="subtle"
                  radius={RADIUS.xl}
                >
                  <View style={s.exportRow}>
                    <Download size={20} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.exportTitle}>Data Export</Text>
                      <Text style={s.exportSub}>
                        Export your full medical ledger in encrypted
                        HIPAA-compliant format.
                      </Text>
                    </View>
                  </View>
                  <GradientButton
                    label="Export Records"
                    variant="secondary"
                    size="md"
                    onPress={() => {}}
                  />
                </GlassCard>
              </View>

              {/* Premium Insights */}
              <View style={s.footerSection}>
                <GlassCard
                  style={s.insightsCard}
                  variant="subtle"
                  radius={RADIUS.xl}
                >
                  <LinearGradient
                    colors={["rgba(64,206,243,0.08)", "rgba(197,126,255,0.08)"]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Sparkles size={24} color={COLORS.secondary} />
                  <Text style={s.insightsTitle}>Premium Wellness Insights</Text>
                  <Text style={s.insightsSub}>
                    Unlock AI-driven analysis of your biometric trends.
                  </Text>
                  <TouchableOpacity style={s.insightsBtn}>
                    <Text style={s.insightsBtnText}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 6,
  },
  appBarLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  appBarTitle: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  appBarSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
  },
  summaryContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: 20,
    marginBottom: 24,
  },
  summaryCard: { padding: 20, backgroundColor: "rgba(64,206,243,0.05)" },
  summaryStats: { flexDirection: "row", alignItems: "center" },
  summaryStat: { flexDirection: "row", flex: 1, alignItems: "center" },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 16,
  },
  statInner: { flex: 1, alignItems: "center", gap: 2 },
  statValue: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.display,
  },
  statLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  sectionHeader: { paddingHorizontal: SPACING.xl, marginBottom: 16 },
  sectionTitle: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
  },
  emptySub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: { paddingHorizontal: SPACING.xl, gap: 16, paddingTop: 32 },
  footerSection: { gap: 12 },
  exportCard: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 16,
  },
  exportRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  exportTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
  },
  exportSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },
  insightsCard: {
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 10,
    overflow: "hidden",
  },
  insightsTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
  },
  insightsSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
  },
  insightsBtn: {
    backgroundColor: "rgba(197,126,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  insightsBtnText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
  },
});
