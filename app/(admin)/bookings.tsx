import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

export default function AdminBookings() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4 text-center">Global Bookings</Text>
        <View className="bg-slate-800 p-8 rounded-3xl border border-slate-700 items-center justify-center min-h-[300px]">
           <Text className="text-sky-400 font-bold text-lg mb-2">Service Queue Admin</Text>
           <Text className="text-gray-400 text-sm text-center">There are currently no global service bookings to display in the administrative console.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
