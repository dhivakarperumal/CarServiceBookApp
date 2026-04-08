import React, { useState, useEffect } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useRouter } from 'expo-router';
import { COLORS } from "../../theme/colors";

export default function AdminStaff() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const data = await apiService.getStaff();
      setStaff(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load staff list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = staff.filter(s => 
    (s.name || s.username || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.role || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-4 border-b border-white/5 bg-slate-950">
         <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-black text-xl uppercase tracking-tighter">Team Management</Text>
            {/* REMOVED INLINE ADD MEMBER BUTTON - REPLACED BY FAB */}
         </View>

         <View className="flex-row items-center bg-slate-900 rounded-2xl px-4 h-12 border border-slate-800">
            <Ionicons name="search" size={18} color="#475569" />
            <TextInput 
               placeholder="Search technicians, roles..."
               placeholderTextColor="#475569"
               value={search}
               onChangeText={setSearch}
               className="flex-1 ml-2 text-white font-bold text-xs"
            />
         </View>
      </View>

      <ScrollView 
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View className="flex-row flex-wrap justify-between">
           {filtered.length === 0 ? (
             <View className="w-full p-20 items-center justify-center opacity-30">
                <Ionicons name="people-outline" size={48} color="#475569" />
                <Text className="text-white font-black text-xs uppercase mt-4">Empty Roster</Text>
             </View>
           ) : (
             filtered.map((s, i) => (
                 <View key={i} className="w-[48%] bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-2xl overflow-hidden">
                    <View className="absolute top-0 right-0 w-12 h-12 bg-slate-800 rounded-bl-3xl items-center justify-center">
                       <Ionicons name="shield-checkmark" size={14} color={s.role === 'Admin' ? '#8b5cf6' : '#94a3b8'} />
                    </View>
                    <View className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700 mb-3">
                       <Text className="text-white font-black text-lg">{(s.name || s.username || "S")[0].toUpperCase()}</Text>
                    </View>
                   <Text className="text-white font-black text-sm tracking-tighter">{s.name || s.username}</Text>
                   <Text className="text-violet-400 font-black text-[8px] uppercase tracking-widest mt-1">{s.role || 'Staff'}</Text>
                   
                   <View className="h-px bg-white/5 my-4" />
                   
                   <TouchableOpacity className="bg-white/5 p-2 rounded-xl items-center">
                      <Text className="text-slate-400 font-black text-[8px] uppercase">Permission →</Text>
                   </TouchableOpacity>
                </View>
             ))
           )}
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity 
        onPress={() => Alert.alert("Coming Soon", "Add Member functionality is under development.")}
        className="absolute bottom-8 right-8 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-2xl shadow-black"
        style={{ elevation: 10 }}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
