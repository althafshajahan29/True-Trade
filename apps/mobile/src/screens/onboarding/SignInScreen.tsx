import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Button, Input, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('demo@righttrade.app');
  const [password, setPassword] = useState('');
  const { signIn, isSubmitting, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    await signIn({ email, password });
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        <Text variant="h1">Welcome back</Text>
        <Text variant="body" tone="secondary">
          Sign in to your Right Trade account.
        </Text>
      </View>

      <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input label="Password" placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry />

        <View
          style={{
            backgroundColor: 'transparent',
          }}
        >
          <Text variant="caption" tone="tertiary">
            Demo login is pre-filled — password: Demo1234!
          </Text>
        </View>

        {error && (
          <Text variant="caption" tone="negative">
            {error}
          </Text>
        )}

        <Button label="Sign in" onPress={handleSubmit} loading={isSubmitting} />
        <Button label="Create an account instead" variant="ghost" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </Screen>
  );
}
