import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Index() {
  const { user, role, loading } = useAuthStore();

  if (loading) return <LoadingScreen />;

  if (!user) return <Redirect href="/(auth)/welcome" />;

  switch (role) {
    case 'doctor': return <Redirect href="/(doctor)/dashboard" />;
    case 'patient': return <Redirect href="/(patient)/home" />;
    case 'lab': return <Redirect href="/(lab)/dashboard" />;
    default: return <Redirect href="/(auth)/welcome" />;
  }
}
