import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { usesLocalData } from '@/src/data/repositories';
import { Button } from '@/src/ui/components/Button';
import { Screen } from '@/src/ui/components/Screen';
import { PeaAvatar } from '@/src/ui/components/PeaAvatar';

export function WelcomeContent() {
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <View className="mb-8 items-center">
          <PeaAvatar status="checked_in" size={80} />
          <Text className="mt-6 text-3xl font-bold text-podDark">Peas in a Pod</Text>
          <Text className="mt-3 text-center text-base text-podGreen">
            Commit together. Check in fast. Stay accountable — no shame, just growth.
          </Text>
          {usesLocalData() && (
            <Text className="mt-2 text-center text-xs text-peaDroopy">
              Demo mode: use demo@peas.app / demo1234
            </Text>
          )}
        </View>
        <Button label="Get Started" onPress={() => router.push('/sign-up')} />
        <View className="mt-3">
          <Button label="Sign In" onPress={() => router.push('/sign-in')} variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
