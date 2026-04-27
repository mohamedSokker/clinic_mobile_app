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
  ActivityIndicator,
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
import axios from "axios";
import { useDebounce } from "use-debounce";

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
    age: z.string().optional(),
    gender: z.string().optional(),
    bloodType: z.string().optional(),
    location: z.string().min(1, "Location is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
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

  // Location Search State
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery] = useDebounce(locationQuery, 800);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  React.useEffect(() => {
    if (debouncedLocationQuery.length > 2) {
      searchLocations(debouncedLocationQuery);
    } else {
      setLocationSuggestions([]);
    }
  }, [debouncedLocationQuery]);

  const searchLocations = async (query: string) => {
    setIsSearchingLocation(true);
    try {
      const response = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`,
      );
      setLocationSuggestions(response.data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

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
    setValue,
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
      age: "",
      gender: "",
      bloodType: "",
      weight: "",
      height: "",
      location: "",
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
          age: data.age,
          gender: data.gender,
          bloodType: data.bloodType,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          weight: data.weight ? parseFloat(data.weight) : undefined,
          height: data.height ? parseFloat(data.height) : undefined,
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

                {/* Enhanced Location Field with Search */}
                <View style={[styles.fieldColumn, { zIndex: 100 }]}>
                  <Text style={styles.fieldLabel}>LOCATION</Text>
                  <Controller
                    control={control}
                    name="location"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 123 Health St, NY"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={locationQuery}
                          onBlur={onBlur}
                          onChangeText={(txt) => {
                            setLocationQuery(txt);
                            onChange(txt);
                            if (txt === "") setShowSuggestions(false);
                          }}
                        />
                        {isSearchingLocation ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.primary}
                            style={{ marginRight: 8 }}
                          />
                        ) : (
                          <MaterialIcons
                            name="location-on"
                            size={20}
                            color="rgba(255,255,255,0.2)"
                          />
                        )}
                      </View>
                    )}
                  />

                  {showSuggestions && locationSuggestions.length > 0 && (
                    <View style={styles.suggestionsDropdownContainer}>
                      <GlassCard
                        style={styles.suggestionsDropdown}
                        variant="strong"
                      >
                        <ScrollView
                          style={{ maxHeight: 250 }}
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="always"
                        >
                          {locationSuggestions.map((item, idx) => {
                            const props = item.properties;
                            const mainName =
                              props.name || props.street || "Selected Location";
                            const subName = `${props.city || props.state || ""}, ${props.country || ""}`;
                            const fullDisplayName = `${mainName}, ${subName}`;

                            return (
                              <TouchableOpacity
                                key={idx}
                                style={styles.suggestionItem}
                                onPress={() => {
                                  setValue("location", fullDisplayName);
                                  setValue(
                                    "latitude",
                                    item.geometry.coordinates[1],
                                  );
                                  setValue(
                                    "longitude",
                                    item.geometry.coordinates[0],
                                  );
                                  setLocationQuery(fullDisplayName);
                                  setShowSuggestions(false);
                                }}
                              >
                                <MaterialIcons
                                  name="place"
                                  size={18}
                                  color={COLORS.primary}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={styles.suggestionTitle}
                                    numberOfLines={1}
                                  >
                                    {mainName}
                                  </Text>
                                  <Text
                                    style={styles.suggestionSubtitle}
                                    numberOfLines={1}
                                  >
                                    {subName}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </GlassCard>
                    </View>
                  )}

                  {errors.location && (
                    <Text style={styles.errorText}>
                      {errors.location.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <Controller
                      control={control}
                      name="age"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="28"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>GENDER</Text>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field: { onChange, value } }) => (
                        <View style={styles.genderRow}>
                          {["Male", "Female"].map((g) => (
                            <TouchableOpacity
                              key={g}
                              style={[
                                styles.genderBtn,
                                value === g && styles.genderBtnActive,
                              ]}
                              onPress={() => onChange(g)}
                            >
                              <Text
                                style={[
                                  styles.genderBtnText,
                                  value === g && styles.genderBtnTextActive,
                                ]}
                              >
                                {g}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                    <Controller
                      control={control}
                      name="weight"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="70"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
                    <Controller
                      control={control}
                      name="height"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="175"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>
                  <View style={[styles.fieldColumn, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>BLOOD TYPE</Text>
                    <Controller
                      control={control}
                      name="bloodType"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="O+"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                          />
                        </View>
                      )}
                    />
                  </View>
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
  suggestionsDropdownContainer: {
    marginTop: 8,
    zIndex: 2000,
  },
  suggestionsDropdown: {
    maxHeight: 280,
    borderRadius: 16,
    overflow: "hidden",
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontFamily: FONT_FAMILY.headline,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.5,
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
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  genderBtnActive: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    borderColor: COLORS.primary,
  },
  genderBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "700",
  },
  genderBtnTextActive: {
    color: COLORS.primary,
  },
});
