import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { COLORS, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      Toast.show({ type: "error", text1: "Email is required" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: "Please check your clinical inbox.",
      });
      setStep("otp");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({ type: "error", text1: "Invalid OTP format" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      setStep("reset");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: err.response?.data?.message || "Invalid OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: "Password too short" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      Toast.show({
        type: "success",
        text1: "Password Reset",
        text2: "Your credentials have been updated.",
      });
      router.replace("/(auth)/login");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: err.response?.data?.message || "Failed to reset password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
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
              <Text style={styles.headerTitle}>KEY RECOVERY</Text>
            </View>

            <View style={styles.content}>
              <GlassCard
                style={styles.card}
                variant="strong"
                radius={RADIUS["2xl"]}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name={
                      step === "email"
                        ? "mail-outline"
                        : step === "otp"
                          ? "vibration"
                          : "lock-reset"
                    }
                    size={48}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.title}>
                  {step === "email"
                    ? "Forgot Password?"
                    : step === "otp"
                      ? "Verify Identity"
                      : "Reset Access Key"}
                </Text>
                <Text style={styles.subtitle}>
                  {step === "email"
                    ? "Enter your clinical email to receive a secure authorization code."
                    : step === "otp"
                      ? `Enter the 6-digit code sent to ${email}`
                      : "Create a new secure access key for your account."}
                </Text>

                <View style={styles.form}>
                  {step === "email" && (
                    <View style={styles.field}>
                      <Text style={styles.label}>CLINICAL EMAIL</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons
                          name="alternate-email"
                          size={20}
                          color={COLORS.outline}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="patient@vitreous.lab"
                          placeholderTextColor={COLORS.outline}
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                  )}

                  {step === "otp" && (
                    <View style={styles.field}>
                      <Text style={styles.label}>SECURE CODE</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons
                          name="vibration"
                          size={20}
                          color={COLORS.outline}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            {
                              letterSpacing: 8,
                              fontSize: 24,
                              textAlign: "center",
                            },
                          ]}
                          placeholder="000000"
                          placeholderTextColor={COLORS.outline}
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>
                  )}

                  {step === "reset" && (
                    <View style={styles.field}>
                      <Text style={styles.label}>NEW SECURITY KEY</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons
                          name="lock-outline"
                          size={20}
                          color={COLORS.outline}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor={COLORS.outline}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  )}

                  <GradientButton
                    onPress={
                      step === "email"
                        ? handleRequestOtp
                        : step === "otp"
                          ? handleVerifyOtp
                          : handleResetPassword
                    }
                    label={
                      step === "email"
                        ? "Send Secure Code"
                        : step === "otp"
                          ? "Verify Identity"
                          : "Update Access Key"
                    }
                    loading={loading}
                    size="lg"
                    variant="primary"
                    style={styles.submitBtn}
                  />

                  {step !== "email" && (
                    <TouchableOpacity
                      onPress={() => setStep("email")}
                      style={styles.resendBtn}
                    >
                      <Text style={styles.resendText}>Back to Email Entry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    fontWeight: "800",
  },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  card: { padding: 32, alignItems: "center", gap: 24 },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: 28,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
  form: { width: "100%", gap: 24, marginTop: 10 },
  field: { gap: 10 },
  label: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 2,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: RADIUS.xl,
    paddingHorizontal: 20,
    height: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
  },
  submitBtn: { marginTop: 10 },
  resendBtn: { alignSelf: "center", padding: 10 },
  resendText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
