import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { TopAppBar } from "@/components/ui/TopAppBar";

export default function DoctorLayout() {
  const { user, role } = useAuthStore();
  const segments = useSegments();

  if (!user || role !== "doctor") return null;

  // Dynamic header configuration based on route
  const currentScreen = segments[segments.length - 1];
  const isSubPage = !["dashboard", "queue", "schedule", "profile"].includes(currentScreen);
  
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
