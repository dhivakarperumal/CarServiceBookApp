import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function HeaderDropdown() {
  const { user, logout } = useAuth();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

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
    setIsDropdownVisible(false);
  };

  const handleProfile = () => {
    router.push('/profile');
    setIsDropdownVisible(false);
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings feature coming soon!');
    setIsDropdownVisible(false);
  };

  const getUserInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(true)}
        className="flex-row items-center bg-white/20 rounded-full px-3 py-2 mr-2"
      >
        <View className="w-8 h-8 bg-white rounded-full items-center justify-center mr-2">
          <Text className="text-blue-600 font-bold text-sm">
            {getUserInitial()}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View className="absolute top-16 right-4 bg-white rounded-lg shadow-lg min-w-48">
            {/* User Info Header */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">
                    {getUserInitial()}
                  </Text>
                </View>
                <View>
                  <Text className="font-semibold text-gray-800">
                    {user?.username || 'User'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {user?.email || 'No email'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <TouchableOpacity
              onPress={handleProfile}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <Ionicons name="person" size={20} color="#6b7280" className="mr-3" />
              <Text className="text-gray-700 font-medium">Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSettings}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <Ionicons name="settings" size={20} color="#6b7280" className="mr-3" />
              <Text className="text-gray-700 font-medium">Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center p-4"
            >
              <Ionicons name="log-out" size={20} color="#dc2626" className="mr-3" />
              <Text className="text-red-600 font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}