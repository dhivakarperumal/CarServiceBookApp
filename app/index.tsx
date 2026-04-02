import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role?.toLowerCase();
  
  if (role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  } else if (role === 'mechanic' || role === 'employee') {
    return <Redirect href="/(employee)/staff" />;
  } else {
    return <Redirect href="/(tabs)/home" />;
  }
}
