import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import { getPatientAnalysis } from "@/services/labService";
import {
  getDiagnosesByPatientId,
  attachAnalysisFile,
} from "@/services/diagnosisService";
import { uploadAnalysisFile } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { deleteAnalysisFile } from "@/services/labService";

export default function PatientAnalysisScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { user, profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<any>(null);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);

  // Upload state
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"image" | "pdf">("image");
  const [uploading, setUploading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [recentAnalysis, setRecentAnalysis] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  const fetchData = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      const data = await getPatientAnalysis(patientId, pageNum, 3);
      setPatientData(data);
      
      if (isLoadMore) {
        setRecentAnalysis(prev => [...prev, ...data.recentAnalysis]);
      } else {
        setRecentAnalysis(data.recentAnalysis);
      }
      
      setTotalCount(data.totalAnalysisCount);
      setPage(pageNum);

      if (pageNum === 1) {
        const diags = await getDiagnosesByPatientId(patientId);
        setDiagnoses(diags);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      Toast.show({ type: "error", text1: "Failed to load patient data" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        
        const isPdf = asset.mimeType?.includes("pdf") || asset.name.toLowerCase().endsWith(".pdf");
        setFileType(isPdf ? "pdf" : "image");
      }
    } catch (err) {
      console.error("Pick File Error:", err);
      Toast.show({ type: "error", text1: "Failed to pick file" });
    }
  };

  const handleUpload = async () => {
    if (!fileUri || !user || !profile) {
      Alert.alert("Error", "Please select a file first");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAnalysisFile(
        patientId,
        user.uid,
        fileUri,
        fileType,
        fileName,
      );

      const fileData = {
        url,
        type: fileType,
        fileName,
        patientId: patientId,
        diagnosisId: selectedDiagId, // Optional
      };

      await attachAnalysisFile(selectedDiagId || "", fileData as any);

      Toast.show({
        type: "success",
        text1: "✅ Uploaded successfully",
        text2: "The analysis has been attached to the patient record",
      });

      // Reset
      setFileUri(null);
      setFileName("");
      setSelectedDiagId(null);
      fetchData(); // Refresh to show last analysis
    } catch (err) {
      console.error("Upload Error:", err);
      Toast.show({ type: "error", text1: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string) => {
    setFileToDelete(fileId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnalysisFile(fileToDelete);
      Toast.show({
        type: "success",
        text1: "File removed",
        text2: "The analysis has been deleted successfully",
      });
      setShowDeleteModal(false);
      setFileToDelete(null);
      fetchData();
    } catch (err) {
      console.error("Delete Error:", err);
      Toast.show({ type: "error", text1: "Failed to delete file" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (url: string, type: string, name: string) => {
    setPreviewData({ url, type, name });
    setShowPreview(true);
  };

  const handleOpenPdf = async () => {
    if (!previewData) return;
    
    try {
      setIsDeleting(true); // Reuse loading state for downloading
      const fileUri = `${FileSystem.cacheDirectory}${previewData.name}`;
      
      const downloadRes = await FileSystem.downloadAsync(
        previewData.url,
        fileUri
      );

      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: "application/pdf",
          dialogTitle: "View Analysis Result",
          UTI: "com.adobe.pdf",
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (err) {
      console.error("PDF View Error:", err);
      Toast.show({ type: "error", text1: "Could not open PDF" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const patient = patientData?.patient;
  const lastAnalysis = patientData?.lastAnalysis;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={COLORS.onSurface}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Patient Analysis</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Card */}
          <GlassCard style={styles.patientCard} variant="strong">
            <View style={styles.patientProfileRow}>
              <Image
                source={
                  patient?.user?.photoURL
                    ? { uri: patient.user.photoURL }
                    : require("@/assets/default-avatar.png")
                }
                style={styles.avatar}
              />
              <View style={styles.patientMainInfo}>
                <Text style={styles.patientName}>{patient?.user?.name}</Text>
                <Text style={styles.patientId}>ID: {patientId}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>
                      {patient?.gender || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: "rgba(255, 107, 107, 0.1)" },
                    ]}
                  >
                    <Text style={[styles.infoBadgeText, { color: "#ff6b6b" }]}>
                      Type {patient?.bloodType || "?"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    ]}
                  >
                    <Text style={[styles.infoBadgeText, { color: "#4CAF50" }]}>
                      {patient?.age || "?"} Yrs
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactRow}>
              <View style={styles.contactItem}>
                <MaterialIcons name="email" size={16} color={COLORS.primary} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {patient?.user?.email}
                </Text>
              </View>
              <View style={styles.contactItem}>
                <MaterialIcons name="phone" size={16} color={COLORS.primary} />
                <Text style={styles.contactText}>{patient?.user?.mobile}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Analysis History Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Analysis in Lab</Text>
            <Text style={styles.totalText}>{totalCount} Total</Text>
          </View>

          {recentAnalysis && recentAnalysis.length > 0 ? (
            <View>
              {recentAnalysis.map((analysis: any) => (
                <GlassCard key={analysis.id} style={styles.lastAnalysisCard} variant="subtle">
                  <View style={styles.analysisIconBg}>
                    <MaterialIcons
                      name={
                        analysis.type === "image" ? "image" : "picture-as-pdf"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.analysisInfo}>
                    <Text style={styles.analysisFileName} numberOfLines={1}>
                      {analysis.fileName}
                    </Text>
                    <Text style={styles.analysisDate}>
                      Uploaded on{" "}
                      {new Date(analysis.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() =>
                        handlePreview(
                          analysis.url,
                          analysis.type,
                          analysis.fileName,
                        )
                      }
                    >
                      <MaterialIcons
                        name="visibility"
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewBtn, { marginLeft: 8 }]}
                      onPress={() => handleDelete(analysis.id)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color="#ff6b6b"
                      />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
              
              {recentAnalysis.length < totalCount && (
                <TouchableOpacity 
                  style={styles.viewMoreBtn}
                  onPress={() => fetchData(page + 1, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Text style={styles.viewMoreText}>Load More</Text>
                      <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No previous analysis found for this patient in your lab.
              </Text>
            </View>
          )}

          {/* Attachment Section */}
          <Text style={styles.sectionTitle}>Attach New Analysis</Text>
          <GlassCard style={styles.uploadSection} variant="strong">
            <Text style={styles.uploadHint}>
              Step 1: Select a diagnosis (optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.diagScroll}
            >
              {diagnoses.length > 0 ? (
                diagnoses.map((diag) => (
                  <TouchableOpacity
                    key={diag.id}
                    onPress={() =>
                      setSelectedDiagId(
                        selectedDiagId === diag.id ? null : diag.id,
                      )
                    }
                    style={[
                      styles.diagBadge,
                      selectedDiagId === diag.id && styles.diagBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.diagBadgeText,
                        selectedDiagId === diag.id &&
                          styles.diagBadgeTextSelected,
                      ]}
                    >
                      {diag.doctorName} -{" "}
                      {new Date(diag.visitDate).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noDiagsText}>
                  No recent diagnoses found.
                </Text>
              )}
            </ScrollView>

            <Text style={styles.uploadHint}>
              Step 2: Pick and name the file
            </Text>
            <TouchableOpacity
              onPress={handlePickFile}
              style={styles.filePicker}
            >
              {fileUri ? (
                <View style={styles.fileSelectedContent}>
                  <MaterialIcons
                    name={fileType === "image" ? "image" : "picture-as-pdf"}
                    size={40}
                    color={COLORS.primary}
                  />
                  <Text style={styles.fileSelectedName} numberOfLines={1}>
                    {fileName}
                  </Text>
                  <Text style={styles.changeFileText}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.filePickerPlaceholder}>
                  <MaterialIcons
                    name="cloud-upload"
                    size={40}
                    color="rgba(255,255,255,0.2)"
                  />
                  <Text style={styles.filePickerText}>
                    Tap to pick analysis result
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {fileUri && (
              <TextInput
                style={styles.fileNameInput}
                placeholder="File Description (e.g. Blood Test Results)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={fileName}
                onChangeText={setFileName}
              />
            )}

            <GradientButton
              label={uploading ? "Uploading..." : "Upload & Attach"}
              onPress={handleUpload}
              disabled={!fileUri || uploading}
              loading={uploading}
              variant="primary"
              style={styles.uploadBtn}
            />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} variant="strong">
            <View style={styles.modalHeader}>
              <View style={styles.warningIconBg}>
                <MaterialIcons name="warning" size={28} color="#ff6b6b" />
              </View>
              <Text style={styles.modalTitle}>Remove Analysis</Text>
            </View>

            <Text style={styles.modalDescription}>
              Are you sure you want to delete this analysis result? This action
              cannot be undone and the patient will no longer see this file.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Delete Result</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={() => setShowPreview(false)}
              style={styles.closePreviewBtn}
            >
              <MaterialIcons name="close" size={28} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewData?.name}
            </Text>
            <TouchableOpacity 
              onPress={() => WebBrowser.openBrowserAsync(previewData?.url || "")}
              style={styles.closePreviewBtn}
            >
              <MaterialIcons name="open-in-browser" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContent}>
            {previewData ? (
              previewData.type === "image" ? (
                <Image
                  source={{ uri: previewData.url }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pdfPlaceholder}>
                  <View style={styles.pdfIconBg}>
                    <MaterialIcons name="picture-as-pdf" size={80} color={COLORS.primary} />
                  </View>
                  <Text style={styles.pdfFileName}>{previewData.name}</Text>
                  <Text style={styles.pdfInfo}>PDF Document</Text>
                  
                  <TouchableOpacity 
                    style={styles.viewPdfBtn}
                    onPress={handleOpenPdf}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="visibility" size={24} color="#fff" />
                        <Text style={styles.viewPdfBtnText}>View in System Viewer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <Text style={styles.pdfHint}>
                    Tap to open this document using your device's native PDF reader for the best experience.
                  </Text>
                </View>
              )
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070e1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalText: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  patientCard: {
    padding: 20,
    marginBottom: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  patientProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  patientMainInfo: {
    flex: 1,
  },
  patientName: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    marginBottom: 4,
  },
  patientId: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    opacity: 0.6,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoBadge: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 16,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  contactText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    marginBottom: 16,
  },
  lastAnalysisCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 24,
  },
  analysisIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisFileName: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  analysisDate: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewBtn: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: RADIUS.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
  uploadSection: {
    padding: 20,
    borderRadius: RADIUS.xl,
  },
  uploadHint: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 12,
  },
  diagScroll: {
    marginBottom: 20,
  },
  diagBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  diagBadgeSelected: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    borderColor: COLORS.primary,
  },
  diagBadgeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  diagBadgeTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  noDiagsText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  filePicker: {
    height: 140,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  filePickerPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  filePickerText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
  },
  fileSelectedContent: {
    alignItems: "center",
    gap: 4,
  },
  fileSelectedName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    maxWidth: 200,
  },
  changeFileText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    marginTop: 4,
  },
  fileNameInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: RADIUS.md,
    padding: 14,
    color: COLORS.onSurface,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  uploadBtn: {
    marginTop: 8,
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
  },
  viewMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: RADIUS.xl,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  modalDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelBtnText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  confirmDeleteBtn: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#ff6b6b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDeleteBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closePreviewBtn: {
    padding: 8,
  },
  previewTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  previewContent: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewWeb: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: COLORS.background,
  },
  pdfIconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  pdfFileName: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  pdfInfo: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 40,
  },
  viewPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  viewPdfBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  pdfHint: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
  webLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
