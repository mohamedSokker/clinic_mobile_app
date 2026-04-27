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
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Save,
  User,
  Smartphone,
  Stethoscope,
  MapPin,
  CreditCard,
  FileText,
  Award,
  Camera,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { uploadProfilePhoto } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { COLORS, FONT_FAMILY, GRADIENTS, SPECIALIZATIONS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import type { DoctorUser } from "@/types/user";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { MaterialIcons } from "@expo/vector-icons";

export default function DoctorEditProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(
    profile?.photoURL || null,
  );

  const doctorProfile = profile as DoctorUser;

  // Location Search State
  const [locationQuery, setLocationQuery] = useState(
    doctorProfile?.doctor?.location || "",
  );
  const [debouncedLocationQuery] = useDebounce(locationQuery, 800);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    mobile: profile?.mobile || "",
    doctorName: doctorProfile?.doctor?.doctorName || "",
    specialization: doctorProfile?.doctor?.specialization || "",
    clinicName: doctorProfile?.doctor?.clinicName || "",
    location: doctorProfile?.doctor?.location || "",
    about: doctorProfile?.doctor?.about || "",
    visitCost: doctorProfile?.doctor?.visitCost?.toString() || "0",
    yearsExperience: doctorProfile?.doctor?.yearsExperience?.toString() || "0",
    badgeTitle: doctorProfile?.doctor?.badgeTitle || "",
    specialties: doctorProfile?.doctor?.specialties?.join(", ") || "",
    latitude: doctorProfile?.doctor?.latitude || undefined,
    longitude: doctorProfile?.doctor?.longitude || undefined,
  });

  React.useEffect(() => {
    if (
      debouncedLocationQuery.length > 2 &&
      debouncedLocationQuery !== formData.location
    ) {
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
        text2: "Gallery access required.",
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
      setCurrentPhotoURL(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setPhotoUri(null);
    setCurrentPhotoURL(null);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updatePayload: any = {
        name: formData.name,
        mobile: formData.mobile,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        clinicName: formData.clinicName,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        about: formData.about,
        visitCost: parseFloat(formData.visitCost),
        yearsExperience: parseInt(formData.yearsExperience),
        badgeTitle: formData.badgeTitle,
        specialties: formData.specialties
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
      };

      if (photoUri) {
        const photoURL = await uploadProfilePhoto(user!.uid, photoUri);
        updatePayload.photoURL = photoURL;
      } else if (currentPhotoURL === null) {
        updatePayload.photoURL = "";
      }

      await api.patch("/users/me", updatePayload);
      await refreshProfile();

      Toast.show({ type: "success", text1: "Professional Identity Updated" });
      router.back();
    } catch (err: any) {
      console.error("Update Error:", err);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Professional Identity</Text>
          <TouchableOpacity
            style={[s.saveBtn, loading && { opacity: 0.5 }]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.onPrimary} />
            ) : (
              <>
                <Save size={18} color={COLORS.onPrimary} />
                <Text style={s.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Section */}
            <GlassCard style={s.photoSection}>
              <Text style={s.label}>CLINICAL AVATAR</Text>
              <View style={s.photoRow}>
                <View style={s.photoPreviewWrapper}>
                  <View style={s.photoPreview}>
                    <Avatar
                      uri={currentPhotoURL || undefined}
                      name={formData.name}
                      size={100}
                    />
                  </View>
                  <TouchableOpacity
                    style={s.photoEditBadge}
                    onPress={pickImage}
                  >
                    <Camera size={16} color={COLORS.onPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={s.photoInfo}>
                  <Text style={s.photoPrimaryText}>Professional Photo</Text>
                  <Text style={s.photoSecondaryText}>
                    This photo will be displayed to patients during booking.
                  </Text>
                  <View style={s.photoActionRow}>
                    <TouchableOpacity style={s.photoButton} onPress={pickImage}>
                      <Text style={s.photoButtonText}>Change Photo</Text>
                    </TouchableOpacity>
                    {currentPhotoURL && (
                      <TouchableOpacity
                        style={[s.photoButton, s.removeBtnSmall]}
                        onPress={removeImage}
                      >
                        <Text
                          style={[s.photoButtonText, { color: COLORS.error }]}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Clinical Credentials</Text>
              <Text style={s.introSub}>
                Define your professional title and specialization.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>FULL NAME (FOR SYSTEM)</Text>
                <View style={s.inputContainer}>
                  <User size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.input}
                    value={formData.name}
                    onChangeText={(val) =>
                      setFormData({ ...formData, name: val })
                    }
                    placeholder="Dr. Elias Vance"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>

              <View style={s.column}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>PROFESSIONAL TITLE</Text>
                  <View style={s.inputContainer}>
                    <Award size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.badgeTitle}
                      onChangeText={(val) =>
                        setFormData({ ...formData, badgeTitle: val })
                      }
                      placeholder="Consultant"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>EXPERIENCE (YRS)</Text>
                  <View style={s.inputContainer}>
                    <TextInput
                      style={s.input}
                      value={formData.yearsExperience}
                      onChangeText={(val) =>
                        setFormData({ ...formData, yearsExperience: val })
                      }
                      placeholder="12"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>SPECIALIZATION</Text>
                <View style={s.pickerWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -4 }}
                  >
                    {SPECIALIZATIONS.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() =>
                          setFormData({ ...formData, specialization: item.label })
                        }
                        style={[
                          s.pickerItem,
                          formData.specialization === item.label && s.pickerItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.pickerItemText,
                            formData.specialization === item.label &&
                              s.pickerItemTextActive,
                          ]}
                        >
                          {item.label.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Contact Information</Text>
              <Text style={s.introSub}>
                Manage your clinical communication channels.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>MOBILE NUMBER</Text>
                <View style={s.inputContainer}>
                  <Smartphone size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.input}
                    value={formData.mobile}
                    onChangeText={(val) =>
                      setFormData({ ...formData, mobile: val })
                    }
                    placeholder="+1 555 000 0000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>PRIMARY EMAIL (SECURE)</Text>
                <View style={[s.inputContainer, { opacity: 0.5 }]}>
                  <User size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={[s.input, { color: "rgba(255,255,255,0.5)" }]}
                    value={profile?.email || ""}
                    editable={false}
                  />
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Clinic Details</Text>
              <Text style={s.introSub}>
                Location and consultation financial settings.
              </Text>
            </View>

            <GlassCard style={[s.formGroup, { overflow: "visible", zIndex: 100 }]}>
              <View style={s.field}>
                <Text style={s.label}>CLINIC NAME</Text>
                <View style={s.inputContainer}>
                  <MaterialIcons
                    name="business"
                    size={18}
                    color="rgba(255,255,255,0.3)"
                  />
                  <TextInput
                    style={s.input}
                    value={formData.clinicName}
                    onChangeText={(val) =>
                      setFormData({ ...formData, clinicName: val })
                    }
                    placeholder="Vitreous Precision Center"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>

              <View style={[s.field, { zIndex: 100 }]}>
                <Text style={s.label}>CLINIC LOCATION</Text>
                <View style={s.inputContainer}>
                  <MapPin size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.input}
                    value={locationQuery}
                    onChangeText={(txt) => {
                      setLocationQuery(txt);
                      if (txt === "") setShowSuggestions(false);
                    }}
                    placeholder="e.g. 123 Clinic St, City"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                  {isSearchingLocation && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </View>

                {showSuggestions && locationSuggestions.length > 0 && (
                  <View style={s.suggestionsDropdownContainer}>
                    <GlassCard
                      style={[s.suggestionsDropdown, { overflow: "hidden" }]}
                    >
                      <ScrollView
                        style={{ maxHeight: 300 }}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="always"
                      >
                        {locationSuggestions.map((item, idx) => {
                          const props = item.properties;
                          const mainName =
                            props.name || props.street || "Location";
                          const subName = `${props.city || props.state || ""}, ${props.country || ""}`;
                          const fullDisplayName = `${mainName}, ${subName}`;

                          return (
                            <TouchableOpacity
                              key={idx}
                              style={s.suggestionItem}
                              onPress={() => {
                                setFormData({
                                  ...formData,
                                  location: fullDisplayName,
                                  latitude: item.geometry.coordinates[1],
                                  longitude: item.geometry.coordinates[0],
                                });
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
                                  style={s.suggestionTitle}
                                  numberOfLines={1}
                                >
                                  {mainName}
                                </Text>
                                <Text
                                  style={s.suggestionSubtitle}
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
              </View>

              <View style={s.row}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>DISPLAY LOCATION</Text>
                  <View style={s.inputContainer}>
                    <TextInput
                      style={s.input}
                      value={formData.location}
                      onChangeText={(val) =>
                        setFormData({ ...formData, location: val })
                      }
                      placeholder="Downtown, Building A"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>VISIT COST ($)</Text>
                  <View style={s.inputContainer}>
                    <CreditCard size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.visitCost}
                      onChangeText={(val) =>
                        setFormData({ ...formData, visitCost: val })
                      }
                      placeholder="150"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Professional Summary</Text>
              <Text style={s.introSub}>
                Biography and clinical tags for patient discovery.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>ABOUT / BIOGRAPHY</Text>
                <View
                  style={[
                    s.inputContainer,
                    { height: 120, alignItems: "flex-start", paddingTop: 12 },
                  ]}
                >
                  <FileText
                    size={18}
                    color="rgba(255,255,255,0.3)"
                    style={{ marginTop: 4 }}
                  />
                  <TextInput
                    style={[s.input, { textAlignVertical: "top" }]}
                    value={formData.about}
                    onChangeText={(val) =>
                      setFormData({ ...formData, about: val })
                    }
                    placeholder="Tell patients about your clinical expertise..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>SPECIALTY TAGS (COMMA SEPARATED)</Text>
                <View style={s.inputContainer}>
                  <TextInput
                    style={s.input}
                    value={formData.specialties}
                    onChangeText={(val) =>
                      setFormData({ ...formData, specialties: val })
                    }
                    placeholder="Cataract, LASIK, Glaucoma"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>
            </GlassCard>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: COLORS.onSurface, fontSize: 18, fontWeight: "700" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: COLORS.onPrimary, fontSize: 14, fontWeight: "700" },
  scrollContent: { padding: 24 },
  photoSection: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    marginTop: 10,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
  },
  photoPreviewWrapper: { position: "relative" },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
  photoInfo: { flex: 1, gap: 4 },
  photoPrimaryText: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  photoSecondaryText: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  photoActionRow: { flexDirection: "column", gap: 12 },
  photoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    alignItems: "center",
  },
  removeBtnSmall: {
    borderColor: "rgba(215, 56, 59, 0.2)",
    backgroundColor: "rgba(215, 56, 59, 0.05)",
  },
  photoButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  intro: { marginBottom: 20, marginTop: 10 },
  introTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  introSub: { color: "rgba(164, 171, 188, 0.6)", fontSize: 14, marginTop: 4 },
  formGroup: { padding: 20, borderRadius: 24, marginBottom: 32, gap: 20 },
  field: { gap: 8 },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: { flex: 1, color: COLORS.onSurface, fontSize: 15, fontWeight: "500" },
  row: { flexDirection: "row", gap: 16 },
  column: { flexDirection: "column", gap: 16 },

  // Picker Styles
  pickerWrapper: {
    marginTop: 8,
    flexDirection: "row",
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 4,
  },
  pickerItemActive: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    borderColor: COLORS.primary,
  },
  pickerItemText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  pickerItemTextActive: {
    color: COLORS.primary,
  },

  // Suggestion Styles
  suggestionsDropdownContainer: {
    position: "relative",
    zIndex: 200,
    width: "100%",
  },
  suggestionsDropdown: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(28, 38, 55, 1)",
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionTitle: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
});
