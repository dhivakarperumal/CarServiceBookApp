import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to exit the admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: logout,
          style: 'destructive' 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-5 pt-5">
        
        {/* Header / Profile Card */}
        <View className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 items-center mb-8 shadow-2xl">
          <View className="mb-5">
            <View className="w-24 h-24 rounded-full bg-sky-500 items-center justify-center shadow-lg shadow-sky-500/50">
               <Ionicons name="shield-checkmark" size={48} color="#fff" />
            </View>
          </View>
          <Text className="text-white text-3xl font-black tracking-tight">{user?.username || 'Administrator'}</Text>
          <Text className="text-slate-400 text-base mt-1 font-medium">{user?.email || 'admin@qtechx.com'}</Text>
          
          <View className="bg-sky-500/10 border border-sky-500/20 px-5 py-2 rounded-2xl mt-6">
            <Text className="text-sky-500 text-xs font-black tracking-[3px] uppercase">Super Admin</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="gap-y-6">
          <View>
            <Text className="text-slate-500 text-xs font-black tracking-[2px] uppercase mb-4 px-2">System Controls</Text>
            
            <View className="gap-y-3">
              {[
                { label: 'Global Configuration', icon: 'settings-outline' },
                { label: 'Staff Management', icon: 'people-outline' },
                { label: 'Platform Analytics', icon: 'bar-chart-outline' },
                { label: 'System Audit Logs', icon: 'list-outline' }
              ].map((item, idx) => (
                <TouchableOpacity 
                  key={idx}
                  className="flex-row items-center bg-slate-900/50 p-5 rounded-3xl border border-slate-800/50"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center">
                    <Ionicons name={item.icon as any} size={20} color="#94a3b8" />
                  </View>
                  <Text className="flex-1 text-slate-200 ml-4 font-semibold text-base">{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Danger Zone */}
          <View className="mt-2">
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center justify-center bg-red-500/10 p-5 rounded-3xl border border-red-500/20"
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color="#f87171" />
              <Text className="text-red-400 font-black text-base ml-3">Terminate Session</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
