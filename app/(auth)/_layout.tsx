import { Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { COLORS } from "@/lib/theme";

export default function AuthLayout() {
  const { user } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register/patient" />
      <Stack.Screen name="register/doctor" />
      <Stack.Screen name="register/lab" />
    </Stack>
  );
}
