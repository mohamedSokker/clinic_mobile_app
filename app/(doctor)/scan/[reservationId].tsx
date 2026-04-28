import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  XCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getReservationById,
  updateReservationStatus,
} from "@/services/reservationService";
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from "@/lib/theme";
import Toast from "react-native-toast-message";
import { GlassCard } from "@/components/ui/GlassCard";
import { useQueryClient } from "@tanstack/react-query";

export default function QRScanScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchReservation();
    // Prevent instant scanning on mount to avoid "accidental" triggers
    const timer = setTimeout(() => setCanScan(true), 1500);
    return () => clearTimeout(timer);
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      const res = await getReservationById(reservationId);
      setReservation(res);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load reservation data" });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processing || scanned || !canScan || !reservation) return;

    // Prevent scanning if already done
    if (reservation.status === "done") {
      Toast.show({
        type: "info",
        text1: "Already completed",
        text2: "This session is already finished.",
      });
      return;
    }

    setScanned(true);
    setProcessing(true);

    try {
      console.log("Processing scanned data:", data);
      const qrData = JSON.parse(data);

      // Validation
      if (
        qrData.patientId !== reservation.patientId ||
        qrData.reservationId !== reservation.id
      ) {
        throw new Error("Validation mismatch");
      }

      const isStarting = reservation.status !== "inside";
      const newStatus = isStarting ? "inside" : "done";

      await updateReservationStatus(reservation.id, newStatus);
      
      // Invalidate queries to refresh data across all screens
      queryClient.invalidateQueries({ queryKey: ["reservations"] });

      Toast.show({
        type: "success",
        text1: isStarting ? "Session Started" : "Session Concluded",
        text2: `Patient ${reservation.patientName} has been ${isStarting ? "checked in" : "checked out"}.`,
      });

      setProcessing(false);

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      console.error("QR Processing Error:", err);
      Toast.show({
        type: "error",
        text1: "Scan Failed",
        text2:
          err instanceof Error && err.message === "Validation mismatch"
            ? "This QR code belongs to another patient/session."
            : "Invalid QR code format.",
      });

      // Reset after 3 seconds to allow retry
      setTimeout(() => {
        setScanned(false);
        setProcessing(false);
      }, 3000);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.center}>
          <XCircle size={60} color={COLORS.error} />
          <Text style={styles.permissionText}>Camera Access Required</Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const handleManualAction = async () => {
    if (processing || !reservation) return;
    const isStarting = reservation.status !== "inside";
    const newStatus = isStarting ? "inside" : "done";

    setProcessing(true);
    try {
      await updateReservationStatus(reservation.id, newStatus);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Session ${isStarting ? "started" : "concluded"} manually.`,
      });
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      Toast.show({ type: "error", text1: "Manual update failed" });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Reservation not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
          <Text style={{ color: COLORS.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isInside = reservation.status === "inside";

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner</Text>
        </View>

        <View style={styles.scannerBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {!canScan && !loading && (
            <View style={styles.retryOverlay}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={[styles.retryText, { marginTop: 8 }]}>
                PREPARING...
              </Text>
            </View>
          )}

          {canScan && !scanned && (
            <View style={styles.scanReadyBadge}>
              <Text style={styles.scanReadyText}>READY TO SCAN</Text>
            </View>
          )}

          {scanned && !processing && (
            <View style={styles.retryOverlay}>
              <Text style={styles.retryText}>Scan processed.</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <GlassCard style={styles.infoCard} variant="subtle">
            <View style={styles.patientInfo}>
              <View>
                <Text style={styles.infoLabel}>PATIENT</Text>
                <Text style={styles.infoValue}>{reservation.patientName}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isInside
                          ? COLORS.tertiary
                          : COLORS.primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isInside ? COLORS.tertiary : COLORS.primary },
                    ]}
                  >
                    {reservation.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.manualBtn, processing && { opacity: 0.5 }]}
                onPress={handleManualAction}
                disabled={processing}
              >
                <Text style={styles.manualBtnText}>
                  {isInside ? "CONCLUDE MANUALLY" : "START MANUALLY"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.hintText}>
                Aim camera at the patient's check-in QR code
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.processingText}>UPDATING SESSION...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  btn: { marginTop: 10, padding: 10 },
  overlay: { flex: 1, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
    paddingTop: 60,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "700",
  },
  scannerBox: {
    width: 280,
    height: 280,
    alignSelf: "center",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  retryOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },

  footer: { padding: SPACING.xl, paddingBottom: 60 },
  infoCard: { padding: 24, gap: 16 },
  patientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoValue: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.label,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: "100%",
  },
  actionRow: {
    gap: 16,
    alignItems: "center",
  },
  manualBtn: {
    width: "100%",
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  manualBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  hintText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 14, 26, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    zIndex: 100,
  },
  processingText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    fontWeight: "700",
  },
  scanReadyBadge: {
    backgroundColor: "rgba(0, 230, 118, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 230, 118, 0.4)",
  },
  scanReadyText: {
    color: "#00E676",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
