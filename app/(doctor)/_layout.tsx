import { Tabs, useSegments } from "expo-router";
import { View } from "react-native";
import { LayoutDashboard, Users, Calendar, User } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";
import { TopAppBar } from "@/components/ui/TopAppBar";

export default function DoctorLayout() {
  const { user, role } = useAuthStore();
  const segments = useSegments();

  if (!user || role !== "doctor") return null;

  // Dynamic header configuration based on route
  const currentScreen = segments[segments.length - 1];
  const isSubPage = segments.length > 2 && !["dashboard", "queue", "schedule", "profile"].includes(currentScreen);
  
  const titles: Record<string, string> = {
    dashboard: "Today's Status",
    queue: "Patient Pipeline",
    schedule: "Clinical Hours",
    profile: "Doctor Profile",
    "edit-profile": "Professional Bio",
    transfer: "Patient Transfer",
  };

  const title = titles[currentScreen] || ((segments as string[]).includes("patient") ? "Patient File" : "");

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
            borderTopColor: COLORS.glassBorder,
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
        name="dashboard"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: "Queue",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="patient/[id]" options={{ href: null }} />
      <Tabs.Screen name="scan/[reservationId]" options={{ href: null }} />
      <Tabs.Screen name="transfer" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
