import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Alert, 
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useRouter } from 'expo-router';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      // Fallback: if getUsers fails, try getStaff to at least show some users
      const staff = await apiService.getStaff().catch(() => []);
      setUsers(staff || []);
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

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const nameMatch = (u.username || u.name || u.email || '').toLowerCase().includes(term);
    
    if (filter === 'all') return nameMatch;
    return nameMatch && (u.role || 'user').toLowerCase() === filter.toLowerCase();
  });

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4 shadow-2xl relative overflow-hidden">
       {/* Background Accent */}
       <View className="absolute -top-10 -right-10 w-24 h-24 bg-slate-800 rounded-full" />
       
       <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-3xl bg-slate-800 items-center justify-center border border-white/10 shadow-inner">
             <Text className="text-white font-black text-xl">{(item.username || item.name || "U")[0].toUpperCase()}</Text>
          </View>
          
          <View className="flex-1">
             <View className="flex-row items-center gap-2">
                <Text className="text-white font-black text-sm tracking-tighter" numberOfLines={1}>
                  {item.username || item.name || "Anonymous User"}
                </Text>
                {item.role === 'admin' && (
                  <View className="bg-amber-950 px-2 py-0.5 rounded-full border border-amber-900">
                     <Text className="text-amber-500 text-[7px] font-black uppercase">Admin</Text>
                  </View>
                )}
             </View>
             <Text className="text-slate-500 text-[10px] font-bold mt-0.5" numberOfLines={1}>{item.email}</Text>
          </View>

          <TouchableOpacity className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
             <Ionicons name="ellipsis-vertical" size={16} color="#475569" />
          </TouchableOpacity>
       </View>

       <View className="h-px bg-white/5 my-5" />

       <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
             <View className="flex-row items-center gap-1">
                <Ionicons name="call-outline" size={12} color="#64748B" />
                <Text className="text-slate-400 text-[10px] font-black">{item.mobile || item.phone || 'N/A'}</Text>
             </View>
             <View className="w-1 h-1 rounded-full bg-slate-800" />
             <View className="flex-row items-center gap-1">
                <MaterialIcons name="verified-user" size={12} color={item.confirmed ? "#22c55e" : "#64748B"} />
                <Text className="text-slate-400 text-[10px] font-black uppercase">{item.confirmed ? "Verified" : "Guest"}</Text>
             </View>
          </View>
          
          <View className="bg-sky-950 px-3 py-1.5 rounded-xl border border-sky-900">
             <Text className="text-sky-500 text-[8px] font-black uppercase">Details →</Text>
          </View>
       </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-6">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-8">
           <View>
              <Text className="text-white font-black text-2xl uppercase tracking-tighter">User Directory</Text>
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Platform Account Management</Text>
           </View>
           <TouchableOpacity className="p-3 bg-slate-900 rounded-full border border-slate-800 shadow-2xl">
              <Ionicons name="filter" size={20} color="#0ea5e9" />
           </TouchableOpacity>
        </View>

        {/* SEARCH & RECENT FILTERS */}
        <View className="mb-8">
           <View className="flex-row items-center bg-slate-900 rounded-[20px] px-5 h-14 border border-white/5 shadow-inner">
              <Ionicons name="search" size={20} color="#475569" />
              <TextInput 
                 placeholder="Search by name, email, or ID..."
                 placeholderTextColor="#475569"
                 value={search}
                 onChangeText={setSearch}
                 className="flex-1 ml-3 text-white font-bold text-xs"
              />
           </View>
           
           <View className="flex-row gap-2 mt-4">
              {['all', 'admin', 'customer', 'employee'].map((f) => (
                <TouchableOpacity 
                   key={f}
                   onPress={() => setFilter(f)}
                   className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-sky-500 border-sky-400 shadow-lg shadow-sky-900' : 'bg-slate-900 border-slate-800'}`}
                >
                   <Text className={`${filter === f ? 'text-white' : 'text-slate-500'} text-[9px] font-black uppercase tracking-tighter`}>{f}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        {/* LIST */}
        {loading ? (
          <View className="mt-20 items-center">
             <ActivityIndicator size="large" color="#0ea5e9" />
             <Text className="text-slate-600 text-[10px] font-black uppercase mt-4 tracking-widest">Accessing User Database...</Text>
          </View>
        ) : (
          <FlatList 
            data={filtered}
            keyExtractor={(item) => (item.id || item.docId || Math.random()).toString()}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 250 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
            ListEmptyComponent={() => (
              <View className="mt-20 items-center opacity-30">
                 <FontAwesome5 name="users-slash" size={48} color="#475569" />
                 <Text className="text-white font-black text-xs uppercase mt-6 tracking-widest text-center">No Matching Accounts Found</Text>
                 <Text className="text-slate-500 text-[9px] mt-2 font-bold uppercase">Try adjusting your filters or search terms</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity 
        onPress={() => router.push("/(adminPages)/staff")} // Using staff as a proxy for adding if needed, or just a FAB
        className="absolute bottom-8 right-8 w-14 h-14 bg-sky-500 rounded-full items-center justify-center shadow-2xl shadow-sky-900"
        style={{ elevation: 10 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
