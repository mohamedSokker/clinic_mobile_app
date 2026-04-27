import React, { useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuthStore, registerUser } from "@/stores/authStore";
import { createLab } from "@/services/labService";
import {
  COLORS,
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
import axios from "axios";
import { useDebounce } from "use-debounce";

const { width, height } = Dimensions.get("window");

const DIAGNOSTIC_SERVICES = [
  { id: "FBC", label: "Full Blood Count", icon: "bloodtype", provider: MaterialIcons },
  { id: "Glucose", label: "Glucose Tolerance", icon: "water-drop", provider: MaterialIcons },
  { id: "MRI", label: "MRI Scan", icon: "settings-overscan", provider: MaterialIcons },
  { id: "Metabolic", label: "Metabolic Panel", icon: "biotech", provider: MaterialIcons },
  { id: "Lipids", label: "Lipid Profile", icon: "opacity", provider: MaterialIcons },
  { id: "Microbiology", label: "Microbiology", icon: "bug-report", provider: MaterialIcons },
  { id: "Immunology", label: "Immunology", icon: "shield", provider: MaterialIcons },
  { id: "Hormones", label: "Hormone Panel", icon: "medical-services", provider: MaterialIcons },
  { id: "Genetics", label: "Genetic Screening", icon: "dna", provider: FontAwesome5 },
  { id: "Pathology", label: "Histopathology", icon: "biotech", provider: MaterialIcons },
  { id: "Toxicology", label: "Toxicology", icon: "science", provider: MaterialIcons },
  { id: "Urinalysis", label: "Urinalysis", icon: "water", provider: MaterialIcons },
];

const labRegisterSchema = z.object({
  labName: z.string().min(1, "Lab Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  mobile: z.string().min(5, "Mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  location: z.string().min(1, "Location is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.string().min(1, "Lab Type is required"),
  licenseNumber: z.string().optional(),
});

type LabRegisterInputs = z.infer<typeof labRegisterSchema>;

export default function LabRegister() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceCosts, setServiceCosts] = useState<Record<string, string>>({});
  const [editingService, setEditingService] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState("");

  // Location Search State
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery] = useDebounce(locationQuery, 800);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debouncedLocationQuery.length > 2) {
      searchLocations(debouncedLocationQuery);
    } else {
      setLocationSuggestions([]);
    }
  }, [debouncedLocationQuery]);

  const searchLocations = async (query: string) => {
    setIsSearchingLocation(true);
    try {
      // Using Photon API for better search results
      const response = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
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
        text2: "Gallery access needed.",
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
    formState: { errors },
  } = useForm<LabRegisterInputs>({
    resolver: zodResolver(labRegisterSchema),
    defaultValues: {
      labName: "",
      email: "",
      mobile: "",
      password: "",
      location: "",
      type: "Clinical",
      licenseNumber: "",
    },
  });

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
      setServiceCosts((prev) => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
    } else {
      setEditingService(serviceId);
      setTempCost("");
    }
  };

  const saveCost = () => {
    if (editingService) {
      if (!selectedServices.includes(editingService)) {
        setSelectedServices((prev) => [...prev, editingService]);
      }
      setServiceCosts((prev) => ({
        ...prev,
        [editingService]: tempCost,
      }));
      setEditingService(null);
      setTempCost("");
    }
  };

  const onSubmit = async (data: LabRegisterInputs) => {
    setLoading(true);
    try {
      const user = await registerUser(
        data.email.trim().toLowerCase(),
        data.password,
        {
          role: "lab",
          name: data.labName.trim(),
          email: data.email.trim().toLowerCase(),
          mobile: data.mobile.trim(),
        } as any,
      );

      let photoURL = undefined;
      if (photoUri) {
        photoURL = await uploadProfilePhoto(user.uid, photoUri);
      }

      await createLab({
        uid: user.uid,
        labName: data.labName.trim(),
        location: data.location.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type,
        licenseNumber: data.licenseNumber,
        mobile: data.mobile.trim(),
        photoURL,
        analysisTypes: selectedServices.map((id) => {
          const service = DIAGNOSTIC_SERVICES.find((s) => s.id === id);
          return {
            id,
            name: service?.label || id,
            cost: parseFloat(serviceCosts[id] || "0"),
          };
        }),
      });

      await login(data.email.trim().toLowerCase(), data.password);
    } catch (err: any) {
      console.error("Lab Registration Error:", err);
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
      <BackgroundDecor />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={styles.logoText}>LAB PARTNER</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Partner with{"\n"}Vitreous.</Text>
              <Text style={styles.heroSubtitle}>
                Integrate your diagnostic laboratory into our digital medical network.
              </Text>
            </View>

            <GlassCard style={styles.formCard} variant="strong" radius={RADIUS.xl}>
               {/* Profile Photo Section */}
               <View style={styles.photoSection}>
                <Text style={styles.fieldLabel}>LAB LOGO</Text>
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
                          name="business"
                          size={32}
                          color={COLORS.onSurfaceVariant}
                        />
                      )}
                    </View>
                    <TouchableOpacity onPress={pickImage} style={styles.photoEditBadge}>
                      <MaterialIcons name="edit" size={14} color={COLORS.onPrimary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoPrimaryText}>Official Lab Logo</Text>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                      <Text style={styles.photoButtonText}>Upload Logo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.formContent}>
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>LABORATORY NAME</Text>
                  <Controller
                    control={control}
                    name="labName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Precision Diagnostics"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.labName && <Text style={styles.errorText}>{errors.labName.message}</Text>}
                </View>

                {/* Enhanced Location Field with Search */}
                <View style={[styles.fieldColumn, { zIndex: 100 }]}>
                  <Text style={styles.fieldLabel}>FACILITY LOCATION</Text>
                  <View style={{ position: "relative", justifyContent: "center" }}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 123 Lab St, City"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={locationQuery}
                      onChangeText={(txt) => {
                        setLocationQuery(txt);
                        if (txt === "") setShowSuggestions(false);
                      }}
                    />
                    {isSearchingLocation && (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.primary}
                        style={{ position: "absolute", right: 16 }}
                      />
                    )}
                  </View>

                  {showSuggestions && locationSuggestions.length > 0 && (
                    <View style={styles.suggestionsDropdownContainer}>
                      <GlassCard style={styles.suggestionsDropdown} variant="strong">
                        <ScrollView 
                          style={{ maxHeight: 250 }} 
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="always"
                        >
                          {locationSuggestions.map((item, idx) => {
                             const props = item.properties;
                             const mainName = props.name || props.street || 'Selected Location';
                             const subName = `${props.city || props.state || ''}, ${props.country || ''}`;
                             const fullDisplayName = `${mainName}, ${subName}`;

                             return (
                              <TouchableOpacity
                                key={idx}
                                style={styles.suggestionItem}
                                onPress={() => {
                                  setValue("location", fullDisplayName);
                                  setValue("latitude", item.geometry.coordinates[1]);
                                  setValue("longitude", item.geometry.coordinates[0]);
                                  setLocationQuery(fullDisplayName);
                                  setShowSuggestions(false);
                                }}
                              >
                                <MaterialIcons name="place" size={18} color={COLORS.primary} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                                    {mainName}
                                  </Text>
                                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>
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
                  
                  {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>LAB TYPE</Text>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field: { onChange, value } }) => (
                        <View style={styles.pickerWrapper}>
                          {["Clinical", "Radiology", "Pathology"].map((item) => (
                            <TouchableOpacity
                              key={item}
                              onPress={() => onChange(item)}
                              style={[styles.pickerItem, value === item && styles.pickerItemActive]}
                            >
                              <Text style={[styles.pickerItemText, value === item && styles.pickerItemTextActive]}>
                                {item}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    />
                  </View>
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>LICENSE NUMBER</Text>
                  <Controller
                    control={control}
                    name="licenseNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="State / Federal License"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>CONTACT MOBILE</Text>
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
                  {errors.mobile && <Text style={styles.errorText}>{errors.mobile.message}</Text>}
                </View>

                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>WORK EMAIL</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="admin@lab.com"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    )}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
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
                  {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                </View>

                {/* Diagnostic Portfolio Section */}
                <View style={[styles.fieldColumn, { marginTop: 12 }]}>
                  <Text style={styles.fieldLabel}>DIAGNOSTIC PORTFOLIO</Text>
                  <View style={styles.serviceGrid}>
                    {DIAGNOSTIC_SERVICES.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      const IconProvider = service.provider;
                      return (
                        <TouchableOpacity
                          key={service.id}
                          onPress={() => toggleService(service.id)}
                          style={[
                            styles.serviceCard,
                            isSelected && styles.serviceCardSelected,
                          ]}
                        >
                          {isSelected && (
                            <View style={styles.costBadge}>
                              <Text style={styles.costText}>
                                ${serviceCosts[service.id] || "0"}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                            <IconProvider
                              name={service.icon as any}
                              size={20}
                              color={isSelected ? COLORS.primary : COLORS.onSurfaceVariant}
                            />
                          </View>
                          <Text style={[styles.serviceLabel, isSelected && styles.serviceLabelSelected]}>
                            {service.label}
                          </Text>
                          {isSelected && (
                            <TouchableOpacity 
                              style={styles.editCostBtn} 
                              onPress={(e) => {
                                e.stopPropagation();
                                setEditingService(service.id);
                                setTempCost(serviceCosts[service.id] || "");
                              }}
                            >
                              <MaterialIcons name="edit" size={10} color={COLORS.primary} />
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <GradientButton
                onPress={handleSubmit(onSubmit)}
                label="Join Network"
                size="lg"
                loading={loading}
                style={{ marginTop: 32 }}
              />
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Cost Input Modal */}
      <Modal
        visible={editingService !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingService(null)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} variant="strong">
            <Text style={styles.modalTitle}>Set Service Cost</Text>
            <Text style={styles.modalSub}>
              Enter the standard cost for{" "}
              {DIAGNOSTIC_SERVICES.find((s) => s.id === editingService)?.label}
            </Text>

            <View style={styles.fieldColumn}>
              <Text style={styles.fieldLabel}>SERVICE COST ($)</Text>
              <TextInput
                style={styles.costInput}
                value={tempCost}
                onChangeText={setTempCost}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setEditingService(null);
                  setTempCost("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveCost}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryContainer]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save Price</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  logoText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  scroll: { padding: 24, paddingBottom: 100 },
  hero: { marginBottom: 40, marginTop: 24 },
  heroTitle: {
    color: COLORS.primary,
    fontSize: 48,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    lineHeight: 52,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 24,
  },
  formCard: { padding: 24 },
  photoSection: { marginBottom: 32 },
  fieldLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 12,
  },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  photoPreviewWrapper: { position: "relative" },
  photoPreview: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInfo: { flex: 1 },
  photoPrimaryText: { color: COLORS.onSurface, fontSize: 14, fontFamily: FONT_FAMILY.headline, marginBottom: 8 },
  photoButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  photoButtonText: { color: COLORS.onSurface, fontSize: 12, fontFamily: FONT_FAMILY.headline },
  formContent: { gap: 20 },
  fieldColumn: { gap: 8 },
  fieldRow: { flexDirection: "row", gap: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: COLORS.onSurface,
    fontSize: 15,
  },
  suggestionsDropdownContainer: {
    marginTop: 8,
    zIndex: 2000,
  },
  suggestionsDropdown: {
    maxHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  suggestionText: { color: COLORS.onSurface, fontSize: 13, flex: 1 },
  pickerWrapper: { flexDirection: "row", gap: 8 },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pickerItemActive: { backgroundColor: "rgba(64, 206, 243, 0.1)", borderColor: COLORS.primary, borderWidth: 1 },
  pickerItemText: { color: "rgba(164, 171, 188, 0.7)", fontSize: 12 },
  pickerItemTextActive: { color: COLORS.primary, fontWeight: "700" },
  errorText: { color: "#FF5252", fontSize: 12 },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  serviceCard: {
    width: "31%",
    aspectRatio: 0.85,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    position: "relative",
  },
  serviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
  },
  serviceLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
  serviceLabelSelected: {
    color: COLORS.primary,
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  costBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.background,
    zIndex: 10,
  },
  costText: {
    color: COLORS.onPrimary,
    fontSize: 8,
    fontWeight: "900",
  },
  editCostBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.2)",
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    marginBottom: 8,
  },
  modalSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 20,
    lineHeight: 18,
  },
  costInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.title,
    marginBottom: 24,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalCancelText: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.title,
  },
  modalSaveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalSaveGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontFamily: FONT_FAMILY.title,
  },
});
