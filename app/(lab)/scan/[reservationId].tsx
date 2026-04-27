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
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getReservationById,
  updateReservationStatus,
} from "@/services/reservationService";
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from "@/lib/theme";
import Toast from "react-native-toast-message";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LabQRScanScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReservation();
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
    if (processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const qrData = JSON.parse(data);
      console.log("Scanned QR Data:", qrData);

      // Validation
      if (
        qrData.patientId !== reservation.patientId ||
        qrData.reservationId !== reservation.id
      ) {
        Toast.show({
          type: "error",
          text1: "Invalid QR Code",
          text2: "This code does not match the current patient or reservation.",
        });
        setScanned(false);
        setProcessing(false);
        return;
      }

      const isStarting = reservation.status !== "inside";
      const newStatus = isStarting ? "inside" : "done";

      await updateReservationStatus(reservation.id, newStatus);

      Toast.show({
        type: "success",
        text1: isStarting ? "Analysis Started" : "Analysis Concluded",
        text2: `Patient ${reservation.patientName} has been ${isStarting ? "checked in" : "checked out"}.`,
      });

      router.back();
    } catch (err) {
      console.error("QR Processing Error:", err);
      Toast.show({
        type: "error",
        text1: "Processing Error",
        text2: "Failed to read or update reservation status.",
      });
      setScanned(false);
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lab Specimen Check-in</Text>
        </View>

        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.footer}>
          <GlassCard style={styles.infoCard} variant="subtle" radius={RADIUS.lg}>
            <Text style={styles.infoLabel}>PATIENT IDENTITY</Text>
            <Text style={styles.infoValue}>{reservation.patientName}</Text>
            <Text style={styles.infoAction}>
              {reservation.status === "inside"
                ? "Scan to conclude analysis"
                : "Scan to start analysis"}
            </Text>
          </GlassCard>
        </View>
      </SafeAreaView>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.processingText}>SYNCING WITH CORE...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  overlay: { flex: 1, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
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
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scannerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: "relative",
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
  footer: { padding: SPACING.xl, paddingBottom: 40 },
  infoCard: { padding: 20, alignItems: "center", gap: 4 },
  infoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  infoValue: {
    color: "#fff",
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
  },
  infoAction: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    marginTop: 8,
    letterSpacing: 1,
  },
  permissionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  processingText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
});
