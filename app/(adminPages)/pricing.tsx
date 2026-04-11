import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  TextInput
} from "react-native";
import { apiService } from "../../services/api";

export default function PricingList() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPackages = async () => {
    try {
      const data = await apiService.getPricingPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = (id: any) => {
    Alert.alert("Delete Package", "Are you sure you want to remove this pricing package?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deletePricingPackage(id);
            fetchPackages();
          } catch (err) {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  const filtered = packages.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="px-6 pt-14 pb-6">
        <Text className="text-white font-black text-3xl uppercase tracking-tighter">Pricing</Text>
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mt-1">Service Packages</Text>
      </View>

      <View className="px-6 mb-6">
        <View className="flex-row items-center bg-slate-900 rounded-[24px] px-5 h-14 border border-white/5">
           <Ionicons name="search" size={20} color="#475569" />
           <TextInput 
              placeholder="Search packages..."
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPackages} tintColor="#fff" />}
          renderItem={({ item: pkg }) => (
            <View className="bg-slate-900/50 rounded-[32px] p-6 mb-4 border border-white/5 overflow-hidden">
               {/* Accent Glow */}
               <View className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/5 rounded-full" />
               
               <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                     <Text className="text-white font-black text-xl tracking-tight mb-1">{pkg.title}</Text>
                     <Text className="text-white font-black text-lg">₹{Number(pkg.price || 0).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row gap-2">
                     <TouchableOpacity 
                        onPress={() => router.push({ pathname: '/(adminPages)/add-pricing', params: { id: pkg.id } } as any)}
                        className="w-10 h-10 rounded-2xl bg-sky-500/20 items-center justify-center border border-sky-500/30"
                     >
                        <Ionicons name="pencil" size={16} color="#0ea5e9" />
                     </TouchableOpacity>
                     <TouchableOpacity 
                        onPress={() => handleDelete(pkg.id)}
                        className="w-10 h-10 rounded-2xl bg-rose-500/20 items-center justify-center border border-rose-500/30"
                     >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                     </TouchableOpacity>
                  </View>
               </View>

               <View className="h-px bg-white/5 mb-4" />

               <View className="gap-2">
                  {pkg.features?.slice(0, 4).map((f: string, i: number) => (
                    <View key={i} className="flex-row items-center gap-2">
                       <Ionicons name="checkmark-circle" size={12} color="#0ea5e9" />
                       <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{f}</Text>
                    </View>
                  ))}
                  {pkg.features?.length > 4 && (
                     <Text className="text-slate-600 text-[8px] font-black uppercase ml-5">
                       +{pkg.features.length - 4} More Benefits
                     </Text>
                  )}
               </View>
            </View>
          )}
          ListEmptyComponent={() => (
             <View className="mt-20 items-center opacity-30">
                <Ionicons name="pricetags-outline" size={48} color="#475569" />
                <Text className="text-white font-black text-xs mt-6 uppercase tracking-widest text-center">No Packages Found</Text>
             </View>
          )}
        />
      )}

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity 
        onPress={() => router.push('/(adminPages)/add-pricing' as any)}
        className="absolute bottom-10 right-8 w-16 h-16 bg-white rounded-full items-center justify-center shadow-2xl z-50"
        style={{ elevation: 15 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={38} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
