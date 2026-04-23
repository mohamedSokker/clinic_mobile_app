import { Tabs } from "expo-router";
import { LayoutDashboard, Users, Calendar, User } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";

export default function DoctorLayout() {
  const { user, role } = useAuthStore();
  if (!user || role !== "doctor") return null;
  return (
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
        tabBarActiveTintColor: COLORS.secondary,
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
      <Tabs.Screen name="transfer" options={{ href: null }} />
    </Tabs>
  );
}
