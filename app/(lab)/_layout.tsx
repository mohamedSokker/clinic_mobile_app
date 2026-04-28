import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { TopAppBar } from "@/components/ui/TopAppBar";

export default function LabLayout() {
  const { user, role } = useAuthStore();
  const segments = useSegments();

  if (!user || role !== "lab") return null;

  // Dynamic header configuration
  const currentScreen = segments[segments.length - 1];
  const isSubPage = !["dashboard", "schedule", "upload", "queue", "profile"].includes(currentScreen);
  
  const titles: Record<string, string> = {
    dashboard: "Operations Overview",
    schedule: "Lab Timetable",
    upload: "Result Submission",
    queue: "Sample Pipeline",
    profile: "Lab Credentials",
    "patient-analysis": "Patient Records",
  };

  const title = titles[currentScreen] || ((segments as string[]).includes("patient-analysis") ? "Patient Results" : "");

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
