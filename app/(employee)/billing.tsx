import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function EmployeeBilling() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="p-5 flex-1 justify-center items-center">
        <View className="bg-emerald-500/20 p-8 rounded-full mb-4 border border-emerald-500/30">
           <Text className="text-4xl text-emerald-400">💵</Text>
        </View>
        <Text className="text-white text-xl font-bold mb-2">Billing & Invoices</Text>
        <Text className="text-gray-400 text-center">Generate bills for completed services and track payment collections.</Text>
      </View>
    </SafeAreaView>
  );
}
