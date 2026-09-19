import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Button, Input, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AuthStackParamList } from '../../navigation/types';
import { isValidEmail } from '@right-trade/shared';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { signUp, isSubmitting, error, clearError } = useAuthStore();
  const isDesktop = useIsDesktop();

  const handleSubmit = async () => {
    clearError();
    if (displayName.trim().length < 2) return setFieldError('Enter your name.');
    if (!isValidEmail(email)) return setFieldError('Enter a valid email address.');
    if (password.length < 8) return setFieldError('Password must be at least 8 characters.');
    setFieldError(null);
    await signUp({ displayName, email, password });
  };

  return (
    <Screen contentStyle={isDesktop ? { maxWidth: 420, alignSelf: 'center', width: '100%' } : undefined}>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        <Text variant="h1">Create your account</Text>
        <Text variant="body" tone="secondary">
          Start in paper trading — switch to a real broker connection later.
        </Text>
      </View>

      <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
        <Input label="Full name" placeholder="Alex Morgan" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />

        {(fieldError || error) && (
          <Text variant="caption" tone="negative">
            {fieldError ?? error}
          </Text>
        )}

        <Button label="Create account" onPress={handleSubmit} loading={isSubmitting} />
        <Button label="Back to sign in" variant="ghost" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </Screen>
  );
}
