import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

export default function AdminUsers() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4">User Management</Text>
        <View className="bg-slate-800 p-8 rounded-3xl border border-slate-700 items-center justify-center min-h-[300px]">
           <Text className="text-sky-400 font-bold text-lg mb-2">Platform Accounts</Text>
           <Text className="text-gray-400 text-sm text-center">There are no global user accounts to manage in the administrative console yet.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
