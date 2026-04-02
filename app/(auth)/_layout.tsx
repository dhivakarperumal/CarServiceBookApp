import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (user) {
    const role = user.role?.toLowerCase();
    if (role === 'admin') {
      return <Redirect href="/(admin)/dashboard" />;
    } else if (role === 'mechanic' || role === 'employee') {
      return <Redirect href="/(employee)/staff" />;
    } else {
      return <Redirect href="/(tabs)/home" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}