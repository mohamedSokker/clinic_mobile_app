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
import { createDoctor } from "@/services/doctorService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  SPECIALIZATIONS,
  FONT_FAMILY,
  GRADIENTS,
  SHADOWS,
} from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadProfilePhoto } from "@/services/storageService";
import { useStripe } from "@stripe/stripe-react-native";
import api from "@/lib/api";

const { width, height } = Dimensions.get("window");

const doctorRegisterSchema = z.object({
  name: z.string().min(1, "Practitioner Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  mobile: z.string().min(5, "Mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  clinicName: z.string().min(1, "Clinic Name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  location: z.string().min(1, "Location is required"),
  visitCost: z
    .string()
    .min(1, "Consultation Fee is required")
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number"),
  about: z.string().optional(),
});

type DoctorRegisterInputs = z.infer<typeof doctorRegisterSchema>;

export default function DoctorRegister() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [cardLast4, setCardLast4] = useState("4242");
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

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
      mediaTypes: 'images',
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
    watch,
    formState: { errors },
  } = useForm<DoctorRegisterInputs>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      clinicName: "",
      specialization: "General Practice",
      visitCost: "",
      location: "",
      about: "",
    },
  });
  const onSubmit = async (data: DoctorRegisterInputs) => {
    setLoading(true);
    try {
      // 1. Register User in Firebase (if not already done)
      let user = registeredUser;
      if (!user) {
        user = await registerUser(
          data.email.trim().toLowerCase(),
          data.password,
          {
            role: "doctor",
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            mobile: data.mobile.trim(),
          } as any,
        );
        setRegisteredUser(user);
      }

      // 2. Process Payment (if not already done)
      if (!paymentReady) {
        const intentRes = await api.post("/payments/create-intent", {
          amount: 2400,
          userId: user.uid,
          role: "doctor",
          email: data.email.trim().toLowerCase(),
          name: data.name.trim(),
        });

        const { clientSecret, customerId, ephemeralKey } = intentRes.data;

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          customerId,
          customerEphemeralKeySecret: ephemeralKey,
          merchantDisplayName: "Vitreous Clinic",
          appearance: {
            colors: {
              primary: COLORS.primary,
              background: "#070e1a",
              componentBackground: "#1c2637",
              componentBorder: "#FFFFFF1A",
              placeholderText: "#FFFFFF66",
              primaryText: "#FFFFFF",
              secondaryText: "#FFFFFF99",
            },
          },
        });

        if (initError) throw initError;

        const { error: paymentError } = await presentPaymentSheet();
        if (paymentError) {
          if (paymentError.code === "Canceled") {
            Toast.show({
              type: "info",
              text1: "Payment Cancelled",
              text2: "Subscription is required to join the network.",
            });
            return;
          }
          throw paymentError;
        }
        setPaymentReady(true);
      }

      // 4. Photo Upload (if exists)
      let photoURL = undefined;
      if (photoUri) {
        try {
          photoURL = await uploadProfilePhoto(user.uid, photoUri);
        } catch (photoErr) {
          console.error("Non-blocking Photo Upload Error:", photoErr);
          // We don't throw here so the doctor profile still gets created in DB
          // even if the photo upload fails after they've already paid.
        }
      }

      // 5. Finalize Doctor Profile
      await createDoctor({
        uid: user.uid,
        doctorName: data.name.trim(),
        clinicName: data.clinicName.trim(),
        specialization: data.specialization,
        location: data.location.trim(),
        mobile: data.mobile.trim(),
        visitCost: parseFloat(data.visitCost) || 0,
        photoURL,
        about: data.about?.trim() || undefined,
        subscriptionActive: true,
        schedule: {},
        workingDays: [],
        slotDurationMinutes: 30,
      });

      await login(data.email.trim().toLowerCase(), data.password);
    } catch (err: any) {
      console.error("Registration/Payment Error:", err);
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

      {/* Simulation of HTML background radial gradients */}
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
          <Text style={styles.logoText}>VITREOUS CLINIC</Text>
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
              <Text style={styles.heroTitle}>Join the{"\n"}Network.</Text>
              <Text style={styles.heroSubtitle}>
                Onboard your practice to the most advanced medical ecosystem.
                Streamline your clinic operations and connect with patients
                seamlessly.
              </Text>
            </View>

            {/* Clinic Identity Card */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <MaterialIcons
                  name="assignment"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Clinic Identity</Text>
                <Text style={styles.sectionSubtitle}>
                  Essential information about your practice
                </Text>
              </View>
            </View>

            <GlassCard
              style={styles.formCard}
              variant="strong"
              radius={RADIUS.xl}
            >
              {/* Profile Photo Section */}
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
                      Upload a professional headshot
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

              {/* Form Fields Stack */}
              <View style={styles.formContent}>
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>CLINIC NAME</Text>
                  <Controller
                    control={control}
                    name="clinicName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Lumina Health Center"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.clinicName && (
                    <Text style={styles.errorText}>
                      {errors.clinicName.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>LOCATION</Text>
                  <Controller
                    control={control}
                    name="location"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="City, Country"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.location && (
                    <Text style={styles.errorText}>
                      {errors.location.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>PRACTITIONER NAME</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Dr. Julian Vane"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name.message}</Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>SPECIALIZATION</Text>
                  <Controller
                    control={control}
                    name="specialization"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.pickerWrapper}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={{ marginHorizontal: -4 }}
                        >
                          {[
                            "General Practice",
                            "Cardiology",
                            "Ophthalmology",
                            "Neurology",
                            "Dermatology",
                          ].map((item) => (
                            <TouchableOpacity
                              key={item}
                              onPress={() => onChange(item)}
                              style={[
                                styles.pickerItem,
                                value === item && styles.pickerItemActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pickerItemText,
                                  value === item && styles.pickerItemTextActive,
                                ]}
                              >
                                {item.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>MOBILE CONTACT</Text>
                    <Controller
                      control={control}
                      name="mobile"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="+1 (555) 000-0000"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="phone-pad"
                        />
                      )}
                    />
                    {errors.mobile && (
                      <Text style={styles.errorText}>
                        {errors.mobile.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>CONSULTATION FEE</Text>
                    <View style={styles.inputWithIcon}>
                      <Text style={styles.inputPrefix}>$</Text>
                      <Controller
                        control={control}
                        name="visitCost"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[styles.input, { paddingLeft: 24 }]}
                            placeholder="150"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        )}
                      />
                    </View>
                    {errors.visitCost && (
                      <Text style={styles.errorText}>
                        {errors.visitCost.message}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>WORK EMAIL</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="doctor@vitreous.com"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    )}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>SECURE PASSWORD</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry
                      />
                    )}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>PROFESSIONAL BIO</Text>
                  <Controller
                    control={control}
                    name="about"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          { height: 100, textAlignVertical: "top" },
                        ]}
                        placeholder="Describe your expertise..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                      />
                    )}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Professional Standing Card */}
            <View style={styles.standingCard}>
              <View style={styles.standingIconWrapper}>
                <MaterialIcons
                  name="verified-user"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.standingTitle}>
                  Verify Professional Standing
                </Text>
                <Text style={styles.standingDesc}>
                  Upload your medical license or clinic certification for
                  instant verification and trusted badge.
                </Text>
              </View>
              <TouchableOpacity style={styles.uploadMiniButton}>
                <Text style={styles.uploadMiniButtonText}>Upload Files</Text>
              </TouchableOpacity>
            </View>

            {/* Professional Plan Section */}
            <View style={styles.planCard}>
              <View style={styles.planGlow} />

              <Text style={styles.planHeader}>Professional Plan</Text>

              <View style={styles.featureList}>
                {[
                  {
                    title: "Unlimited Consultations",
                    desc: "Manage as many patients as you need.",
                  },
                  {
                    title: "Advanced Telehealth Tools",
                    desc: "HD Video, shared records, and live chat.",
                  },
                  {
                    title: "Cloud Records Storage",
                    desc: "HIPAA compliant encrypted storage.",
                  },
                ].map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View>
                      <Text style={styles.featureTitle}>{feat.title}</Text>
                      <Text style={styles.featureDesc}>{feat.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.pricingBox}>
                <View>
                  <Text style={styles.billingType}>ANNUAL BILLING</Text>
                  <Text style={styles.priceText}>
                    $2,400<Text style={styles.priceSubText}>/year</Text>
                  </Text>
                </View>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 20%</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.paymentDetailsLabel}>PAYMENT DETAILS</Text>
                <View style={styles.creditCardBox}>
                  <View style={styles.creditCardLeft}>
                    <MaterialIcons
                      name="credit-card"
                      size={20}
                      color={COLORS.onSurfaceVariant}
                    />
                    <Text style={styles.cardNumber}>•••• •••• •••• {cardLast4}</Text>
                  </View>
                  <TouchableOpacity onPress={handleSubmit(onSubmit)}>
                    <Text style={styles.changeLink}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <GradientButton
                onPress={handleSubmit(onSubmit)}
                label="Complete Subscription & Payment"
                size="lg"
                variant="secondary"
                loading={loading}
                style={{ marginTop: 12 }}
                textStyle={{ textAlign: "center" }}
              />

              <Text style={styles.termsText}>
                By finalizing, you agree to Vitreous Clinic's Service Terms and
                Privacy Policy. Your practice will be activated within 24 hours.
              </Text>
            </View>

            {/* Testimonial Section */}
            <View style={styles.testimonialContainer}>
              <Image
                source={require("../../../assets/images/clinic_modern.png")}
                style={styles.testimonialImage}
              />
              <LinearGradient
                colors={["transparent", "#070e1a"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.testimonialContent}>
                <Text style={styles.testimonialQuote}>
                  "Vitreous changed how we handle ophthalmic data. The precision
                  is unmatched."
                </Text>
                <Text style={styles.testimonialAuthor}>
                  — Dr. Elena Rossi, Milan Eye Center
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginWrap}
            >
              <Text style={styles.loginText}>
                Existing partner?{" "}
                <Text
                  style={{
                    color: COLORS.primary,
                    fontFamily: FONT_FAMILY.headline,
                  }}
                >
                  Authorize Access
                </Text>
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

  scroll: { padding: 24, paddingBottom: 100 },

  hero: { marginBottom: 64, marginTop: 32 },
  heroTitle: {
    color: COLORS.primary,
    fontSize: 56,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 60,
    marginBottom: 16,
    textAlign: "center",
  },
  heroSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 18,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 28,
    opacity: 0.8,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  sectionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.6,
  },

  formCard: { padding: 24, gap: 24 },
  photoSection: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 32,
    marginBottom: 32,
  },
  photoRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    marginTop: 16,
  },
  photoPreviewWrapper: { position: "relative" },
  photoPreview: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "rgba(64, 206, 243, 0.2)",
    backgroundColor: "#1c2637",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#070e1a",
  },
  photoInfo: { flex: 1, gap: 8 },
  photoPrimaryText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  photoSecondaryText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    opacity: 0.6,
  },
  photoButton: {
    backgroundColor: "#1c2637",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(65, 72, 86, 0.3)",
  },
  photoButtonText: { color: COLORS.onSurface, fontSize: 13, fontWeight: "600" },

  formContent: { gap: 24 },
  fieldRow: { flexDirection: "row", gap: 16 },
  fieldColumn: { flex: 1, gap: 8 },
  fieldLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    opacity: 0.5,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#1c2637",
    color: COLORS.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 4,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  inputWithIcon: { position: "relative" },
  inputPrefix: {
    position: "absolute",
    left: 16,
    top: 16,
    color: COLORS.primary,
    fontWeight: "900",
    zIndex: 1,
  },

  pickerWrapper: { marginTop: 4 },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  pickerItemActive: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  pickerItemText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: "700",
  },
  pickerItemTextActive: { color: COLORS.primary },

  standingCard: {
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: 32,
    borderRadius: 12,
    backgroundColor: "rgba(7, 14, 26, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
    borderStyle: "dashed",
    marginTop: 32,
    marginBottom: 32,
    textAlign: "center",
  },
  standingIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  standingTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  standingDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
    textAlign: "center",
  },
  uploadMiniButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: "#172030",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  uploadMiniButtonText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: "700",
  },

  planCard: {
    padding: 32,
    borderRadius: 12,
    overflow: "hidden",
    gap: 32,
    backgroundColor: "#172030",
  },
  planGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  planHeader: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },

  featureList: { gap: 24 },
  featureItem: { flexDirection: "row", gap: 16 },
  featureTitle: { color: COLORS.onSurface, fontSize: 16, fontWeight: "700" },
  featureDesc: { color: COLORS.onSurfaceVariant, fontSize: 13, opacity: 0.6 },

  pricingBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  billingType: {
    color: COLORS.outline,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  priceText: { color: COLORS.onSurface, fontSize: 36, fontWeight: "900" },
  priceSubText: { fontSize: 14, fontWeight: "400", opacity: 0.5 },
  saveBadge: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  saveBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  paymentDetailsLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    opacity: 0.5,
  },
  creditCardBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1c2637",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  creditCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardNumber: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: "monospace",
  },
  changeLink: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

  termsText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textAlign: "center",
    opacity: 0.5,
    lineHeight: 16,
    paddingHorizontal: 24,
  },

  testimonialContainer: {
    marginTop: 64,
    borderRadius: 12,
    overflow: "hidden",
    height: 192,
  },
  testimonialImage: { width: "100%", height: "100%", resizeMode: "cover" },
  testimonialContent: { position: "absolute", bottom: 16, left: 16, right: 16 },
  testimonialQuote: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 4,
  },
  testimonialAuthor: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

  loginWrap: { alignItems: "center", marginTop: 48 },
  loginText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
});
