import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const InventoryManagement = () => {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* FILTERS */
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState("All");

  const categories = [
    "All",
    "Engine Parts",
    "Brake System",
    "Suspension",
    "Electrical",
    "Filters",
    "Oils & Fluids",
    "Tyres & Wheels",
    "Body Parts",
    "Accessories",
  ];

  const vendors = [
    "All",
    "Bosch Auto Parts",
    "TVS Motor Spares",
    "MRF Distributors",
    "Castrol India",
    "Local Vendor",
  ];

  const fetchInventory = async () => {
    try {
      const data = await apiService.getInventory();
      setItems(data || []);
    } catch {
      Alert.alert("Error", "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleDelete = (id: any) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to remove this spare part?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.api.delete(`/inventory/${id}`);
              fetchInventory();
            } catch {
              Alert.alert("Error", "Failed to delete item");
            }
          }
        }
      ]
    );
  };

  /* STATS */
  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.stockQty > 0 && i.stockQty <= (i.minStock || 5)).length,
    outOfStock: items.filter(i => i.stockQty === 0).length
  };

  /* FILTERING */
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.partName?.toLowerCase().includes(search.toLowerCase()) ||
        item.vendor?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesVendor = selectedVendor === "All" || item.vendor === selectedVendor;
      return matchesSearch && matchesCategory && matchesVendor;
    });
  }, [items, search, selectedCategory, selectedVendor]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen options={{
        title: "Spare Parts Inventory",
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '900', fontSize: 16 }
      }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* DASHBOARD STATS */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-slate-900 border border-slate-800 p-5 rounded-[32px] items-center shadow-xl">
            <Text className="text-white text-2xl font-black">{stats.total}</Text>
            <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">Total Stock</Text>
          </View>
          <View className="flex-1 bg-slate-900 border border-slate-800 p-5 rounded-[32px] items-center shadow-xl">
            <Text className="text-amber-500 text-2xl font-black">{stats.lowStock}</Text>
            <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">Low Stock</Text>
          </View>
          <View className="flex-1 bg-slate-900 border border-slate-800 p-5 rounded-[32px] items-center shadow-xl">
            <Text className="text-red-500 text-2xl font-black">{stats.outOfStock}</Text>
            <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">Depleted</Text>
          </View>
        </View>

        {/* SEARCH SECTION */}
        <View className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 shadow-2xl mb-8">
          <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-1">
            <Ionicons name="search" size={16} color="#475569" />
            <TextInput
              className="flex-1 h-12 px-3 text-white font-bold text-xs"
              placeholder="Search by part name or supplier..."
              placeholderTextColor="#334155"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* INVENTORY LIST */}
        <View>
          <Text className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-6 px-4">Warehouse Status ({filteredItems.length})</Text>

          {filteredItems.length === 0 ? (
            <View className="bg-slate-900/30 border border-slate-800 border-dashed rounded-[32px] p-20 items-center justify-center">
              <Ionicons name="cube-outline" size={40} color="#1e293b" />
              <Text className="text-slate-700 font-black text-[10px] uppercase mt-4">Zero assets found</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <View key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 mb-5 shadow-sm flex-row items-center gap-5">
                <View className={`w-14 h-14 rounded-2xl items-center justify-center border ${item.stockQty === 0 ? 'bg-red-500/10 border-red-500/20' : item.stockQty <= (item.minStock || 5) ? 'bg-amber-500/10 border-amber-500/20' : 'bg-sky-500/10 border-sky-500/20'}`}>
                  <Ionicons
                    name={item.stockQty === 0 ? "alert-circle" : "cube"}
                    size={24}
                    color={item.stockQty === 0 ? COLORS.error : item.stockQty <= (item.minStock || 5) ? COLORS.warning : COLORS.primary}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-white font-black text-sm uppercase tracking-tight" numberOfLines={1}>{item.partName}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{item.category}</Text>
                    <Text className="text-slate-700 mx-2 text-xs">•</Text>
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{item.vendor}</Text>
                  </View>
                </View>

                <View className="items-end gap-3">
                  <View className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 items-center">
                    <Text className={`font-black text-sm ${item.stockQty === 0 ? 'text-red-500' : 'text-white'}`}>{item.stockQty}</Text>
                    <Text className="text-slate-600 text-[7px] font-black uppercase mt-0.5">Units</Text>
                  </View>

                  <View className="flex-row gap-4">
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/(adminPages)/add-inventory', params: { id: item.id } } as any)}
                      className="w-8 h-8 bg-slate-800 rounded-full items-center justify-center border border-[#0ea5e9]"
                    >
                      <Ionicons name="pencil" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      className="w-8 h-8 bg-rose-500/10 rounded-full items-center justify-center border border-rose-500/20"
                    >
                      <Ionicons name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => router.push('/(adminPages)/add-inventory' as any)}
        className="absolute bottom-10 mb-8 right-8 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-sky-500/20 z-50"
        style={{ elevation: 15 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={25} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default InventoryManagement;
