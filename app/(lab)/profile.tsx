import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { LogOut } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { LabUser } from "@/types/user";
import { updateLabProfile } from "@/services/labService";
import { uploadProfilePhoto } from "@/services/storageService";
import axios from "axios";
import { useDebounce } from "use-debounce";
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZE,
  GRADIENTS,
  RADIUS,
  SPACING,
} from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

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

const COMPLIANCE_ITEMS = [
  { id: "ISO 15189", label: "ISO 15189" },
  { id: "CLIA Certified", label: "CLIA Certified" },
];

export default function LabProfile() {
  const { user, profile, logout, refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Form State
  const [labName, setLabName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [type, setType] = useState("Clinical");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceCosts, setServiceCosts] = useState<Record<string, string>>({});
  const [editingService, setEditingService] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState("");
  const [certifications, setCertifications] = useState<Record<string, string>>({});

  // Location Search State
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery] = useDebounce(locationQuery, 800);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debouncedLocationQuery.length > 2 && debouncedLocationQuery !== location) {
      searchLocations(debouncedLocationQuery);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedLocationQuery]);

  const searchLocations = async (query: string) => {
    setIsSearchingLocation(true);
    try {
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

  useEffect(() => {
    if (profile && profile.role === "lab") {
      const labData = profile as LabUser;
      setLabName(labData.name || labData.labName || "");
      setMobile(labData.mobile || "");
      setEmail(labData.email || "");
      if (labData.role === 'lab') {
        setLicenseNumber(labData.licenseNumber || "");
        setLocation(labData.location || "");
        setLocationQuery(labData.location || "");
        setLatitude(labData.latitude ?? null);
        setLongitude(labData.longitude ?? null);
        setType(labData.type || "Clinical");
        setDescription(labData.description || "");
        
        const costs: Record<string, string> = {};
        const services = (labData.analysisTypes || []).map((t: any) => {
          const val = typeof t === "string" ? t : t.name || t.id || t.label;
          const match = DIAGNOSTIC_SERVICES.find(s => s.id === val || s.label === val);
          const serviceId = match ? match.id : val;
          
          if (typeof t === "object" && t.cost) {
            costs[serviceId] = t.cost.toString();
          }
          return serviceId;
        });
        
        setSelectedServices(services);
        setServiceCosts(costs);
        setCertifications(labData.certifications || {});
      }
    }
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Gallery access needed to update logo.",
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
      setTempCost(serviceCosts[serviceId] || "");
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

  const toggleCertification = (certId: string) => {
    setCertifications((prev) => ({
      ...prev,
      [certId]: prev[certId] === "Active" ? "Inactive" : "Active",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalPhotoURL = profile?.photoURL;
      
      if (photoUri && user?.uid) {
        finalPhotoURL = await uploadProfilePhoto(user.uid, photoUri);
      }

      const updateData = {
        name: labName,
        photoURL: finalPhotoURL,
        mobile: mobile,
        labName: labName, // Keep synced
        licenseNumber,
        location,
        latitude,
        longitude,
        type,
        description,
        analysisTypes: selectedServices.map((id) => {
          const service = DIAGNOSTIC_SERVICES.find((s) => s.id === id);
          return {
            id,
            name: service?.label || id,
            cost: parseFloat(serviceCosts[id] || "0"),
          };
        }),
        certifications,
      };

      await updateLabProfile(updateData);
      await refreshProfile();
      
      setPhotoUri(null);
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your laboratory profile has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

            {/* Profile Photo Section */}
            <View style={styles.photoContainer}>
              <View style={styles.photoWrapper}>
                <View style={styles.avatarBorder}>
                  <Image
                    source={{
                      uri: photoUri || profile?.photoURL || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                </View>
                <TouchableOpacity onPress={pickImage} style={styles.editBadge}>
                  <MaterialIcons name="photo-camera" size={16} color={COLORS.onPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.labId}>ID: {(profile as any)?.id?.slice(0, 8).toUpperCase() || "VPL-PENDING"}</Text>
            </View>

            <View style={styles.actionsRow}>
               <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                  <Text style={styles.secondaryBtnText}>Update Photo</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.secondaryBtnText}>Reset</Text>
               </TouchableOpacity>
            </View>

            {/* General Identity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>General Identity</Text>
              <GlassCard style={styles.formCard} variant="strong">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LAB LEGAL NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={labName}
                    onChangeText={setLabName}
                    placeholder="e.g. Vitreous Precision Laboratories"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LABORATORY TYPE</Text>
                  <View style={styles.pickerWrapper}>
                    {["Clinical", "Radiology", "Pathology"].map((item) => (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setType(item)}
                        style={[styles.pickerItem, type === item && styles.pickerItemActive]}
                      >
                        <Text style={[styles.pickerItemText, type === item && styles.pickerItemTextActive]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LICENSE NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="FED-992-XXXX"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>

                <View style={[styles.inputGroup, { zIndex: 100 }]}>
                  <Text style={styles.label}>HEADQUARTERS ADDRESS</Text>
                  <View style={{ position: "relative", justifyContent: "center" }}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 123 Lab St, City"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={locationQuery}
                      onChangeText={(txt) => {
                        setLocationQuery(txt);
                        if (txt === "") {
                          setShowSuggestions(false);
                          setLocation("");
                          setLatitude(null);
                          setLongitude(null);
                        }
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
                    <>
                      <TouchableOpacity 
                        activeOpacity={1}
                        style={styles.backdrop} 
                        onPress={() => setShowSuggestions(false)} 
                      />
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
                                    setLocation(fullDisplayName);
                                    setLatitude(item.geometry.coordinates[1]);
                                    setLongitude(item.geometry.coordinates[0]);
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
                    </>
                  )}
                </View>
              </GlassCard>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact & Connectivity</Text>
              <GlassCard style={styles.formCard} variant="strong">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>WORK EMAIL (READ-ONLY)</Text>
                  <TextInput
                    style={[styles.input, { opacity: 0.6 }]}
                    value={email}
                    editable={false}
                    placeholder="admin@lab.com"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONTACT MOBILE</Text>
                  <TextInput
                    style={styles.input}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="phone-pad"
                  />
                </View>
              </GlassCard>
            </View>

            {/* Lab Biography */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Laboratory Biography</Text>
              <GlassCard style={styles.formCard} variant="strong">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DESCRIPTION & MISSION</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your lab's expertise, technology, and mission..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                  />
                </View>
              </GlassCard>
            </View>

            {/* Compliance Status */}
            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Compliance Status</Text>
               <View style={styles.certGrid}>
                 {COMPLIANCE_ITEMS.map((item) => {
                   const isActive = certifications[item.id] === "Active";
                   return (
                     <TouchableOpacity
                       key={item.id}
                       style={[styles.certCard, isActive && styles.certCardActive]}
                       onPress={() => toggleCertification(item.id)}
                     >
                        <MaterialIcons 
                          name={isActive ? "verified" : "pending"} 
                          size={20} 
                          color={isActive ? COLORS.primary : COLORS.onSurfaceVariant} 
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.certLabel}>{item.label}</Text>
                          <Text style={[styles.certStatus, isActive && { color: COLORS.primary }]}>
                            {isActive ? "ACTIVE" : "INACTIVE"}
                          </Text>
                        </View>
                     </TouchableOpacity>
                   );
                 })}
               </View>
            </View>

            {/* Diagnostic Portfolio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Diagnostic Portfolio</Text>
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
                          size={24}
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
                          <MaterialIcons name="edit" size={12} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Final Actions */}
            <View style={styles.footer}>
              <GradientButton
                label="Save Lab Profile"
                onPress={handleSave}
                loading={saving}
                size="lg"
              />
              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={20} color={COLORS.error} />
                <Text style={styles.signOutText}>Sign Out from Network</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SERVICE COST ($)</Text>
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
 
      {/* Sign Out Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} variant="strong">
            <View style={styles.modalIcon}>
              <LogOut size={32} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to end your professional session? You will need to re-authenticate to manage your clinic.
            </Text>
 
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowSignOutModal(false);
                  logout();
                }}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 120 },
  header: { marginBottom: SPACING.xl },
  title: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE["3xl"],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.body,
    marginTop: 4,
    opacity: 0.8,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  photoWrapper: {
    position: "relative",
  },
  avatarBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "rgba(64, 206, 243, 0.2)",
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  labId: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT_FAMILY.label,
    marginTop: 12,
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: SPACING.xl,
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  secondaryBtnText: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.label,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.headline,
    marginBottom: SPACING.md,
    marginLeft: 4,
  },
  formCard: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    padding: 12,
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.bodyMedium,
    borderRadius: RADIUS.sm,
  },
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
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 1,
  },
  certGrid: {
    flexDirection: "row",
    gap: 12,
  },
  certCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  certCardActive: {
    borderColor: "rgba(64, 206, 243, 0.4)",
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  certLabel: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.title,
  },
  certStatus: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceCard: {
    width: "31.2%",
    aspectRatio: 0.9,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.xl,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    position: "relative",
  },
  serviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
  },
  serviceLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: FONT_FAMILY.title,
    textAlign: "center",
  },
  serviceLabelSelected: {
    color: COLORS.primary,
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  costBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: COLORS.background,
    zIndex: 10,
  },
  costText: {
    color: COLORS.onPrimary,
    fontSize: 10,
    fontWeight: "900",
  },
  editCostBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 32,
    alignItems: "center",
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    marginBottom: 8,
  },
  modalSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  costInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    padding: 20,
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.title,
    marginBottom: 32,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalCancelText: { color: COLORS.onSurface, fontWeight: "700" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.error,
  },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
  modalSaveBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalSaveGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.title,
  },
  footer: {
    marginTop: SPACING.xl,
    gap: SPACING.lg,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    opacity: 0.7,
  },
  signOutText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.label,
  },
});
