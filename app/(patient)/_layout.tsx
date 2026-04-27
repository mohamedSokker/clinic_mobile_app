import { Tabs, useSegments } from "expo-router";
import { View } from "react-native";
import { LayoutGrid, CalendarDays, FileText } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/ui/TopAppBar";

export default function PatientLayout() {
  const { user, role } = useAuthStore();
  const segments = useSegments();

  if (!user || role !== "patient") return null;

  // Dynamic header configuration
  const currentScreen = segments[segments.length - 1];
  const parentScreen = segments[segments.length - 2];
  const isSubPage = segments.length > 2 && !["home", "explore", "history", "schedule"].includes(currentScreen);

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
  };

  // Check parent for dynamic routes (e.g. doctor/[id])
  const titleKey = ["doctor", "lab", "queue"].includes(parentScreen) ? parentScreen : currentScreen;
  const title = titles[titleKey] || "";

  return (
    <View style={{ flex: 1, backgroundColor: "#070e1a" }}>
      <TopAppBar 
        title={title} 
        showBack={isSubPage} 
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#070e1a",
            borderTopColor: "rgba(255,255,255,0.05)",
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 68,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: "rgba(229, 235, 253, 0.3)",
          tabBarLabelStyle: { fontSize: 11, fontFamily: FONT_FAMILY.label },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <LayoutGrid size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Records",
            tabBarIcon: ({ color, size }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Schedule",
            tabBarIcon: ({ color, size }) => (
              <CalendarDays size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen name="doctor/[id]" options={{ href: null }} />
        <Tabs.Screen name="queue/[clinicId]" options={{ href: null }} />
        <Tabs.Screen name="lab/[id]" options={{ href: null }} />
        <Tabs.Screen name="lab/[id]/book" options={{ href: null }} />
        <Tabs.Screen name="diagnoses" options={{ href: null }} />
        <Tabs.Screen name="lab-analysis" options={{ href: null }} />
        <Tabs.Screen name="vaccines" options={{ href: null }} />
        <Tabs.Screen name="activity" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
