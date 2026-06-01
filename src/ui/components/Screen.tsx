import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  action?: ReactNode;
}

export function Screen({ title, subtitle, children, scroll = true, action }: ScreenProps) {
  const content = (
    <>
      {(title || action) && (
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1">
            {title && <Text className="text-2xl font-bold text-podDark">{title}</Text>}
            {subtitle && <Text className="mt-1 text-base text-podGreen">{subtitle}</Text>}
          </View>
          {action}
        </View>
      )}
      {children}
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      {scroll ? (
        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8 pt-2">
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1 px-5 pt-2">{content}</View>
      )}
    </SafeAreaView>
  );
}
