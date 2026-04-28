import { Tabs } from "expo-router";
import {
  LayoutDashboard as Dash,
  Users as Ppl,
  Calendar as Cal,
  User as Me,
} from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";

export default function DoctorTabsLayout() {
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
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "rgba(229, 235, 253, 0.3)",
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONT_FAMILY.label },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Dash size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: "Queue",
          tabBarIcon: ({ color, size }) => <Ppl size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => <Cal size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Me size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
