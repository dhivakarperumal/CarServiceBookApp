import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { apiService } from "../../services/api";

export default function CarServicesList() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchServices = async () => {
    try {
      const data = await apiService.getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = (id: any) => {
    Alert.alert("Delete Service", "Are you sure you want to remove this service from the catalog?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteService(id);
            fetchServices();
          } catch (err) {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  const filtered = services.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">


      <View className="px-6 mt-5 mb-6">
        <View className="flex-row items-center bg-slate-900 rounded-[24px] px-5 h-14 border border-white/5">
          <Ionicons name="search" size={20} color="#475569" />
          <TextInput
            placeholder="Search services..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-3 text-white font-black text-xs"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" className="mt-20" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchServices} tintColor="#fff" />}
          renderItem={({ item: srv }) => (
            <View className="bg-slate-900/50 rounded-[32px] p-5 mb-4 border border-white/5 overflow-hidden">
              {/* Accent Glow */}
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/5 rounded-full" />

              <View className="flex-row items-center gap-4">
                {srv.image ? (
                  <Image source={{ uri: srv.image }} className="w-20 h-20 rounded-2xl border border-white/10" />
                ) : (
                  <View className="w-20 h-20 bg-slate-800 rounded-2xl items-center justify-center border border-white/5">
                    <Ionicons name={srv.icon?.toLowerCase() || 'car'} size={32} color="#475569" />
                  </View>
                )}

                <View className="flex-1">
                  <Text className="text-white font-black text-lg tracking-tight mb-0.5">{srv.name}</Text>
                  <Text className="text-sky-500 font-black text-sm">₹{Number(srv.price || 0).toLocaleString()}</Text>
                  <Text className="text-slate-500 text-[9px] font-bold mt-1 uppercase" numberOfLines={1}>{srv.description || "NO DESCRIPTION"}</Text>
                </View>

                <View className="gap-2">
                     <TouchableOpacity 
                        onPress={() => router.push({ pathname: '/(adminPages)/add-car-service', params: { id: srv.id } } as any)}
                        className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center border border-[#0ea5e9]"
                     >
                    <Ionicons name="pencil" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(srv.id)}
                    className="w-10 h-10 rounded-xl bg-rose-500/10 items-center justify-center border border-rose-500/10"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="mt-20 items-center opacity-30">
              <Ionicons name="construct-outline" size={48} color="#475569" />
              <Text className="text-white font-black text-xs mt-6 uppercase tracking-widest text-center">No Services Found</Text>
            </View>
          )}
        />
      )}

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => router.push('/(adminPages)/add-car-service' as any)}
        className="absolute bottom-10 mb-8 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl z-50"
        style={{ elevation: 15 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={25} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
