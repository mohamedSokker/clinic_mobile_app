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
  Calendar,
  Droplets,
  Scale,
  Ruler,
  ShieldAlert,
  Camera,
  X,
  FileText,
  MapPin,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { uploadProfilePhoto } from "@/services/storageService";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_FAMILY, GRADIENTS, RADIUS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import type { PatientUser } from "@/types/user";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(
    profile?.photoURL || null,
  );

  const patientProfile = profile as PatientUser;

  // Form State
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    mobile: profile?.mobile || "",
    age: patientProfile?.patient?.age || "",
    gender: patientProfile?.patient?.gender || "",
    bloodType: patientProfile?.patient?.bloodType || "",
    weight: patientProfile?.patient?.weight?.toString() || "",
    height: patientProfile?.patient?.height?.toString() || "",
    allergies: patientProfile?.patient?.allergies?.join(", ") || "",
    chronicConditions:
      patientProfile?.patient?.chronicConditions?.join(", ") || "",
    location: patientProfile?.patient?.location || "",
    latitude: patientProfile?.patient?.latitude || undefined as number | undefined,
    longitude: patientProfile?.patient?.longitude || undefined as number | undefined,
  });

  // Location Search State
  const [locationQuery, setLocationQuery] = useState(formData.location);
  const [debouncedLocationQuery] = useDebounce(locationQuery, 800);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debouncedLocationQuery && debouncedLocationQuery.length > 2 && debouncedLocationQuery !== formData.location) {
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
        text2: "We need gallery access to update your photo.",
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
        age: formData.age,
        gender: formData.gender,
        bloodType: formData.bloodType,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        allergies: formData.allergies
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        chronicConditions: formData.chronicConditions
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      // Handle Photo Upload
      if (photoUri) {
        const photoURL = await uploadProfilePhoto(user!.uid, photoUri);
        updatePayload.photoURL = photoURL;
      } else if (currentPhotoURL === null) {
        updatePayload.photoURL = ""; // Remove photo
      }

      await api.patch("/users/me", updatePayload);
      await useAuthStore.getState().refreshProfile();
      
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your clinical identity has been synchronized.",
      });

      router.back();
    } catch (err: any) {
      console.error("Update Error:", err);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: err?.message || "An unexpected error occurred",
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

      <View style={{ flex: 1 }}>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Section (Registration Design) */}
            <GlassCard style={s.photoSection}>
              <Text style={s.label}>PROFILE IDENTITY</Text>
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
                  <Text style={s.photoPrimaryText}>
                    Update your clinical photo
                  </Text>
                  <Text style={s.photoSecondaryText}>
                    Ensure your face is clearly visible for identification.
                  </Text>
                  <View style={s.photoActionRow}>
                    <TouchableOpacity style={s.photoButton} onPress={pickImage}>
                      <Text style={s.photoButtonText}>Update Photo</Text>
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
              <Text style={s.introTitle}>Personal Details</Text>
              <Text style={s.introSub}>
                Update your core identification and contact information.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>FULL NAME</Text>
                <View style={s.inputContainer}>
                  <User size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.input}
                    value={formData.name}
                    onChangeText={(val) =>
                      setFormData({ ...formData, name: val })
                    }
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>

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
                    placeholder="+1 000 000 000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Residential Information</Text>
              <Text style={s.introSub}>
                Your address used for healthcare services.
              </Text>
            </View>

            <GlassCard style={[s.formGroup, { zIndex: 100 }]}>
              <View style={s.field}>
                <Text style={s.label}>LOCATION</Text>
                <View style={s.inputContainer}>
                  <MapPin size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.input}
                    value={locationQuery}
                    onChangeText={(txt) => {
                      setLocationQuery(txt);
                      if (txt === "") setShowSuggestions(false);
                    }}
                    placeholder="e.g. New York, USA"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                  {isSearchingLocation && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </View>

                {showSuggestions && locationSuggestions.length > 0 && (
                  <View style={s.suggestionsDropdownContainer}>
                    <GlassCard style={s.suggestionsDropdown} variant="strong">
                      <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                        {locationSuggestions.map((item, idx) => {
                          const props = item.properties;
                          const mainName = props.name || props.street || "Selected Location";
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
                              <MaterialIcons name="place" size={18} color={COLORS.primary} />
                              <View style={{ flex: 1 }}>
                                <Text style={s.suggestionTitle} numberOfLines={1}>{mainName}</Text>
                                <Text style={s.suggestionSubtitle} numberOfLines={1}>{subName}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </GlassCard>
                  </View>
                )}
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Biometrics</Text>
              <Text style={s.introSub}>
                Clinical metrics used for diagnostic precision.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>GENDER</Text>
                <View style={s.genderRow}>
                  {["Male", "Female"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        s.genderBtn,
                        formData.gender === g && s.genderBtnActive,
                      ]}
                      onPress={() => setFormData({ ...formData, gender: g })}
                    >
                      <Text
                        style={[
                          s.genderBtnText,
                          formData.gender === g && s.genderBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.row}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>AGE</Text>
                  <View style={s.inputContainer}>
                    <Calendar size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.age}
                      onChangeText={(val) =>
                        setFormData({ ...formData, age: val })
                      }
                      placeholder="28"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>BLOOD TYPE</Text>
                  <View style={s.inputContainer}>
                    <Droplets size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.bloodType}
                      onChangeText={(val) =>
                        setFormData({ ...formData, bloodType: val })
                      }
                      placeholder="O+"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>
                </View>
              </View>

              <View style={s.row}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>WEIGHT (KG)</Text>
                  <View style={s.inputContainer}>
                    <Scale size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.weight}
                      onChangeText={(val) =>
                        setFormData({ ...formData, weight: val })
                      }
                      placeholder="70"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>HEIGHT (CM)</Text>
                  <View style={s.inputContainer}>
                    <Ruler size={18} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={s.input}
                      value={formData.height}
                      onChangeText={(val) =>
                        setFormData({ ...formData, height: val })
                      }
                      placeholder="175"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={s.intro}>
              <Text style={s.introTitle}>Clinical Alerts</Text>
              <Text style={s.introSub}>
                Critical health markers for emergency and care context.
              </Text>
            </View>

            <GlassCard style={s.formGroup}>
              <View style={s.field}>
                <Text style={s.label}>ALLERGIES (COMMA SEPARATED)</Text>
                <View
                  style={[
                    s.inputContainer,
                    { alignItems: "flex-start", height: 100, paddingTop: 16 },
                  ]}
                >
                  <ShieldAlert
                    size={18}
                    color={COLORS.error}
                    style={{ marginTop: 4 }}
                  />
                  <TextInput
                    style={[s.input, { textAlignVertical: "top" }]}
                    value={formData.allergies}
                    onChangeText={(val) =>
                      setFormData({ ...formData, allergies: val })
                    }
                    placeholder="Peanuts, Penicillin..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>CHRONIC CONDITIONS</Text>
                <View
                  style={[
                    s.inputContainer,
                    { alignItems: "flex-start", height: 100, paddingTop: 16 },
                  ]}
                >
                  <FileText
                    size={18}
                    color={COLORS.primary}
                    style={{ marginTop: 4 }}
                  />
                  <TextInput
                    style={[s.input, { textAlignVertical: "top" }]}
                    value={formData.chronicConditions}
                    onChangeText={(val) =>
                      setFormData({ ...formData, chronicConditions: val })
                    }
                    placeholder="Diabetes, Hypertension..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                  />
                </View>
              </View>
            </GlassCard>

            {/* Update Button */}
            <TouchableOpacity
              style={[s.updateBtn, loading && { opacity: 0.5 }]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.updateBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={s.updateBtnText}>UPDATE PROFILE</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.footerSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  scrollContent: { padding: 24, paddingBottom: 60 },
  updateBtn: {
    marginHorizontal: 4,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  updateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  intro: { marginBottom: 20, marginTop: 10 },
  introTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  introSub: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 14,
    marginTop: 4,
  },
  formGroup: { padding: 20, borderRadius: 24, marginBottom: 32, gap: 20 },
  field: { gap: 8 },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: "500",
  },
  row: { flexDirection: "row", gap: 16 },
  footerSpace: { height: 40 },

  // Registration Style Photo Section
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
  photoInfo: {
    flex: 1,
    gap: 4,
  },
  photoPrimaryText: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONT_FAMILY.headline,
  },
  photoSecondaryText: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  photoActionRow: {
    flexDirection: "column",
    gap: 12,
  },
  photoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnSmall: {
    borderColor: "rgba(215, 56, 59, 0.2)",
    backgroundColor: "rgba(215, 56, 59, 0.05)",
  },
  photoButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
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
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 14,
    fontWeight: "700",
  },
  genderBtnTextActive: {
    color: COLORS.primary,
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
    fontWeight: "700",
    marginBottom: 2,
  },
  suggestionSubtitle: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 12,
    opacity: 0.5,
  },
});
