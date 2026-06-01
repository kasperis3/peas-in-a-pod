import { useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/src/ui/components/Button';
import { Input } from '@/src/ui/components/Input';
import { Screen } from '@/src/ui/components/Screen';
import { useAuthStore } from '@/src/stores/auth-store';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  async function handleSignIn() {
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)');
    } catch {
      /* store handles error */
    }
  }

  return (
    <Screen title="Welcome back" subtitle="Your pod is waiting">
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {error && <Text className="mb-3 text-sm text-amber-700">{error}</Text>}
      <Button label={loading ? 'Signing in…' : 'Sign In'} onPress={handleSignIn} disabled={loading} />
      <Link href="/(auth)/sign-up" className="mt-4 text-center text-podGreen">
        New here? Create an account
      </Link>
    </Screen>
  );
}
