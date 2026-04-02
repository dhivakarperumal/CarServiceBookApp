import React from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AssignedServices() {
  const dummyData = [
    { id: '1', task: 'Engine Oil Change', vehicle: 'Honda Civic', status: 'Pending', time: '10:00 AM' },
    { id: '2', task: 'Brake Pad Replacement', vehicle: 'Hyundai i20', status: 'In Progress', time: '11:30 AM' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="p-5 flex-1">
        <Text className="text-white text-xl font-bold mb-5">Assigned Services</Text>
        
        <FlatList 
           data={dummyData}
           keyExtractor={item => item.id}
           renderItem={({item}) => (
             <TouchableOpacity className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700 flex-row items-center justify-between">
                <View>
                   <Text className="text-white font-bold">{item.task}</Text>
                   <Text className="text-gray-400 text-xs mt-1">{item.vehicle} • {item.time}</Text>
                </View>
                <View className="bg-sky-500/20 px-3 py-1 rounded border border-sky-500/30">
                   <Text className="text-sky-400 text-xs tracking-wider">{item.status}</Text>
                </View>
             </TouchableOpacity>
           )}
        />
      </View>
    </SafeAreaView>
  );
}
