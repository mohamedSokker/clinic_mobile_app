import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS, FONT_FAMILY, RADIUS, GRADIENTS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { getAllDoctors } from "@/services/doctorService";
import { getAllLabs } from "@/services/labService";
import { WebView } from "react-native-webview";
import { useAuthStore } from "@/stores/authStore";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const { width } = Dimensions.get("window");

const SPECIALIZATIONS = [
  "All",
  "Cardiology",
  "Radiology",
  "Neurology",
  "Pathology",
  "Oncology",
];

const LAB_SERVICES = ["All", "Clinical", "Radiology", "Pathology"];

export default function ExploreScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const { profile } = useAuthStore();
  const [searchType, setSearchType] = useState<"doctors" | "labs">("doctors");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const patientLat = profile?.latitude;
  const patientLng = profile?.longitude;

  const filters = searchType === "doctors" ? SPECIALIZATIONS : LAB_SERVICES;

  // Fetching real data
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: [
      "doctors",
      selectedFilter,
      debouncedSearch,
      patientLat,
      patientLng,
    ],
    queryFn: () =>
      getAllDoctors(
        selectedFilter === "All" ? undefined : selectedFilter,
        patientLat,
        patientLng,
        20,
      ),
    enabled: searchType === "doctors",
  });

  const { data: labs = [], isLoading: isLoadingLabs } = useQuery({
    queryKey: ["labs", selectedFilter, debouncedSearch, patientLat, patientLng],
    queryFn: () =>
      getAllLabs(
        selectedFilter === "All" ? undefined : selectedFilter,
        debouncedSearch,
        patientLat,
        patientLng,
        20,
      ),
    enabled: searchType === "labs",
  });

  const results = useMemo(() => {
    let baseResults: any[] = [];
    if (searchType === "doctors") {
      baseResults = doctors;
    } else {
      baseResults = labs;
    }

    // Apply search query filter
    let filtered = baseResults;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = baseResults.filter((item: any) => {
        const name =
          searchType === "doctors"
            ? item.doctorName
            : item.labName || item.user?.name || "";
        const sub =
          searchType === "doctors" ? item.specialization : item.type || "";
        const clinic = item.clinicName || "";
        return (
          name.toLowerCase().includes(q) ||
          sub.toLowerCase().includes(q) ||
          clinic.toLowerCase().includes(q)
        );
      });
    }

    // Apply 20km radius filter if patient location is available
    if (patientLat && patientLng) {
      filtered = filtered.filter((item: any) => {
        if (item.latitude && item.longitude) {
          const dist = calculateDistance(
            patientLat,
            patientLng,
            item.latitude,
            item.longitude,
          );
          return dist <= 20; // 20 km radius
        }
        return true; // Keep items without location for now, or change to false to strictly show nearby
      });
    }

    return filtered;
  }, [searchType, doctors, labs, debouncedSearch, patientLat, patientLng]);

  const isLoading = searchType === "doctors" ? isLoadingDoctors : isLoadingLabs;

  const openInGoogleMaps = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url);
  };

  const handleZoom = (type: "in" | "out") => {
    const script = type === "in" ? "map.zoomIn();" : "map.zoomOut();";
    webViewRef.current?.injectJavaScript(script);
  };

  // Leaflet Map HTML for WebView (Free & Platform Agnostic)
  const mapHtml = useMemo(() => {
    const markers = results
      .map((item: any) => {
        // Use real lat/lng if available, otherwise fallback to centered random
        const lat = item.latitude || 40.7128 + (Math.random() - 0.5) * 0.05;
        const lng = item.longitude || -74.006 + (Math.random() - 0.5) * 0.05;
        const title = searchType === "doctors" ? item.doctorName : item.labName;
        return `L.marker([${lat}, ${lng}]).addTo(map).bindPopup('<b>${title}</b><br/><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: \\'navigate\\', lat: ${lat}, lng: ${lng}, label: \\'${title}\\'}))" style="margin-top:5px; padding:4px 8px; background:#40cef3; border:none; border-radius:4px; font-size:10px; color:#fff;">View in Maps</button>');`;
      })
      .join("\n");

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <style>
              body { margin: 0; padding: 0; background: #070e1a; }
              #map { height: 100vh; width: 100vw; }
              .leaflet-container { background: #070e1a !important; }
              .leaflet-bar a { background-color: #1c2637 !important; color: #40cef3 !important; border-bottom: 1px solid #2c374d !important; }
              .leaflet-popup-content-wrapper { background: #1c2637; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
              .leaflet-popup-tip { background: #1c2637; }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              var map = L.map('map', {
                  center: [${Number(patientLat) || 40.7128}, ${Number(patientLng) || -74.006}],
                  zoom: 9,
                  zoomControl: false
              });
              L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
                  attribution: '',
                  maxZoom: 19
              }).addTo(map);

              // Inject CSS for custom brightness and hiding attribution
              var style = document.createElement('style');
              style.innerHTML = '.leaflet-tile { filter: brightness(2) contrast(1.2); } .leaflet-control-attribution { display: none !important; }';
              document.head.appendChild(style);
              
              // Enable interaction explicitly in all directions
              map.dragging.enable();
              map.touchZoom.enable();
              map.doubleClickZoom.enable();
              map.scrollWheelZoom.enable();
              if (map.tap) map.tap.enable();

              ${markers}

              ${patientLat && patientLng ? `
              var patientIcon = L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#40cef3; width:16px; height:16px; border-radius:50%; border:3px solid #070e1a; box-shadow: 0 0 10px rgba(64,206,243,0.8);'></div>",
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              });
              L.marker([${patientLat}, ${patientLng}], {icon: patientIcon, zIndexOffset: 1000}).addTo(map).bindPopup('<b>You are here</b>');
              ` : ''}


              // Handle clicks from markers
              window.addEventListener('message', function(event) {
                // Not needed for simple zoom injection
              });

              // Intercept touches to prevent outer scroll
              document.getElementById('map').addEventListener('touchstart', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'map_touch_start'}));
              });
              document.getElementById('map').addEventListener('touchend', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'map_touch_end'}));
              });
              document.getElementById('map').addEventListener('touchcancel', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'map_touch_end'}));
              });
          </script>
      </body>
      </html>
    `;
  }, [results, searchType, patientLat, patientLng]);

  return (
    <View style={styles.container}>
      {/* Background Blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Find Care Near You</Text>
            <Text style={styles.pageSubtitle}>
              Precise medical diagnostics and specialized care within reach.
            </Text>
          </View>

          {/* Search Bar & Toggle */}
          <View style={styles.searchSection}>
            <GlassCard style={styles.searchCard} variant="strong">
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    searchType === "doctors" && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    setSearchType("doctors");
                    setSelectedFilter("All");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      searchType === "doctors" && styles.toggleTextActive,
                    ]}
                  >
                    Doctors
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    searchType === "labs" && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    setSearchType("labs");
                    setSelectedFilter("All");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      searchType === "labs" && styles.toggleTextActive,
                    ]}
                  >
                    Labs
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="search" size={20} color={COLORS.primary} />
                <TextInput
                  style={styles.input}
                  placeholder={`Search ${searchType}...`}
                  placeholderTextColor="rgba(164, 171, 188, 0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </GlassCard>
          </View>

          {/* Map Section with WebView Leaflet */}
          <View style={styles.mapContainer}>
            {Platform.OS === "web" ? (
              <View
                style={[
                  styles.map,
                  {
                    backgroundColor: "#1c2637",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <MaterialIcons
                  name="map"
                  size={48}
                  color={COLORS.primary}
                  style={{ opacity: 0.3 }}
                />
                <Text
                  style={{ color: "rgba(164, 171, 188, 0.5)", marginTop: 12 }}
                >
                  Map Preview (Mobile Only)
                </Text>
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                style={styles.map}
                scrollEnabled={false} // Disable WebView scroll to allow Leaflet to handle all directions
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === "navigate") {
                      openInGoogleMaps(data.lat, data.lng, data.label);
                    } else if (data.type === "map_touch_start") {
                      setScrollEnabled(false);
                    } else if (data.type === "map_touch_end") {
                      setScrollEnabled(true);
                    }
                  } catch (e) {
                    console.log('WebView message error:', e);
                  }
                }}
              />
            )}
            <LinearGradient
              colors={[
                "rgba(7, 14, 26, 0.3)",
                "transparent",
                "transparent",
                "rgba(7, 14, 26, 0.5)",
              ]}
              style={styles.mapOverlay}
              pointerEvents="none"
            />

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={styles.mapControlBtn}
                onPress={() => handleZoom("in")}
              >
                <MaterialIcons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapControlBtn}
                onPress={() => handleZoom("out")}
              >
                <MaterialIcons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapControlBtn}
                onPress={() => Linking.openURL("https://www.google.com/maps")}
              >
                <FontAwesome5
                  name="directions"
                  size={16}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Specialization Filters */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>
              {searchType === "doctors" ? "Specialization" : "Lab Services"}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.specializationsScroll}
            contentContainerStyle={styles.specializationsContent}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.specBadge,
                  selectedFilter === filter && styles.specBadgeActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.specBadgeText,
                    selectedFilter === filter && styles.specBadgeTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Results */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {results.length}{" "}
              {searchType === "doctors" ? "Specialists" : "Labs"} Found
            </Text>
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="tune" size={18} color={COLORS.primary} />
              <Text style={styles.filterBtnText}>Filters</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {searchType} found matching your search.
              </Text>
            </View>
          ) : (
            results.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  if (searchType === "doctors") {
                    router.push(`/(patient)/doctor/${item.id}` as any);
                  } else {
                    router.push(`/(patient)/lab/${item.id}` as any);
                  }
                }}
                activeOpacity={0.9}
              >
                <GlassCard style={styles.resultCard} variant="default">
                  <View style={styles.resultCardContent}>
                    <Image
                      source={{
                        uri:
                          (searchType === "doctors"
                            ? item.photoURL
                            : item.user?.photoURL) ||
                          (searchType === "doctors"
                            ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400"
                            : "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400"),
                      }}
                      style={styles.resultImage}
                    />
                    <View style={styles.resultDetails}>
                      <View style={styles.resultHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={styles.resultName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {searchType === "doctors"
                              ? item.doctorName
                              : item.labName || item.user?.name}
                          </Text>
                          <Text
                            style={styles.resultRole}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {searchType === "doctors"
                              ? item.specialization
                              : item.type}
                          </Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <MaterialIcons
                            name="star"
                            size={14}
                            color="#FBBF24"
                          />
                          <Text style={styles.ratingText}>
                            {item.rating || "4.8"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.resultDescription} numberOfLines={2}>
                        {item.description ||
                          (searchType === "doctors"
                            ? `Expert ${item.specialization} at ${item.clinicName}.`
                            : `Advanced diagnostic services in ${item.location}.`)}
                      </Text>
                      <View style={styles.resultMeta}>
                        <View style={styles.metaItem}>
                          <MaterialIcons
                            name="location-on"
                            size={16}
                            color={COLORS.primary}
                          />
                          <Text
                            style={styles.metaText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.clinicName ||
                              item.location ||
                              (patientLat && item.latitude
                                ? `${calculateDistance(patientLat, patientLng!, item.latitude, item.longitude!).toFixed(1)} km away`
                                : "Nearby")}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.metaItem}
                          onPress={() => {
                            const lat = item.latitude || 40.7128;
                            const lng = item.longitude || -74.006;
                            const label =
                              searchType === "doctors"
                                ? item.doctorName
                                : item.labName;
                            openInGoogleMaps(lat, lng, label);
                          }}
                        >
                          <FontAwesome5
                            name="directions"
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text
                            style={[styles.metaText, { color: COLORS.primary }]}
                          >
                            Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  blob1: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  blob2: {
    position: "absolute",
    bottom: 50,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.secondary,
    opacity: 0.1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    color: "rgba(164, 171, 188, 0.8)",
    marginTop: 6,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  searchCard: {
    padding: 12,
    borderRadius: 24,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: "rgba(164, 171, 188, 0.6)",
  },
  toggleTextActive: {
    color: COLORS.onPrimary,
    fontFamily: FONT_FAMILY.headline,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.onSurface,
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -60 }],
    gap: 8,
  },
  mapControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(7, 14, 26, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 10,
  },
  sectionIndicator: {
    width: 4,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    color: COLORS.onSurface,
  },
  specializationsScroll: {
    marginTop: 16,
  },
  specializationsContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  specBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  specBadgeActive: {
    backgroundColor: "rgba(64, 206, 243, 0.15)",
    borderColor: COLORS.primary,
  },
  specBadgeText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: "rgba(164, 171, 188, 0.8)",
  },
  specBadgeTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.headline,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: "rgba(164, 171, 188, 0.6)",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterBtnText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.label,
    color: COLORS.primary,
  },
  resultCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
  },
  resultCardContent: {
    flexDirection: "row",
    gap: 16,
  },
  resultImage: {
    width: 90,
    height: 110,
    borderRadius: 16,
  },
  resultDetails: {
    flex: 1,
    overflow: "hidden",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resultName: {
    fontSize: 17,
    fontFamily: FONT_FAMILY.headline,
    color: COLORS.onSurface,
  },
  resultRole: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    color: COLORS.primary,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.headline,
    color: "#FBBF24",
  },
  resultDescription: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    color: "rgba(164, 171, 188, 0.7)",
    marginTop: 8,
    lineHeight: 18,
  },
  resultMeta: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    overflow: "hidden",
  },
  metaText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: "rgba(164, 171, 188, 0.6)",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(164, 171, 188, 0.5)",
    textAlign: "center",
    fontFamily: FONT_FAMILY.body,
  },
});
