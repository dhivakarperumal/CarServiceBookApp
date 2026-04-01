import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-gray-800 mb-6">
        Profile
      </Text>

      <View className="bg-gray-50 p-4 rounded-lg mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          {user?.username || 'User'}
        </Text>
        <Text className="text-gray-600 mb-2">
          {user?.email || 'No email'}
        </Text>
        <Text className="text-gray-600 mb-2">
          Mobile: {user?.mobile || 'No mobile'}
        </Text>
        <Text className="text-gray-600">
          Role: {user?.role || 'user'}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-lg mb-4"
        onPress={() => Alert.alert('Edit Profile', 'Feature coming soon!')}
      >
        <Text className="text-white text-center font-semibold">
          Edit Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-600 py-3 rounded-lg mb-4"
        onPress={() => Alert.alert('Settings', 'Feature coming soon!')}
      >
        <Text className="text-white text-center font-semibold">
          Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-red-600 py-3 rounded-lg"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}