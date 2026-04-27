import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  FlaskConical,
  Calendar,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { COLORS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { MaterialIcons } from "@expo/vector-icons";
import { 
  getPaginatedAnalysis, 
  deleteAnalysisFileForPatient 
} from "@/services/diagnosisService";
import Toast from "react-native-toast-message";

export default function LabAnalysisScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [page, setPage] = React.useState(1);
  const [allFiles, setAllFiles] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Preview State
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [isOpening, setIsOpening] = React.useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchFiles = async (pageNum: number, isRefresh = false) => {
    try {
      if (pageNum === 1) setRefreshing(true);
      else setLoadingMore(true);

      const res = await getPaginatedAnalysis(pageNum, 3);
      
      if (isRefresh || pageNum === 1) {
        setAllFiles(res.files);
      } else {
        setAllFiles(prev => [...prev, ...res.files]);
      }
      setTotal(res.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Fetch Files Error:", err);
      Toast.show({ type: "error", text1: "Failed to load reports" });
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    fetchFiles(1);
  }, []);

  const handlePreview = (url: string, type: string, name: string) => {
    setPreviewData({ url, type, name });
    setShowPreview(true);
  };

  const handleOpenPdf = async () => {
    if (!previewData) return;
    try {
      setIsOpening(true);
      const fileUri = `${FileSystem.cacheDirectory}${previewData.name}`;
      const downloadRes = await FileSystem.downloadAsync(previewData.url, fileUri);
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
      setIsOpening(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnalysisFileForPatient(fileToDelete);
      setAllFiles(prev => prev.filter(f => f.id !== fileToDelete));
      setTotal(prev => prev - 1);
      setShowDeleteModal(false);
      Toast.show({ type: "success", text1: "Report deleted" });
    } catch (err) {
      console.error("Delete Error:", err);
      Toast.show({ type: "error", text1: "Failed to delete report" });
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

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
            <Text style={s.introTitle}>Laboratory Reports</Text>
            <Text style={s.introSub}>
              Access, view, and manage your complete diagnostic analysis files.
            </Text>
          </View>

          {refreshing && page === 1 ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.statusText}>Syncing records...</Text>
            </View>
          ) : allFiles.length === 0 ? (
            <View style={s.emptyContainer}>
              <GlassCard style={s.emptyCard} variant="subtle">
                <FlaskConical size={64} color="rgba(164, 171, 188, 0.1)" />
                <Text style={s.emptyTitle}>No Reports Found</Text>
                <Text style={s.emptyText}>
                  When your lab results are ready, they will appear here automatically.
                </Text>
              </GlassCard>
            </View>
          ) : (
            <View style={s.list}>
              {allFiles.map((f: any) => (
                <GlassCard key={f.id} style={s.fileCard} variant="strong">
                  <View style={s.fileHeader}>
                    <View style={s.fileIconWrap}>
                      <MaterialIcons 
                        name={f.type === "image" ? "image" : "picture-as-pdf"} 
                        size={24} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fileName} numberOfLines={1}>
                        {f.fileName || "Unnamed Report"}
                      </Text>
                      <Text style={s.fileMeta}>
                        {f.type?.toUpperCase() || "FILE"} •{" "}
                        {f.uploadedAt ? format(new Date(f.uploadedAt), "MMM dd, yyyy") : "N/A"}
                      </Text>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity 
                        onPress={() => handlePreview(f.url, f.type, f.fileName)}
                        style={s.actionIconBtn}
                      >
                        <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          setFileToDelete(f.id);
                          setShowDeleteModal(true);
                        }}
                        style={s.actionIconBtn}
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={s.fileContext}>
                    <View style={s.contextItem}>
                      <Calendar size={12} color="rgba(164, 171, 188, 0.6)" />
                      <Text style={s.contextText}>
                        {f.uploadedAt ? format(new Date(f.uploadedAt), "hh:mm a") : "N/A"}
                      </Text>
                    </View>
                    <View style={s.contextItem}>
                      <FlaskConical
                        size={12}
                        color="rgba(164, 171, 188, 0.6)"
                      />
                      <Text style={s.contextText} numberOfLines={1}>
                        {f.diagnosis?.doctor?.doctorName ? `Dr. ${f.diagnosis.doctor.doctorName}` : (f.lab?.labName || "Diagnostic Lab")}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}

              {allFiles.length < total && (
                <TouchableOpacity 
                  style={s.loadMoreBtn} 
                  onPress={() => fetchFiles(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={s.loadMoreText}>Load More Records</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={s.previewModalContainer}>
          <LinearGradient
            colors={["rgba(7,14,26,0.95)", "rgba(7,14,26,1)"]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={s.previewHeader}>
              <TouchableOpacity
                onPress={() => setShowPreview(false)}
                style={s.closePreviewBtn}
              >
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={s.previewTitle} numberOfLines={1}>
                {previewData?.name}
              </Text>
              <TouchableOpacity
                onPress={() => WebBrowser.openBrowserAsync(previewData?.url || "")}
                style={s.closePreviewBtn}
              >
                <MaterialIcons name="open-in-browser" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={s.previewContent}>
              {previewData ? (
                previewData.type === "image" ? (
                  <Image
                    source={{ uri: previewData.url }}
                    style={s.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={s.pdfPlaceholder}>
                    <View style={s.pdfIconBg}>
                      <MaterialIcons name="picture-as-pdf" size={80} color={COLORS.primary} />
                    </View>
                    <Text style={s.pdfFileNameText}>{previewData.name}</Text>
                    <TouchableOpacity 
                      style={s.viewPdfBtn}
                      onPress={handleOpenPdf}
                      disabled={isOpening}
                    >
                      {isOpening ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="visibility" size={24} color="#fff" />
                          <Text style={s.viewPdfBtnText}>View in System Viewer</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={s.modalOverlay}>
          <GlassCard style={s.deleteModal}>
            <View style={s.deleteIconWrap}>
              <MaterialIcons name="delete-forever" size={32} color="#ff6b6b" />
            </View>
            <Text style={s.modalTitle}>Delete Report?</Text>
            <Text style={s.modalSub}>
              This will permanently remove this diagnostic report from your records. This action cannot be undone.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalDeleteBtn}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.modalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      <Toast />
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
  list: { gap: 16 },
  fileCard: { borderRadius: 24, padding: 16 },
  fileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  fileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(64,206,243,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { color: COLORS.onSurface, fontSize: 16, fontWeight: "700" },
  fileMeta: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileContext: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  contextItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  contextText: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  loadMoreBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: "rgba(64,206,243,0.1)",
    borderRadius: 16,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  statusText: {
    color: "rgba(164, 171, 188, 0.5)",
    textAlign: "center",
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyContainer: {
    marginTop: 20,
  },
  emptyCard: { alignItems: "center", padding: 40, borderRadius: 30, gap: 12 },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: FONT_FAMILY.headline,
    marginTop: 12,
  },
  emptyText: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: 24,
  },
  deleteModal: {
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
  },
  deleteIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSub: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#ff6b6b",
    alignItems: "center",
  },
  modalDeleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Preview Modal
  previewModalContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  previewTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 15,
  },
  previewContent: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  closePreviewBtn: {
    padding: 8,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#070e1a",
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
  pdfFileNameText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
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
  },
  viewPdfBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
