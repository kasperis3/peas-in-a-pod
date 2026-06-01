import { Text, TextInput, View } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'characters';
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="mb-1.5 text-sm font-medium text-podDark">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B9A6B"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-xl border border-podGreen/20 bg-white px-4 py-3 text-base text-podDark"
      />
    </View>
  );
}
