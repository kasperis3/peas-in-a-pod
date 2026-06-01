import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F8F5F0' },
        headerTintColor: '#1B4332',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F8F5F0' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-pod" options={{ title: 'Create Pod' }} />
      <Stack.Screen name="join-pod" options={{ title: 'Join Pod' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="requests" options={{ title: 'Pending Requests' }} />
      <Stack.Screen name="pod" options={{ headerShown: false }} />
    </Stack>
  );
}
