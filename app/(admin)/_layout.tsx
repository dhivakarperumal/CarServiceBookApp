import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { useRouter, Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MenuItem = ({ icon, title, onPress, color = "#94a3b8" }: any) => (
  <TouchableOpacity onPress={onPress} className="flex-row items-center px-4 py-4 gap-4">
     <Ionicons name={icon} size={20} color={color} />
     <Text style={{ color }} className="font-black text-xs uppercase tracking-widest">{title}</Text>
  </TouchableOpacity>
);

function AdminHeader() {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const initial = (user?.username || "A").charAt(0).toUpperCase();

  return (
    <View className="bg-slate-950 px-6 pt-14 pb-4 border-b border-white/5 flex-row justify-between items-center">
       <View>
          <Text className="text-white font-black text-xl tracking-tighter">ADMIN PANEL</Text>
          <Text className="text-sky-500 text-[8px] font-black uppercase tracking-[2px]">Management Suite</Text>
       </View>

       <TouchableOpacity 
         onPress={() => setMenuVisible(true)}
         className="w-10 h-10 rounded-full bg-slate-900 border border-white/20 items-center justify-center"
       >
          <Text className="text-white font-black text-lg">{initial}</Text>
       </TouchableOpacity>

       <Modal visible={menuVisible} transparent animationType="fade">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)} 
            className="flex-1 bg-black/60 items-end pr-6 pt-24"
          >
             <View className="bg-slate-900 border border-white/10 rounded-3xl w-56 overflow-hidden shadow-2xl">
                <View className="p-4 border-b border-white/5 bg-white/5">
                   <Text className="text-white font-black text-xs">{user?.username}</Text>
                   <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider mt-0.5">{user?.email}</Text>
                </View>
                
                <MenuItem icon="person-outline" title="Profile" onPress={() => { setMenuVisible(false); router.push('/(admin)/profile'); }} />
                <MenuItem icon="home-outline" title="Home View" onPress={() => { setMenuVisible(false); router.replace('/(tabs)/home'); }} />
                <MenuItem icon="settings-outline" title="Settings" onPress={() => { setMenuVisible(false); }} />
                
                <View className="h-[1px] bg-white/5 mx-4" />
                
                <MenuItem icon="log-out-outline" title="Logout" onPress={handleLogout} color="#ef4444" />
             </View>
          </TouchableOpacity>
       </Modal>
    </View>
  );
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role?.toLowerCase();
  if (role === 'mechanic' || role === 'employee') {
    return <Redirect href="/(employee)/staff" />;
  } else if (role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <AdminHeader />,
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appts',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-number" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Ionicons name="build" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
