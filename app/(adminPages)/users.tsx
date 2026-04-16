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
  Modal,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';

interface PlatformUser {
  id: string | number;
  username: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  type: "registered" | "guest";
  bookingsCount: number;
}

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<PlatformUser[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection Modal
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [authRes, bookingsRes] = await Promise.all([
        apiService.getAuthUsers(),
        apiService.getBookings()
      ]);

      const authUsers = (Array.isArray(authRes) ? authRes : []) as any[];
      const bookings = (Array.isArray(bookingsRes) ? bookingsRes : []) as any[];

      const customerMap = new Map<string, PlatformUser>();

      // 1. Add Registered Users
      authUsers.forEach(user => {
        const key = user.email ? user.email.toLowerCase() : `user-${user.id}`;
        customerMap.set(key, {
          id: user.id,
          username: user.username || "User",
          email: user.email || "No Email",
          phone: user.phone || user.mobile || "-",
          role: user.role || "customer",
          active: !!user.active,
          type: "registered",
          bookingsCount: 0
        });
      });

      // 2. Merge Service Bookings
      bookings.forEach(b => {
        const emailKey = b.email ? b.email.toLowerCase() : null;
        let customer: PlatformUser | undefined = undefined;

        if (emailKey && customerMap.has(emailKey)) {
          customer = customerMap.get(emailKey);
        } else {
          // Look by phone
          for (let c of customerMap.values()) {
            if (c.phone === b.phone && b.phone && b.phone !== "-") {
              customer = c;
              break;
            }
          }
        }

        if (customer) {
          customer.bookingsCount++;
          if (customer.phone === "-" && b.phone) customer.phone = b.phone;
          if (!customer.username && b.name) customer.username = b.name;
        } else {
          const newKey = emailKey || `guest-${b.phone || b.id}`;
          customerMap.set(newKey, {
            id: `guest-${b.id}`,
            username: b.name || "Guest",
            email: b.email || "No Email",
            phone: b.phone || "-",
            role: "customer",
            active: true,
            type: "guest",
            bookingsCount: 1
          });
        }
      });

      setUsers(Array.from(customerMap.values()));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load directory data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRole = async (role: string) => {
    if (!selectedUser) return;
    try {
      await apiService.updateUserRole(selectedUser.id, role);
      setRoleModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to update role");
    }
  };

  const handleToggleStatus = (u: PlatformUser) => {
    Alert.alert(
      u.active ? "Deactivate Account" : "Activate Account",
      `Are you sure you want to ${u.active ? 'deactivate' : 'activate'} ${u.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await apiService.updateUserStatus(u.id, !u.active);
              fetchData();
            } catch (err) {
              Alert.alert("Error", "Status update failed");
            }
          }
        }
      ]
    );
  };

  const handleDelete = (u: PlatformUser) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteUser(u.id);
              fetchData();
            } catch (err) {
              Alert.alert("Error", "Deletion failed");
            }
          }
        }
      ]
    );
  };

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const matchSearch = (u.username || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term);
    const matchRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.active : !u.active);
    return matchSearch && matchRole && matchStatus;
  });

  const totalRegistered = users.filter(u => u.type === 'registered').length;
  const activeCount = users.filter(u => u.active).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View className="px-5 pt-8 pb-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-2xl font-black uppercase tracking-tight">Users</Text>
              
            </View>
          </View>
          <View className="items-end">
            <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Text className="text-primary text-[10px] font-black uppercase">{filtered.length} Results</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1">


        {/* STATS CARDS */}
        <View className="px-6 flex-row gap-3 mt-7 mb-8">
          <View className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5 relative overflow-hidden">
            <View className="w-10 h-10 bg-sky-500/10 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="people" size={18} color="#0ea5e9" />
            </View>
            <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[2px] mb-1">Total</Text>
            <Text className="text-white font-black text-2xl tracking-tighter">{users.length}</Text>
            <View className="absolute -top-2 -right-2 w-12 h-12 bg-sky-500/5 rounded-full" />
          </View>

          <View className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5 relative overflow-hidden">
            <View className="w-10 h-10 bg-emerald-500/10 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="shield-checkmark" size={18} color="#10b981" />
            </View>
            <Text className="text-emerald-500 text-[8px] font-black uppercase tracking-[2px] mb-1">Active</Text>
            <Text className="text-white font-black text-2xl tracking-tighter">{activeCount}</Text>
            <View className="absolute -top-2 -right-2 w-12 h-12 bg-emerald-500/5 rounded-full" />
          </View>

          <View className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5 relative overflow-hidden">
            <View className="w-10 h-10 bg-indigo-500/10 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="finger-print" size={18} color="#6366f1" />
            </View>
            <Text className="text-indigo-500 text-[8px] font-black uppercase tracking-[2px] mb-1">Accounts</Text>
            <Text className="text-white font-black text-2xl tracking-tighter">{totalRegistered}</Text>
            <View className="absolute -top-2 -right-2 w-12 h-12 bg-indigo-500/5 rounded-full" />
          </View>
        </View>

        {/* FILTERS */}
        <View className="px-6 gap-4 mb-4">
          {/* SEARCH */}
          <View className="flex-row items-center bg-slate-900 rounded-2xl px-5 h-14 border border-white/5 shadow-inner">
            <Ionicons name="search" size={20} color="#475569" />
            <TextInput
              placeholder="Search name, email, or credentials..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-white font-black text-xs"
            />
          </View>

          {/* CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-12">
            <View className="flex-row gap-2 pr-6">
              {['all', 'admin', 'mechanic','user'].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setRoleFilter(f)}
                  className={`px-6 h-10 items-center justify-center rounded-xl border ${roleFilter === f ? 'bg-white border-white' : 'bg-slate-900 border-slate-800'}`}
                >
                  <Text className={`${roleFilter === f ? 'text-black' : 'text-slate-500'} text-[10px] font-black uppercase tracking-widest`}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* LIST */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(u) => u.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#fff" />}
            renderItem={({ item: u }) => (
              <View key={u.id} className="bg-slate-900/50 rounded-[32px] p-6 mb-5 border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Background Glow Accent */}
                <View className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 ${u.type === 'guest' ? 'bg-cyan-500' : 'bg-indigo-500'}`} />

                <View className="flex-row items-center mb-6" >
                  <View
                    className="w-16 h-16 rounded-[22px] mr-5 items-center justify-center bg-white/10 shadow-lg"
                    style={{
                      borderWidth: 2,
                      borderColor: "#0ea5e9" 
                    }}
                  >
                    <Text
                      className="text-2xl font-extrabold"
                      style={{ color: "#fff" }}
                    >
                      {(u.username || 'U')[0].toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="text-white font-black text-lg tracking-tight" numberOfLines={1}>{u.username}</Text>
                      {u.type === 'guest' && (
                        <View className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Text className="text-emerald-500 text-[6px] font-black uppercase tracking-widest">Walk-In</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-slate-500 text-[10px] font-bold" numberOfLines={1}>{u.email}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons name="call" size={8} color="#0ea5e9" />
                      <Text className="text-primary text-[9px] font-black tracking-widest">{u.phone !== '-' ? u.phone : 'NO CONTACT'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (u.type === 'registered') {
                        setSelectedUser(u);
                        setRoleModalVisible(true);
                      }
                    }}
                    className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-white/5 items-center justify-center"
                  >
                    <Text
  className="text-[10px] font-bold uppercase tracking-widest"
  style={{ color: "#fff" }}
>{u.role}</Text>
                    {u.type === 'registered' && <Ionicons name="chevron-down" size={10} color="#64748B" className="mt-1" />}
                  </TouchableOpacity>
                </View>

                {/* Status & Stats Row */}
                <View className="flex-row justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                  <View className="flex-row items-center gap-6 px-2">
                    <View>
                      <Text className="text-slate-500 text-[7px] font-black uppercase tracking-widest mb-1">Engagements</Text>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <Text className="text-white font-black text-sm">{u.bookingsCount} <Text className="text-slate-500 text-[10px]">Orders</Text></Text>
                      </View>
                    </View>

                    <View className="w-px h-8 bg-white/5" />

                    <View>
                      <Text className="text-slate-500 text-[7px] font-black uppercase tracking-widest mb-1">Account Visibility</Text>
                      <TouchableOpacity onPress={() => handleToggleStatus(u)} className="flex-row items-center gap-1.5">
                        <View className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <Text className={`${u.active ? 'text-emerald-500' : 'text-rose-500'} font-black text-[10px] uppercase tracking-widest`}>
                          {u.active ? 'LIVE' : 'LOCKED'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(u)}
                    className="w-12 h-12 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/20"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* ROLE MODAL */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
          <View className="w-full bg-slate-900 border border-white/10 rounded-[40px] p-8">
            <Text className="text-white font-black text-2xl tracking-tighter mb-1">UPDATE ROLE</Text>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Change Permissions For {selectedUser?.username}</Text>

            <View className="gap-3">
              {['Admin', 'Mechanic', 'Staff', 'Customer'].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleUpdateRole(r.toLowerCase())}
                  className="w-full h-16 bg-slate-800 rounded-2xl flex-row items-center justify-between px-6 border border-white/5"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-widest">{r}</Text>
                  {selectedUser?.role.toLowerCase() === r.toLowerCase() ? (
                    <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
                  ) : (
                    <View className="w-5 h-5 rounded-full border border-white/20" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setRoleModalVisible(false)}
              className="mt-8 w-full h-14 items-center justify-center bg-white/5 rounded-2xl"
            >
              <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
