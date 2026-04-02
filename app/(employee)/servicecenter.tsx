import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function ServiceCenter() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="p-5 flex-1 justify-center items-center">
        <View className="bg-slate-800 p-8 rounded-full mb-4 border border-slate-700">
           <Text className="text-4xl text-sky-400">🏢</Text>
        </View>
        <Text className="text-white text-xl font-bold mb-2">Service Center Status</Text>
        <Text className="text-gray-400 text-center">Manage service bays, current capacity, and incoming vehicle queues here.</Text>
      </View>
    </SafeAreaView>
  );
}
