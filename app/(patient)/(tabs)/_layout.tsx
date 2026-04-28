import { Tabs } from "expo-router";
import { LayoutGrid, CalendarDays, FileText } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { MaterialIcons } from "@expo/vector-icons";

export default function PatientTabsLayout() {
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
    </Tabs>
  );
}
