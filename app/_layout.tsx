import "@/global.css";
import { Stack, Redirect, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalHost } from "@rn-primitives/portal";
import { COLORS } from "@/lib/theme";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StripeProvider } from "@stripe/stripe-react-native";

export { ErrorBoundary } from "expo-router";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { loadPersistedAuth, loading, initialized, user, role } =
    useAuthStore();
  const [ready, setReady] = useState(false);

  console.log("user", user);
  console.log("role", role);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadPersistedAuth().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to welcome if not logged in and not in auth group
      router.replace("/(auth)/welcome");
    } else if (user && inAuthGroup) {
      // Redirect to home if logged in and in auth group
      if (role === "doctor") {
        router.replace("/(doctor)/dashboard");
      } else if (role === "patient") {
        router.replace("/(patient)/home");
      } else if (role === "lab") {
        router.replace("/(lab)/dashboard");
      }
    }
  }, [user, role, segments, ready, loading]);

  if (!ready) {
    return <LoadingScreen message="Starting up..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock_vitreous_51PqWfE"}
        merchantIdentifier="merchant.com.vitreous"
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(patient)" options={{ headerShown: false }} />
            <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
            <Stack.Screen name="(lab)" options={{ headerShown: false }} />
          </Stack>
          <PortalHost />
          <Toast />
        </GestureHandlerRootView>
      </StripeProvider>
    </QueryClientProvider>
  );
}
