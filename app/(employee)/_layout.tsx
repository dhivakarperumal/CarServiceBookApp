import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployeeAdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role?.toLowerCase();
  if (role !== 'mechanic' && role !== 'employee' && role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="assigned"
        options={{
          title: 'Assigned',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="servicecenter"
        options={{
          title: 'Center',
          tabBarIcon: ({ color, size }) => <Ionicons name="build" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="add-billing"
        options={{
          href: null,
          title: 'New Bill',
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
