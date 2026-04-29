import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { TopAppBar } from "@/components/ui/TopAppBar";

export default function PatientLayout() {
  const { user, role } = useAuthStore();
  const segments = useSegments();

  if (!user || role !== "patient") return null;

  // Dynamic header configuration
  const currentScreen = segments[segments.length - 1];
  const parentScreen = segments.length > 1 ? segments[segments.length - 2] : null;
  
  // A screen is a subpage if it's NOT one of the main tabs
  const isSubPage = !["home", "explore", "history", "schedule"].includes(currentScreen);

  const titles: Record<string, string> = {
    home: "Wellness Overview",
    explore: "Medical Network",
    history: "Clinical Records",
    schedule: "Treatment Calendar",
    diagnoses: "Diagnostic Reports",
    "lab-analysis": "Sample Pipeline",
    vaccines: "Immunization Log",
    activity: "Vital Insights",
    notifications: "Alerts & Messages",
    profile: "Patient Account",
    "edit-profile": "Update Identity",
    doctor: "Practitioner Insights",
    lab: "Facility Details",
    queue: "Live Tracker",
    "live-feed": "Activity History",
  };

  // Check parent for dynamic routes (e.g. doctor/[id])
  const titleKey =
    parentScreen && ["doctor", "lab", "queue"].includes(parentScreen)
      ? parentScreen
      : currentScreen;
  const title = titles[titleKey] || "";

  return (
    <View style={{ flex: 1, backgroundColor: "#070e1a" }}>
      <TopAppBar 
        title={title} 
        showBack={isSubPage} 
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
