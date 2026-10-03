import { Redirect, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { theme } from '@/constants/theme';
import { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/models';

export default function AppLayout() {
  const token = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => endpoints.me() as Promise<User>,
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  if (!token) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primaryDark,
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pets/new" options={{ title: 'Add pet' }} />
      <Stack.Screen name="pets/[id]" options={{ title: 'Pet details' }} />
      <Stack.Screen name="pets/[id]/edit" options={{ title: 'Edit pet' }} />
      <Stack.Screen name="pets/[id]/passport" options={{ title: 'Health passport' }} />
      <Stack.Screen name="pets/[id]/weight" options={{ title: 'Weight' }} />
      <Stack.Screen name="pets/[id]/nutrition" options={{ title: 'Nutrition' }} />
      <Stack.Screen name="pets/[id]/record" options={{ title: 'Record' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
