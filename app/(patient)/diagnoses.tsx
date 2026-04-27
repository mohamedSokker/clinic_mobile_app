import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Activity,
  History,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Stethoscope,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { getDiagnosesForPatient } from "@/services/diagnosisService";
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

export default function DiagnosesScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [page, setPage] = React.useState(1);
  const [allDiagnoses, setAllDiagnoses] = React.useState<any[]>([]);

  const { data: diagnosesData, isLoading } = useQuery({
    queryKey: ["diagnoses", profile?.uid, page],
    queryFn: () => getDiagnosesForPatient(page, 3),
    enabled: !!profile?.uid,
  });

  React.useEffect(() => {
    if (diagnosesData?.diagnoses) {
      if (page === 1) {
        setAllDiagnoses(diagnosesData.diagnoses);
      } else {
        setAllDiagnoses((prev) => [...prev, ...diagnosesData.diagnoses]);
      }
    }
  }, [diagnosesData]);

  const hasMore = diagnosesData ? page < diagnosesData.totalPages : false;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1 }}>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.intro}>
            <Text style={s.introTitle}>Clinical History</Text>
            <Text style={s.introSub}>
              Complete log of your active and past clinical conditions.
            </Text>
          </View>

          {isLoading && page === 1 ? (
            <Text style={s.statusText}>Loading your records...</Text>
          ) : allDiagnoses.length === 0 ? (
            <GlassCard style={s.emptyCard}>
              <History size={48} color="rgba(164, 171, 188, 0.2)" />
              <Text style={s.emptyText}>No clinical records found yet.</Text>
            </GlassCard>
          ) : (
            <View style={s.list}>
              {allDiagnoses.map((d: any, i: number) => (
                <GlassCard key={i} style={s.diagCard}>
                  <View style={s.cardHeader}>
                    <View style={s.iconWrap}>
                      <Activity size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.diagName}>
                        {d.notes?.split("\n")[0] || "General Consultation"}
                      </Text>
                      <Text style={s.diagDate}>
                        {format(new Date(d.visitDate), "MMMM dd, yyyy")}
                      </Text>
                    </View>
                    <View style={s.statusTag}>
                      <Text style={s.statusTextTag}>STABLE</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <Text style={s.notesTitle}>PHYSICIAN NOTES</Text>
                    <Text style={s.notesText}>
                      {d.notes || "No detailed notes provided for this visit."}
                    </Text>

                    <View style={s.metaRow}>
                      <View style={s.metaItem}>
                        <Stethoscope size={14} color="#94a3b8" />
                        <Text style={s.metaText}>
                          Dr. {d.doctor?.doctorName || "Specialist"}
                        </Text>
                      </View>
                      <View style={s.metaItem}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text style={s.metaText}>
                          VC-{d.id.slice(-6).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={s.detailBtn}>
                    <Text style={s.detailBtnText}>View Full Report</Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </GlassCard>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={s.loadMoreBtn}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={isLoading}
                >
                  <Text style={s.loadMoreText}>
                    {isLoading ? "Loading..." : "Load More Records"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
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
  list: { gap: 20 },
  diagCard: { borderRadius: 24, padding: 20 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(64,206,243,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  diagName: { color: COLORS.onSurface, fontSize: 18, fontWeight: "700" },
  diagDate: { color: "rgba(164, 171, 188, 0.5)", fontSize: 13, marginTop: 2 },
  statusTag: {
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextTag: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
  cardBody: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  notesTitle: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  notesText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "rgba(164, 171, 188, 0.6)", fontSize: 12 },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  detailBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  statusText: {
    color: "rgba(164, 171, 188, 0.5)",
    textAlign: "center",
    marginTop: 40,
  },
  emptyCard: { alignItems: "center", padding: 60, borderRadius: 30, gap: 20 },
  emptyText: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 16,
    fontWeight: "600",
  },
  loadMoreBtn: {
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
