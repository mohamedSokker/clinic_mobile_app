import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Syringe,
  FileText,
  X,
  Search,
  CheckCircle2,
} from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/stores/authStore";
import { getDoctorByUid } from "@/services/doctorService";
import {
  getDiagnosisByReservation,
  createDiagnosis,
  updateDiagnosis,
} from "@/services/diagnosisService";
import {
  getReservationById,
  getReservationsForPatient,
  updateReservationStatus,
} from "@/services/reservationService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import type { Diagnosis, Vaccine } from "@/types/diagnosis";
import Toast from "react-native-toast-message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const DIAGNOSIS_SUGGESTIONS = [
  "Hypertension",
  "Diabetes Mellitus Type 2",
  "Acute Pharyngitis",
  "Gastroenteritis",
  "Bronchial Asthma",
  "Allergic Rhinitis",
  "Common Cold",
  "Influenza",
  "Anemia",
  "UTI",
  "Otitis Media",
  "Bronchitis",
  "Dermatitis",
];

const VACCINE_SUGGESTIONS = [
  "BCG",
  "Hepatitis B",
  "DTP (Diphtheria, Tetanus, Pertussis)",
  "Polio (IPV)",
  "Measles",
  "MMR (Measles, Mumps, Rubella)",
  "COVID-19",
  "Influenza",
  "Varicella",
  "Hepatitis A",
  "Rotavirus",
  "Pneumococcal",
];

