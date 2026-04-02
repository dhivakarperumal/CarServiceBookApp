import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function EmployeeProfile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="p-5 flex-1">
        <View className="items-center mt-10 mb-8">
           <View className="w-24 h-24 bg-sky-500/20 rounded-full border-2 border-sky-500 justify-center items-center mb-4">
              <Ionicons name="person" size={40} color="#38bdf8" />
           </View>
           <Text className="text-white text-2xl font-bold">{user?.username || "Employee"}</Text>
           <Text className="text-gray-400 mt-1 uppercase tracking-widest text-xs">Service Admin</Text>
        </View>

        <View className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
           <View className="p-4 border-b border-slate-700 flex-row items-center justify-between">
              <Text className="text-white">Email Address</Text>
              <Text className="text-gray-400">{user?.email || "employee@qtechx.com"}</Text>
           </View>
           <View className="p-4 flex-row items-center justify-between">
              <Text className="text-white">Staff ID</Text>
              <Text className="text-gray-400">EMP-29001</Text>
           </View>
        </View>

        <TouchableOpacity 
           onPress={handleLogout}
           className="mt-8 bg-red-500/20 border border-red-500/40 p-4 rounded-xl flex-row items-center justify-center gap-2"
        >
           <Ionicons name="log-out-outline" size={20} color="#fca5a5" />
           <Text className="text-red-400 font-bold">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
