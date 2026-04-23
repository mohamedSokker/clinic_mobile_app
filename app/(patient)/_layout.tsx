import { Tabs } from "expo-router";
import { LayoutGrid, CalendarDays, FileText } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";

export default function PatientLayout() {
  const { user, role } = useAuthStore();
  if (!user || role !== "patient") return null;
  return (
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
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Records",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
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
    </Tabs>
  );
}