export default function PatientProfileScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, profile: doctorProfile } = useAuthStore();
  const { reservationId: passedResId } = useLocalSearchParams<{ reservationId: string }>();

  const [localDiagnosis, setLocalDiagnosis] = useState<Diagnosis | null>(null);
  const [notes, setNotes] = useState("");
  const [vaccines, setVaccines] = useState<Omit<Vaccine, "id">[]>([]);
  const [saving, setSaving] = useState(false);

  // Autocomplete states
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<string[]>([]);
  const [showDiagSuggestions, setShowDiagSuggestions] = useState(false);
  const [filteredVaccines, setFilteredVaccines] = useState<string[]>([]);
  const [showVacSuggestions, setShowVacSuggestions] = useState<number | null>(null);

  // Use reservationId from params if available, otherwise we'd need to find it
  // But our dashboard and queue now pass it, so it should be there.
  const effectiveReservationId = passedResId;

  const { data: reservationData, isLoading: resLoading } = useQuery({
    queryKey: ["reservation", effectiveReservationId],
    queryFn: () => getReservationById(effectiveReservationId!),
    enabled: !!effectiveReservationId,
    retry: false,
  });

  const { data: diagnosisData, isLoading: diagLoading } = useQuery({
    queryKey: ["diagnosis", effectiveReservationId],
    queryFn: () => getDiagnosisByReservation(effectiveReservationId!),
    enabled: !!effectiveReservationId,
    retry: false, // Don't retry if not found; it might be a new diagnosis
  });

  const doctorInfo = useMemo(() => {
    if (!doctorProfile) return null;
    return {
      id: (doctorProfile as any).doctor?.id || doctorProfile.id,
      name: (doctorProfile as any).doctorName || doctorProfile.name,
      clinicName: (doctorProfile as any).clinicName,
    };
  }, [doctorProfile]);

  const currentReservation = reservationData || null;

  useEffect(() => {
    if (diagnosisData) {
      setLocalDiagnosis(diagnosisData);
      setNotes(diagnosisData.notes || "");
      setVaccines(diagnosisData.vaccines || []);
    }
  }, [diagnosisData]);

  const patientName = currentReservation?.patientName ?? "Patient";
  const reservationId = currentReservation?.id ?? "";

  const handleDiagnosisSearch = (text: string) => {
    setNotes(text);
    if (text.length > 0) {
      const filtered = DIAGNOSIS_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredDiagnoses(filtered);
      setShowDiagSuggestions(true);
    } else {
      setShowDiagSuggestions(false);
    }
  };

  const handleVaccineSearch = (text: string, index: number) => {
    const updated = [...vaccines];
    updated[index].name = text;
    setVaccines(updated);

    if (text.length > 0) {
      const filtered = VACCINE_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredVaccines(filtered);
      setShowVacSuggestions(index);
    } else {
      setShowVacSuggestions(null);
    }
  };

  const addVaccineField = () => {
    setVaccines([
      ...vaccines,
      {
        name: "",
        date: new Date().toISOString().split("T")[0],
        dose: "",
      },
    ]);
  };

  const removeVaccineField = (index: number) => {
    setVaccines(vaccines.filter((_, i) => i !== index));
  };

  const updateVaccine = (
    index: number,
    field: keyof Omit<Vaccine, "id">,
    value: string,
  ) => {
    const updated = [...vaccines];
    updated[index] = { ...updated[index], [field]: value };
    setVaccines(updated);
  };

  const handleSave = async () => {
    if (!doctorInfo || !patientId || !reservationId) {
      Toast.show({ type: "error", text1: "No active reservation found" });
      return;
    }

    setSaving(true);
    try {
      // Ensure all vaccines have an ID if they are new
      const formattedVaccines = vaccines.map((v) => ({
        ...v,
        id: (v as any).id || Math.random().toString(36).substr(2, 9),
      }));

      const payload = {
        notes,
        vaccines: formattedVaccines,
      };

      if (localDiagnosis) {
        await updateDiagnosis(localDiagnosis.id, payload as any);
        Toast.show({
          type: "success",
          text1: "✅ Record updated successfully",
        });
      } else {
        await createDiagnosis({
          reservationId,
          patientId,
          doctorId: doctorInfo.id,
          doctorName: doctorInfo.name,
          clinicName: doctorInfo.clinicName,
          visitDate: new Date(),
          notes,
          vaccines: formattedVaccines,
          analysisFiles: [],
        } as any);
        Toast.show({ type: "success", text1: "✅ New record created" });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["diagnosis", reservationId] });
    } catch (error) {
      console.error("Save Error:", error);
      Toast.show({ type: "error", text1: "Failed to save record" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || resLoading || diagLoading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <ArrowLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View style={s.headerTitleContainer}>
                <Text style={s.greetingText}>Clinical Record</Text>
                <Text style={s.titleText} numberOfLines={1}>
                  {patientName}
                </Text>
              </View>
              {currentReservation && (
                <TouchableOpacity
                  style={[
                    s.sessionControlBtn,
                    currentReservation.status === "inside"
                      ? s.sessionEndBtn
                      : s.sessionStartBtn,
                    currentReservation.status === "done" && { opacity: 0.5 },
                  ]}
                  onPress={async () => {
                    if (currentReservation.status === "done") return;
                    const isStarting = currentReservation.status !== "inside";
                    const newStatus = isStarting ? "inside" : "done";
                    try {
                      await updateReservationStatus(
                        currentReservation.id,
                        newStatus,
                      );
                      Toast.show({
                        type: "success",
                        text1: isStarting ? "Session Started" : "Session Concluded",
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["reservation", effectiveReservationId],
                      });
                    } catch (err) {
                      Toast.show({ type: "error", text1: "Update failed" });
                    }
                  }}
                  disabled={currentReservation.status === "done"}
                >
                  <Text style={s.sessionControlBtnText}>
                    {currentReservation.status === "inside" ? "STOP" : "START"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Diagnosis Section */}
            <View style={s.contentSection}>
              <View style={s.inputHeader}>
                <Text style={s.inputLabel}>DIAGNOSIS & NOTES</Text>
                {notes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setNotes("");
                      setShowDiagSuggestions(false);
                    }}
                  >
                    <Text style={s.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.searchContainer}>
                <TextInput
                  style={s.textInput}
                  placeholder="Enter diagnosis or clinical notes..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={notes}
                  onChangeText={handleDiagnosisSearch}
                  onFocus={() =>
                    notes.length > 0 && setShowDiagSuggestions(true)
                  }
                  multiline
                />
                <FileText
                  size={18}
                  color="rgba(255,255,255,0.4)"
                  style={s.searchIcon}
                />
              </View>

              {showDiagSuggestions && filteredDiagnoses.length > 0 && (
                <View style={s.suggestionsContainer}>
                  {filteredDiagnoses.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={s.suggestionItem}
                      onPress={() => {
                        setNotes(item);
                        setShowDiagSuggestions(false);
                      }}
                    >
                      <CheckCircle2
                        size={16}
                        color={COLORS.primary}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={s.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Vaccines Section */}
            <View style={[s.contentSection, { marginTop: 32 }]}>
              <View style={s.inputHeader}>
                <Text style={s.inputLabel}>VACCINATIONS</Text>
                <TouchableOpacity
                  onPress={addVaccineField}
                  style={s.addBtnSmall}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={s.addBtnText}>ADD VACCINE</Text>
                </TouchableOpacity>
              </View>

              {vaccines.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyStateText}>
                    No vaccines added for this visit.
                  </Text>
                </View>
              ) : (
                vaccines.map((v, index) => (
                  <GlassCard
                    key={index}
                    style={s.vaccineCard}
                    variant="subtle"
                    radius={RADIUS.lg}
                  >
                    <View style={s.vaccineCardHeader}>
                      <View style={s.vaccineIconContainer}>
                        <Syringe size={14} color={COLORS.primary} />
                        <Text style={s.vaccineCount}>VACCINE #{index + 1}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeVaccineField(index)}
                        style={s.removeBtn}
                      >
                        <X size={16} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    </View>

                    {/* Vaccine Name with Autocomplete */}
                    <View style={s.searchContainer}>
                      <TextInput
                        style={s.fieldInput}
                        placeholder="Vaccine Name"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={v.name}
                        onChangeText={(txt) => handleVaccineSearch(txt, index)}
                        onFocus={() =>
                          v.name.length > 0 && setShowVacSuggestions(index)
                        }
                      />
                    </View>

                    {showVacSuggestions === index &&
                      filteredVaccines.length > 0 && (
                        <View style={s.suggestionsContainer}>
                          {filteredVaccines.map((item, i) => (
                            <TouchableOpacity
                              key={i}
                              style={s.suggestionItem}
                              onPress={() => {
                                updateVaccine(index, "name", item);
                                setShowVacSuggestions(null);
                              }}
                            >
                              <Plus
                                size={14}
                                color={COLORS.primary}
                                style={{ marginRight: 8 }}
                              />
                              <Text style={s.suggestionText}>{item}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    <View style={s.row}>
                      <View style={[s.fieldContainer, { flex: 1 }]}>
                        <Text style={s.fieldLabel}>Date</Text>
                        <TextInput
                          style={s.fieldInput}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={v.date}
                          onChangeText={(txt) =>
                            updateVaccine(index, "date", txt)
                          }
                        />
                      </View>
                      <View
                        style={[
                          s.fieldContainer,
                          { flex: 1.5, marginLeft: 12 },
                        ]}
                      >
                        <Text style={s.fieldLabel}>Schedule / Dosage</Text>
                        <TextInput
                          style={s.fieldInput}
                          placeholder="e.g. 1 per day"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={v.dose}
                          onChangeText={(txt) =>
                            updateVaccine(index, "dose", txt)
                          }
                        />
                      </View>
                    </View>
                  </GlassCard>
                ))
              )}
            </View>

            {/* Action Section */}
            <View style={s.footer}>
              {currentReservation?.status !== "inside" && (
                <Text style={s.warningText}>
                  ⚠️ Patient must be "Inside" to save record
                </Text>
              )}
              <GradientButton
                label={localDiagnosis ? "Update Record" : "Save Record"}
                onPress={handleSave}
                loading={saving}
                variant="primary"
                disabled={
                  (notes.trim().length === 0 &&
                    (vaccines.length === 0 ||
                      !vaccines.some((v) => v.name.trim().length > 0))) ||
                  currentReservation?.status !== "inside"
                }
              />
              <Text style={s.saveInfo}>
                This information will be visible to the patient
              </Text>
            </View>

            {/* Analysis Results Display */}
            {localDiagnosis &&
              localDiagnosis.analysisFiles &&
              localDiagnosis.analysisFiles.length > 0 && (
                <View style={[s.contentSection, { marginTop: 20 }]}>
                  <Text style={[s.inputLabel, { marginBottom: 12 }]}>
                    LAB ANALYSIS RESULTS
                  </Text>
                  <GlassCard
                    style={s.labResultsCard}
                    variant="secondary"
                    radius={RADIUS.xl}
                  >
                    {localDiagnosis.analysisFiles.map((f, i) => (
                      <View key={i} style={s.fileRow}>
                        <View style={s.fileIconBg}>
                          <FileText size={18} color={COLORS.primary} />
                        </View>
                        <View style={s.fileInfo}>
                          <Text style={s.fileName} numberOfLines={1}>
                            {f.fileName}
                          </Text>
                          <Text style={s.fileType}>
                            {f.type.toUpperCase()} • {f.labName || "Laboratory"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </GlassCard>
                </View>
              )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f19" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b0f19",
  },
  scrollContent: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  greetingText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.label,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  titleText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "bold",
  },
  contentSection: {
    paddingHorizontal: 24,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "600",
    letterSpacing: 2,
  },
  clearText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  searchContainer: {
    position: "relative",
    zIndex: 10,
  },
  searchIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 20,
    color: "#fff",
    fontFamily: FONT_FAMILY.body,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  suggestionsContainer: {
    backgroundColor: "#1a2235",
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
  },
  addBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(100, 100, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(100, 100, 255, 0.3)",
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontStyle: "italic",
  },
  vaccineCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  vaccineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  vaccineIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vaccineCount: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,50,50,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldContainer: {
    marginTop: 16,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  fieldInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: {
    flexDirection: "row",
  },
  footer: {
    padding: 24,
    marginTop: 16,
  },
  saveInfo: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    fontFamily: FONT_FAMILY.body,
  },
  labResultsCard: { padding: 8, gap: 4 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    marginBottom: 8,
  },
  fileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(100, 100, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "600",
  },
  fileType: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    marginTop: 2,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "600",
  },
  sessionControlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionStartBtn: {
    backgroundColor: COLORS.primary,
  },
  sessionEndBtn: {
    backgroundColor: COLORS.error,
  },
  sessionControlBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
