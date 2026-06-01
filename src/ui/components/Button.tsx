import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  const base = 'rounded-2xl py-3.5 px-6 items-center';
  const variants = {
    primary: 'bg-podGreen',
    secondary: 'bg-peaBright/40',
    ghost: 'bg-transparent border border-podGreen/30',
  };
  const textVariants = {
    primary: 'text-white',
    secondary: 'text-podDark',
    ghost: 'text-podGreen',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      <Text className={`text-center text-base font-semibold ${textVariants[variant]}`}>{label}</Text>
    </Pressable>
  );
}
