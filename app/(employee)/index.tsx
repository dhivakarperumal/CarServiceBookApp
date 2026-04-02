import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

export default function EmployeeDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4">Employee Dashboard</Text>
        <View className="bg-slate-800 p-5 rounded-2xl mb-4 border border-sky-500/30">
           <Text className="text-sky-400 font-semibold mb-2">Welcome back!</Text>
           <Text className="text-gray-300 text-sm">Here is the quick overview of all tasks pending at your workspace today.</Text>
        </View>
        
        <View className="flex-row flex-wrap justify-between gap-y-4">
           {['Total Assigned', 'Pending Billing', 'Completed'].map((stat, i) => (
             <View key={i} className="w-[48%] bg-slate-800 p-4 rounded-xl border border-slate-700">
                <Text className="text-gray-400 text-xs mb-1 uppercase tracking-wider">{stat}</Text>
                <Text className="text-white text-2xl font-bold">{Math.floor(Math.random() * 20)}</Text>
             </View>
           ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
