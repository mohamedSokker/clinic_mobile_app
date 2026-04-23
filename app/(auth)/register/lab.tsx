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
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
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

const labRegisterSchema = z
  .object({
    labName: z.string().min(1, "Lab Name is required"),
    licenseNumber: z.string().min(1, "License Number is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    mobile: z.string().min(5, "Mobile is required"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirmation must be at least 6 characters"),
    analysisTypes: z
      .array(z.string())
      .min(1, "Select at least one analysis type"),
    partnershipLevel: z.string().min(1, "Required"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LabRegisterInputs = z.infer<typeof labRegisterSchema>;

export default function LabRegister() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LabRegisterInputs>({
    resolver: zodResolver(labRegisterSchema),
    mode: "onChange",
    defaultValues: {
      labName: "",
      licenseNumber: "",
      email: "",
      mobile: "",
      location: "",
      password: "",
      confirmPassword: "",
      analysisTypes: [],
      partnershipLevel: "Standard",
      terms: false,
    },
  });

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: LabRegisterInputs) => {
    setLoading(true);
    try {
      // 1. Register User in Firebase & Initial Sync
      const user = await registerUser(
        data.email.trim().toLowerCase(),
        data.password,
        {
          role: "lab",
          name: data.labName.trim(),
          email: data.email.trim().toLowerCase(),
          mobile: data.mobile.trim(),
          labName: data.labName.trim(),
          location: data.location.trim(),
          licenseNumber: data.licenseNumber.trim(),
          analysisTypes: data.analysisTypes,
          partnershipLevel: data.partnershipLevel,
          type: "Clinical", // Default base type
        } as any,
      );

      // 2. Photo Upload (if exists)
      if (photoUri) {
        try {
          const photoURL = await uploadProfilePhoto(user.uid, photoUri);
          await api.patch("/users/me", { photoURL });
        } catch (photoErr) {
          console.error("Non-blocking Photo Upload Error:", photoErr);
        }
      }

      // 3. Finalize Login
      await login(data.email.trim().toLowerCase(), data.password);

      Toast.show({
        type: "success",
        text1: "Welcome Partner",
        text2: "Your laboratory ecosystem has been initialized.",
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
              <Text style={styles.heroBadge}>PARTNER ECOSYSTEM</Text>
              <Text style={styles.heroTitle}>
                Lab Partner{"\n"}
                <Text style={{ color: COLORS.primary }}>Registration</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Join our network of elite diagnostic centers. Integrate your
                services into a seamless clinical workflow.
              </Text>
            </View>

            <GlassCard
              style={styles.formCard}
              variant="strong"
              radius={RADIUS.xl}
            >
              {/* Profile Photo */}
              <View style={styles.photoSection}>
                <Text style={styles.fieldLabel}>FACILITY LOGO / HEADSHOT</Text>
                <TouchableOpacity onPress={pickImage} style={styles.photoBox}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialIcons
                        name="add-a-photo"
                        size={40}
                        color={COLORS.onSurfaceVariant}
                      />
                      <Text style={styles.photoPlaceholderText}>
                        Upload Photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.photoTip}>
                  Required: JPEG or PNG, max 5MB
                </Text>
              </View>

              {/* Facility Identity */}
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="account-balance"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Facility Identity</Text>
              </View>

              <View style={styles.formContent}>
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>LAB NAME</Text>
                  <Controller
                    control={control}
                    name="labName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Precision Diagnostics"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.labName && (
                    <Text style={styles.errorText}>
                      {errors.labName.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>LICENSE NUMBER</Text>
                  <Controller
                    control={control}
                    name="licenseNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="MD-8829-X"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.licenseNumber && (
                    <Text style={styles.errorText}>
                      {errors.licenseNumber.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CONTACT EMAIL</Text>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="facility@vitreous.io"
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>LOCATION</Text>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="City, Country"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                          />
                        </View>
                      )}
                    />
                    {errors.location && (
                      <Text style={styles.errorText}>
                        {errors.location.message}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldColumn}>
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

                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CONFIRM</Text>
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
              </View>

              {/* Analysis Portfolio */}
              <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                <MaterialIcons
                  name="science"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Analysis Portfolio</Text>
              </View>

              <Controller
                control={control}
                name="analysisTypes"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.portfolioGrid}>
                    {[
                      { id: "blood", label: "Blood", icon: "opacity" },
                      { id: "imaging", label: "Imaging", icon: "science" },
                      {
                        id: "biometry",
                        label: "Biometry",
                        icon: "accessibility",
                      },
                    ].map((item) => {
                      const selected = value.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => {
                            if (selected) {
                              onChange(
                                value.filter((id: string) => id !== item.id),
                              );
                            } else {
                              onChange([...value, item.id]);
                            }
                          }}
                          style={[
                            styles.portfolioItem,
                            selected && styles.portfolioItemSelected,
                          ]}
                        >
                          <MaterialIcons
                            name={item.icon as any}
                            size={32}
                            color={
                              selected
                                ? COLORS.primary
                                : "rgba(255,255,255,0.3)"
                            }
                          />
                          <Text
                            style={[
                              styles.portfolioLabel,
                              selected && styles.portfolioLabelSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
              {errors.analysisTypes && (
                <Text style={styles.errorText}>
                  {errors.analysisTypes.message}
                </Text>
              )}

              {/* Partnership Level */}
              <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                <MaterialIcons
                  name="payments"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Partnership Level</Text>
              </View>

              <Controller
                control={control}
                name="partnershipLevel"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.tierList}>
                    {[
                      {
                        id: "Pro",
                        title: "Clinical Pro",
                        desc: "High-volume routing & AI integration",
                        price: "$299",
                      },
                      {
                        id: "Standard",
                        title: "Standard",
                        desc: "Digital reporting & patient portal",
                        price: "$99",
                      },
                    ].map((tier) => (
                      <TouchableOpacity
                        key={tier.id}
                        onPress={() => onChange(tier.id)}
                        style={[
                          styles.tierItem,
                          value === tier.id && styles.tierItemSelected,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierTitle}>{tier.title}</Text>
                          <Text style={styles.tierDesc}>{tier.desc}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.tierPrice}>{tier.price}</Text>
                          <Text style={styles.tierPeriod}>/month</Text>
                        </View>
                        {value === tier.id && (
                          <View style={styles.tierBadge}>
                            <MaterialIcons
                              name="check-circle"
                              size={16}
                              color={COLORS.primary}
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />

              {/* Terms */}
              <View style={{ marginTop: 32 }}>
                <Controller
                  control={control}
                  name="terms"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      onPress={() => onChange(!value)}
                      style={styles.termsContainer}
                    >
                      <MaterialIcons
                        name={value ? "check-box" : "check-box-outline-blank"}
                        size={22}
                        color={value ? COLORS.primary : "rgba(255,255,255,0.2)"}
                      />
                      <Text style={styles.termsText}>
                        I agree to the{" "}
                        <Text style={{ color: COLORS.primary }}>
                          Terms of Medical Data Interchange
                        </Text>
                        .
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
                label="Initialize Partnership"
                loading={loading}
                disabled={!isValid}
                size="lg"
                variant="primary"
                style={{ marginTop: 24, opacity: isValid ? 1 : 0.5 }}
              />
            </GlassCard>

            {/* Bento Section */}
            <View style={styles.bentoSection}>
              <GlassCard style={styles.bentoCard} variant="strong">
                <View style={styles.bentoIcon}>
                  <MaterialIcons
                    name="device-hub"
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.bentoTitle}>Universal Lab API</Text>
                <Text style={styles.bentoDesc}>
                  Connect existing diagnostic hardware to our unified reporting
                  engine.
                </Text>
                <View style={styles.tagRow}>
                  <Text style={styles.tag}>HL7 COMPATIBLE</Text>
                  <Text style={styles.tag}>FHIR STANDARD</Text>
                </View>
              </GlassCard>

              <View style={styles.statsRow}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsVal}>42k</Text>
                  <Text style={styles.statsLabel}>REPORTS SYNCED / MO</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={styles.statsVal}>99%</Text>
                  <Text style={styles.statsLabel}>UPTIME GUARANTEE</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginBtn}
            >
              <Text style={styles.loginText}>
                Already registered?{" "}
                <Text style={{ color: COLORS.primary }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
  heroBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: COLORS.onSurface,
    fontSize: 42,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 24,
    opacity: 0.7,
  },
  formCard: {
    padding: 24,
    backgroundColor: "rgba(28,38,55,0.6)",
    borderWidth: 0,
  },
  photoSection: { marginBottom: 32 },
  photoBox: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 12,
  },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { alignItems: "center", gap: 8 },
  photoPlaceholderText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
  },
  photoTip: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  formContent: { gap: 20 },
  fieldColumn: { gap: 8 },
  fieldRow: { flexDirection: "column", gap: 16 },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },
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
  },
  portfolioGrid: { flexDirection: "row", gap: 12 },
  portfolioItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  portfolioItemSelected: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    borderColor: COLORS.primary,
  },
  portfolioLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "600",
  },
  portfolioLabelSelected: { color: COLORS.primary },
  tierList: { gap: 12 },
  tierItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    position: "relative",
  },
  tierItemSelected: {
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  tierTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  tierDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
    opacity: 0.6,
  },
  tierPrice: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  tierPeriod: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    opacity: 0.5,
  },
  tierBadge: { position: "absolute", top: 12, right: 12 },
  termsContainer: { flexDirection: "row", gap: 12, alignItems: "center" },
  termsText: {
    flex: 1,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },
  bentoSection: { marginTop: 48, gap: 16 },
  bentoCard: { padding: 32, gap: 16 },
  bentoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bentoTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  bentoDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    opacity: 0.7,
  },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.1)",
  },
  statsRow: { flexDirection: "row", gap: 16 },
  statsCard: {
    flex: 1,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.xl,
    gap: 8,
  },
  statsVal: {
    color: COLORS.primary,
    fontSize: 32,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    opacity: 0.4,
  },
  statsLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },
  loginBtn: { alignItems: "center", marginTop: 40 },
  loginText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
  },
});
