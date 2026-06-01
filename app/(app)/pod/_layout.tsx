import { Stack } from 'expo-router';

export default function PodLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#1B4332',
        headerStyle: { backgroundColor: '#F8F5F0' },
        contentStyle: { backgroundColor: '#F8F5F0' },
      }}
    />
  );
}
