import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

export default function AdminDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4">Admin Control Panel</Text>
        
        <View className="bg-slate-800 p-5 rounded-2xl mb-6 border border-sky-500/30 shadow-xl shadow-sky-500/10">
          <Text className="text-sky-400 font-bold text-lg mb-2">Platform Overview</Text>
          <Text className="text-gray-300 text-sm leading-relaxed">
            Welcome to the centralized management console. Use the tabs below to handle user accounts, platform settings, and advanced service configurations.
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {[
            { label: 'Total Sales', value: '$45,200', color: 'text-emerald-400' },
            { label: 'Active Users', value: '1,284', color: 'text-indigo-400' },
            { label: 'Open Bookings', value: '86', color: 'text-amber-400' },
            { label: 'System Health', value: 'Optimal', color: 'text-sky-400' }
          ].map((stat, i) => (
            <View key={i} className="w-[48%] bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
              <Text className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-widest">{stat.label}</Text>
              <Text className={`text-xl font-black ${stat.color}`}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View className="mt-8">
          <Text className="text-white font-bold text-lg mb-4">Recent Activity</Text>
          <View className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
             <Text className="text-gray-500 italic text-sm">Waiting for real-time logs...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
