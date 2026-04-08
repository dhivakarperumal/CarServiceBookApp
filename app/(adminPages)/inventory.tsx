import React, { useEffect, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Modal
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER & ADD BUTTON */}
        <View className="flex-row justify-between items-end mb-8">
           <View>
              <Text className="text-white text-3xl font-black tracking-tighter uppercase">Inventory</Text>
              <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px]">Asset Maintenance Oversight</Text>
           </View>
           <TouchableOpacity 
             onPress={() => router.push('/(adminPages)/add-inventory' as any)}
             className="bg-sky-500 w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-sky-500/50"
           >
              <Ionicons name="add" size={28} color="white" />
           </TouchableOpacity>
        </View>

        {/* DASHBOARD STATS */}
        <View className="flex-row gap-3 mb-8">
           <View className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-3xl items-center shadow-xl">
              <Text className="text-white text-xl font-black">{stats.total}</Text>
              <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">In Stock</Text>
           </View>
           <View className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-3xl items-center shadow-xl">
              <Text className="text-amber-500 text-xl font-black">{stats.lowStock}</Text>
              <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">Low Units</Text>
           </View>
           <View className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-3xl items-center shadow-xl">
              <Text className="text-red-500 text-xl font-black">{stats.outOfStock}</Text>
              <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest text-center">Depleted</Text>
           </View>
        </View>

        {/* SEARCH & FILTERS */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl mb-8">
           <TextInput 
             className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-xs mb-4"
             placeholder="Search by part name or supplier..."
             placeholderTextColor="#334155"
             value={search}
             onChangeText={setSearch}
           />
           <View className="flex-row gap-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                 {categories.map(c => (
                   <TouchableOpacity 
                     key={c}
                     onPress={() => setSelectedCategory(c)}
                     className={`px-4 py-2 rounded-xl border ${selectedCategory === c ? 'bg-sky-500 border-sky-400' : 'bg-slate-950 border-slate-800'}`}
                   >
                      <Text className={`${selectedCategory === c ? 'text-white' : 'text-slate-500'} font-black text-[9px] uppercase`}>{c}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>
           </View>
        </View>

        {/* INVENTORY LIST */}
        <View>
           <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6 px-2">Manifest Entries ({filteredItems.length})</Text>
           
           {filteredItems.length === 0 ? (
             <View className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-20 items-center justify-center">
                <Ionicons name="cube-outline" size={32} color="#1e293b" />
                <Text className="text-slate-700 font-black text-[10px] uppercase mt-4">Zero assets found</Text>
             </View>
           ) : (
             filteredItems.map((item) => (
               <View key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-xl flex-row items-center gap-4">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center border ${item.stockQty === 0 ? 'bg-red-500/10 border-red-500/20' : item.stockQty <= (item.minStock || 5) ? 'bg-amber-500/10 border-amber-500/20' : 'bg-sky-500/10 border-sky-500/20'}`}>
                     <Ionicons 
                        name={item.stockQty === 0 ? "alert-circle" : "cube"} 
                        size={20} 
                        color={item.stockQty === 0 ? COLORS.error : item.stockQty <= (item.minStock || 5) ? COLORS.warning : COLORS.primary} 
                     />
                  </View>
                  <View className="flex-1">
                     <Text className="text-white font-black text-xs uppercase" numberOfLines={1}>{item.partName}</Text>
                     <Text className="text-slate-500 text-[8px] font-black uppercase mt-1 tracking-widest">{item.vendor} | {item.category}</Text>
                  </View>
                  <View className="items-end gap-2">
                     <View className="flex-row items-center gap-2">
                        <Text className={`font-black text-xs ${item.stockQty === 0 ? 'text-red-500' : 'text-white'}`}>{item.stockQty}</Text>
                        <View className="bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                           <Text className="text-slate-500 text-[8px] font-black uppercase">Units</Text>
                        </View>
                     </View>
                     <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => router.push({ pathname: '/(adminPages)/add-inventory', params: { id: item.id } } as any)}>
                           <Ionicons name="pencil-outline" size={14} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                           <Ionicons name="trash-outline" size={14} color="#ef4444" />
                        </TouchableOpacity>
                     </View>
                  </View>
               </View>
             ))
           )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InventoryManagement;
