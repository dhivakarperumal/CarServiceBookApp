import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role?.toLowerCase();
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (role === 'mechanic' || role === 'employee') {
        router.replace('/(employee)/staff');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isLoading]);

  if (isLoading || user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}