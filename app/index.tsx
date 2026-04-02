import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  const role = user.role?.toLowerCase();
  if (role === 'mechanic' || role === 'employee' || role === 'admin') {
    return <Redirect href="/(employee)" />;
  }

  return <Redirect href="/(tabs)" />;
}
