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
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuthStore } from "@/stores/authStore";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { login } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const roleLabel = params.role
    ? params.role.charAt(0).toUpperCase() + params.role.slice(1)
    : "Patient";

  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitting(true);
    try {
      await login(data.email.trim().toLowerCase(), data.password);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Authorization Failed",
        text2: "Invalid clinical credentials. Please verify and retry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric Glows */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <BackgroundDecor />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.brand}>
                <MaterialIcons
                  name="medical-services"
                  size={28}
                  color={COLORS.primary}
                />
                <Text style={styles.brandText}>Vitreous Lab</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.closeBtn}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.onSurface}
                />
              </TouchableOpacity>
            </View>

            {/* Brand Narrative */}
            <View style={styles.narrative}>
              <View style={styles.narrativeBadge}>
                <MaterialIcons
                  name="verified-user"
                  size={12}
                  color={COLORS.primary}
                />
                <Text style={styles.narrativeBadgeText}>
                  SECURE PRECISION LAB
                </Text>
              </View>
              <Text style={styles.narrativeTitle}>
                Your Health,{"\n"}
                <Text style={styles.narrativeTitleItalic}>Refined.</Text>
              </Text>
              <Text style={styles.narrativeSubtitle}>
                Access your personalized diagnostic landscape. Predictive
                wellness powered by precision data analysis.
              </Text>

              <View style={styles.socialProof}>
                <View style={styles.avatarStack}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[styles.avatar, { marginLeft: i === 1 ? 0 : -12 }]}
                    >
                      <Image
                        source={{
                          uri: `https://i.pravatar.cc/100?u=${i + 10}`,
                        }}
                        style={styles.avatarImg}
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.socialProofText}>
                  Trusted by 12,000+ patients
                </Text>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.formSection}>
              <GlassCard
                style={styles.loginCard}
                variant="strong"
                radius={RADIUS["2xl"]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{roleLabel} Portal Login</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your credentials to manage your results.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>EMAIL IDENTITY</Text>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View
                          style={[
                            styles.inputWrapper,
                            errors.email && styles.inputError,
                          ]}
                        >
                          <MaterialIcons
                            name="alternate-email"
                            size={20}
                            color={COLORS.outline}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="patient@vitreous.lab"
                            placeholderTextColor={COLORS.outline}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      )}
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.field}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>SECURITY KEY</Text>
                      <TouchableOpacity
                        onPress={() => router.push("/(auth)/forgot-password" as any)}
                      >
                        <Text style={styles.forgotBtn}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View
                          style={[
                            styles.inputWrapper,
                            errors.password && styles.inputError,
                          ]}
                        >
                          <MaterialIcons
                            name="lock"
                            size={20}
                            color={COLORS.outline}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.outline}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry={!showPassword}
                          />
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                          >
                            <MaterialIcons
                              name={
                                showPassword ? "visibility" : "visibility-off"
                              }
                              size={20}
                              color={COLORS.outline}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                    {errors.password && (
                      <Text style={styles.errorText}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <GradientButton
                      onPress={handleSubmit(onSubmit)}
                      label="Sign In"
                      loading={submitting}
                      disabled={!isValid}
                      size="lg"
                      variant="primary"
                      style={styles.submitBtn}
                    />

                    {/* <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR BIOMETRIC</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity style={styles.biometricBtn}>
                      <MaterialIcons
                        name="fingerprint"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={styles.biometricText}>Touch or Face ID</Text>
                    </TouchableOpacity> */}
                  </View>
                </View>

                <View style={styles.socialLogins}>
                  {/* <View style={styles.socialButtons}>
                    <TouchableOpacity style={styles.socialBtn}>
                      <MaterialIcons name="g-mobiledata" size={32} color={COLORS.onSurface} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                      <MaterialIcons name="apple" size={24} color={COLORS.onSurface} />
                    </TouchableOpacity>
                  </View> */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/(auth)/register/${params.role ?? "patient"}` as any,
                      )
                    }
                    style={styles.signupLink}
                  >
                    <Text style={styles.signupText}>
                      New to Vitreous Lab?{" "}
                      <Text style={styles.signupHighlight}>Create Account</Text>
                    </Text>
                  </TouchableOpacity>
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
  bgGlowTop: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    transform: [{ scale: 2 }],
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(197, 126, 255, 0.05)",
    transform: [{ scale: 2 }],
  },
  scroll: { paddingBottom: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandText: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  narrative: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  narrativeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    // alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.2)",
  },
  narrativeBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 1,
  },
  narrativeTitle: {
    color: COLORS.onSurface,
    fontSize: 52,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "300",
    letterSpacing: -2,
    lineHeight: 56,
    textAlign: "center",
  },
  narrativeTitleItalic: {
    color: COLORS.primary,
    fontStyle: "italic",
    fontWeight: "900",
  },
  narrativeSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 26,
    opacity: 0.8,
    textAlign: "center",
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  avatarStack: { flexDirection: "row" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.surface,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  socialProofText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "600",
  },
  formSection: { paddingHorizontal: 16, marginTop: 20 },
  loginCard: { padding: 32, gap: 32 },
  cardHeader: { gap: 8 },
  cardTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.7,
  },
  form: { gap: 24 },
  field: { gap: 10 },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
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
    height: 60,
    borderWidth: 1,
    borderColor: "transparent",
  },
  input: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
  },
  inputError: { borderColor: "rgba(235, 87, 87, 0.3)" },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    marginTop: 4,
  },
  forgotBtn: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actions: { gap: 20 },
  submitBtn: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: {
    color: COLORS.outline,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 2,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  biometricText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "600",
  },
  socialLogins: { gap: 24, marginTop: 10 },
  socialButtons: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  signupLink: { alignSelf: "center" },
  signupText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "500",
  },
  signupHighlight: { color: COLORS.primary, fontWeight: "700" },
});
