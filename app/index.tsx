import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/(auth)/login');
      } else {
        const role = user.role?.toLowerCase();
        console.log('Index component: Redirecting user with role:', role);
        if (role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else if (role === 'mechanic' || role === 'employee') {
          router.replace('/(employee)/staff');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
