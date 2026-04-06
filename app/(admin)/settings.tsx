import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettings() {
  const [darkTheme, setDarkTheme] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="p-6">
        <Text className="text-white font-black text-xl tracking-tighter uppercase mb-6">Settings</Text>

        <View className="gap-6">
          <Section label="General">
             <SettingItem 
               icon="moon-outline" 
               title="Dark Mode" 
               value={darkTheme} 
               onValueChange={setDarkTheme} 
             />
             <SettingItem 
               icon="notifications-outline" 
               title="Admin Notifications" 
               value={notifications} 
               onValueChange={setNotifications} 
             />
          </Section>

          <Section label="Application Control">
             <SettingItem 
               icon="hammer-outline" 
               title="Maintenance Mode" 
               value={maintenanceMode} 
               onValueChange={setMaintenanceMode} 
               subtitle="Temporarily disable user bookings"
             />
          </Section>

          <Section label="Account">
             <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl">
                <View className="flex-row items-center gap-4">
                   <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                   <Text className="text-white font-bold">Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
             </TouchableOpacity>

             <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl">
                <View className="flex-row items-center gap-4">
                   <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" />
                   <Text className="text-white font-bold">Security Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
             </TouchableOpacity>
          </Section>

          <TouchableOpacity className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl mt-4 items-center">
             <Text className="text-red-500 font-black text-xs uppercase tracking-widest">Wipe Local Cache</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ label, children }: any) => (
  <View className="gap-3">
    <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px] ml-2">{label}</Text>
    <View className="gap-2">
       {children}
    </View>
  </View>
);

const SettingItem = ({ icon, title, subtitle, value, onValueChange }: any) => (
  <View className="flex-row items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl">
     <View className="flex-row items-center gap-4 flex-1">
        <View className="p-2 bg-white/5 rounded-xl border border-white/5">
           <Ionicons name={icon} size={18} color="#0ea5e9" />
        </View>
        <View>
           <Text className="text-white font-bold text-sm">{title}</Text>
           {subtitle && <Text className="text-gray-500 text-[8px] uppercase tracking-wide mt-0.5">{subtitle}</Text>}
        </View>
     </View>
     <Switch 
       value={value} 
       onValueChange={onValueChange} 
       thumbColor="#fff" 
       trackColor={{ false: '#334155', true: '#0ea5e9' }}
     />
  </View>
);
