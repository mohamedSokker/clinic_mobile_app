import { Tabs } from "expo-router";
import { LayoutDashboard, Upload, User } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";

export default function LabLayout() {
  const { user, role } = useAuthStore();
  if (!user || role !== "lab") return null;

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
        tabBarActiveTintColor: COLORS.warning,
        tabBarInactiveTintColor: "rgba(229, 235, 253, 0.3)",
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONT_FAMILY.label },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color, size }) => <Upload size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
