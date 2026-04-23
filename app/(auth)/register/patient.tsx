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
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuthStore, registerUser } from "@/stores/authStore";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadProfilePhoto } from "@/services/storageService";
import api from "@/lib/api";

const { width, height } = Dimensions.get("window");

const patientRegisterSchema = z
  .object({
    name: z.string().min(1, "Full Name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    mobile: z.string().min(5, "Mobile is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirmation must be at least 6 characters"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PatientRegisterInputs = z.infer<typeof patientRegisterSchema>;

export default function PatientRegister() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "We need gallery access to upload your photo.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PatientRegisterInputs>({
    resolver: zodResolver(patientRegisterSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      terms: false as any,
    },
  });

  const onSubmit = async (data: PatientRegisterInputs) => {
    setLoading(true);
    try {
      // 1. Register User in Firebase
      const user = await registerUser(
        data.email.trim().toLowerCase(),
        data.password,
        {
          role: "patient",
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          mobile: data.mobile.trim(),
        } as any,
      );

      // 2. Photo Upload (if exists)
      if (photoUri) {
        try {
          const photoURL = await uploadProfilePhoto(user.uid, photoUri);
          // 3. Update backend with the photoURL
          await api.patch("/users/me", { photoURL });
        } catch (photoErr) {
          console.error("Non-blocking Photo Upload Error:", photoErr);
        }
      }

      // 4. Finalize Login
      await login(data.email.trim().toLowerCase(), data.password);

      Toast.show({
        type: "success",
        text1: "Welcome to Vitreous",
        text2: "Your clinical identity has been initialized.",
      });
    } catch (err: any) {
      console.error("Registration Error:", err);
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: err?.message || "An unexpected error occurred",
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

      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <BackgroundDecor />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={COLORS.onSurface}
            />
          </TouchableOpacity>
          <Text style={styles.logoText}>VITREOUS LAB</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                Join the{" "}
                <Text style={{ color: COLORS.primary }}>Precision</Text>{" "}
                Network.
              </Text>
              <Text style={styles.heroSubtitle}>
                Create your secure patient profile to access diagnostic wellness
                reports and clinical care.
              </Text>
            </View>

            <GlassCard
              style={styles.formCard}
              variant="strong"
              radius={RADIUS.xl}
            >
              {/* Profile Photo Upload Section */}
              <View style={styles.photoSection}>
                <Text style={styles.fieldLabel}>PROFILE PHOTO</Text>
                <View style={styles.photoRow}>
                  <View style={styles.photoPreviewWrapper}>
                    <View style={styles.photoPreview}>
                      {photoUri ? (
                        <Image
                          source={{ uri: photoUri }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <MaterialIcons
                          name="add-a-photo"
                          size={32}
                          color={COLORS.onSurfaceVariant}
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.photoEditBadge}
                    >
                      <MaterialIcons
                        name="edit"
                        size={14}
                        color={COLORS.onPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoPrimaryText}>
                      Upload a secure clinical photo
                    </Text>
                    <Text style={styles.photoSecondaryText}>
                      JPG, PNG or GIF. Max size 2MB.
                    </Text>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.photoButtonText}>Upload Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.formContent}>
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Elias Vance"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                        <MaterialIcons
                          name="person"
                          size={20}
                          color="rgba(255,255,255,0.2)"
                        />
                      </View>
                    )}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name.message}</Text>
                  )}
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="vance@vitreous.io"
                            placeholderTextColor="rgba(255,255,255,0.2)"
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

                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
                    <Controller
                      control={control}
                      name="mobile"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="phone-pad"
                          />
                        </View>
                      )}
                    />
                    {errors.mobile && (
                      <Text style={styles.errorText}>
                        {errors.mobile.message}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PASSWORD</Text>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                          />
                        </View>
                      )}
                    />
                    {errors.password && (
                      <Text style={styles.errorText}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                          />
                        </View>
                      )}
                    />
                    {errors.confirmPassword && (
                      <Text style={styles.errorText}>
                        {errors.confirmPassword.message}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldColumn}>
                  <Controller
                    control={control}
                    name="terms"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        onPress={() => onChange(!value)}
                        style={styles.termsContainer}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={value ? "check-box" : "check-box-outline-blank"}
                          size={22}
                          color={
                            value ? COLORS.primary : "rgba(255,255,255,0.2)"
                          }
                        />
                        <Text style={styles.termsText}>
                          I agree to the{" "}
                          <Text style={{ color: COLORS.primary }}>
                            Terms of Service
                          </Text>{" "}
                          and{" "}
                          <Text style={{ color: COLORS.primary }}>
                            Privacy Policy
                          </Text>{" "}
                          regarding my medical data handling.
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  {errors.terms && (
                    <Text style={styles.errorText}>{errors.terms.message}</Text>
                  )}
                </View>

                <GradientButton
                  onPress={handleSubmit(onSubmit)}
                  label="Create Account"
                  loading={loading}
                  size="lg"
                  variant="primary"
                  disabled={!isValid}
                  style={{
                    marginTop: 12,
                    opacity: isValid ? 1 : 0.5,
                  }}
                />

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login")}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginText}>
                    Already have a clinical profile?{" "}
                    <Text style={styles.loginHighlight}>Log in here</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Compliance Badges */}
            <View style={styles.complianceRow}>
              <View style={styles.complianceItem}>
                <MaterialIcons
                  name="enhanced-encryption"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.complianceText}>HIPAA COMPLIANT</Text>
              </View>
              <View style={styles.complianceItem}>
                <MaterialIcons
                  name="verified-user"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.complianceText}>IDENTITY VERIFIED</Text>
              </View>
              <View style={styles.complianceItem}>
                <MaterialIcons
                  name="science"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.complianceText}>CLINICAL PRECISION</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  bgGlowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height * 0.5,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    borderRadius: width,
    transform: [{ scale: 2 }, { translateY: -height * 0.25 }],
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: width,
    height: height * 0.5,
    backgroundColor: "rgba(197, 126, 255, 0.05)",
    borderRadius: width,
    transform: [{ scale: 2 }, { translateY: height * 0.25 }],
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(7, 14, 26, 0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  scroll: { padding: 24, paddingBottom: 60 },
  hero: { marginBottom: 40, marginTop: 20 },
  heroTitle: {
    color: COLORS.onSurface,
    fontSize: 42,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "300",
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    opacity: 0.7,
  },
  formCard: {
    padding: 24,
    backgroundColor: "rgba(28,38,55,0.6)",
    borderWidth: 0,
  },
  photoSection: { marginBottom: 32 },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  photoPreviewWrapper: { position: "relative" },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#070e1a",
  },
  photoInfo: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPrimaryText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "600",
  },
  photoSecondaryText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.6,
  },
  photoButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
    // alignSelf: "flex-start",
  },
  photoButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
  },
  formContent: { gap: 20 },
  fieldColumn: { gap: 8 },
  fieldRow: { flexDirection: "column", gap: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    height: 56,
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    marginTop: 4,
    marginLeft: 4,
  },
  termsContainer: { flexDirection: "row", gap: 12, marginTop: 8 },
  termsText: {
    flex: 1,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },
  loginLink: { marginTop: 12, alignItems: "center" },
  loginText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },
  loginHighlight: { color: COLORS.primary, fontWeight: "600" },
  complianceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 40,
    opacity: 0.5,
  },
  complianceItem: { alignItems: "center", gap: 6 },
  complianceText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
