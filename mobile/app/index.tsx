import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const token = useAuthStore((state) => state.accessToken);
  return <Redirect href={token ? '/(app)/(tabs)' : '/(auth)/welcome'} />;
}
