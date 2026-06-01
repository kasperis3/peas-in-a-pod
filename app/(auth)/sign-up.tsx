import { useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/src/ui/components/Button';
import { Input } from '@/src/ui/components/Input';
import { Screen } from '@/src/ui/components/Screen';
import { useAuthStore } from '@/src/stores/auth-store';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  async function handleSignUp() {
    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/(app)');
    } catch {
      /* store handles error */
    }
  }

  return (
    <Screen title="Join the pod" subtitle="Create your pea profile">
      <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
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
      <Button label={loading ? 'Creating…' : 'Create Account'} onPress={handleSignUp} disabled={loading} />
      <Link href="/(auth)/sign-in" className="mt-4 text-center text-podGreen">
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}
