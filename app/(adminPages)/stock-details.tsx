import React, { useEffect, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Alert, 
  RefreshControl,
  Dimensions,
  Platform
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const StockDetails = () => {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* FETCH PRODUCTS */
  const fetchProducts = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const data = await apiService.getProducts();
      setProducts(data || []);
    } catch {
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  /* SEARCH FILTER */
  const filteredProducts = useMemo(() =>
    products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  /* HANDLE STOCK INPUT */
  const handleStockChange = (productId: string, index: number, value: string) => {
    setStockInputs((prev) => ({ ...prev, [`${productId}-${index}`]: value }));
  };

  /* UPDATE STOCK */
  const updateStock = async (product: any) => {
    try {
      const updatedVariants = product.variants.map((v: any, i: number) => {
        const key = `${product.docId || product.id}-${i}`;
        const addedStock = Number(stockInputs[key] || 0);
        return { ...v, stock: Number(v.stock || 0) + addedStock };
      });

      const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);

      await apiService.updateProductStock(product.docId || product.id, { 
        variants: updatedVariants, 
        totalStock 
      });

      Alert.alert("Success", "Stock updated successfully");
      setStockInputs({});
      fetchProducts();
    } catch {
      Alert.alert("Error", "Failed to update stock");
    }
  };

  const renderVariantRows = (product: any) => {
    return product.variants?.map((v: any, vi: number) => {
      const key = `${product.docId || product.id}-${vi}`;
      const added = Number(stockInputs[key] || 0);
      const newTotal = Number(v.stock || 0) + added;
      
      return (
        <View key={vi} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
          <View className="flex-row justify-between items-center mb-3">
             <View>
                <Text className="text-white font-black text-[10px] uppercase tracking-tighter">{v.position || 'Standard'} | {v.material || 'N/A'}</Text>
                <Text className="text-gray-600 text-[8px] font-black uppercase">SKU: {v.sku || 'N/A'}</Text>
             </View>
             <View className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Text className="text-gray-400 text-[9px] font-black uppercase">Current: <Text className="text-white">{v.stock || 0}</Text></Text>
             </View>
          </View>
          
          <View className="flex-row items-center gap-3">
             <View className="flex-1">
                <TextInput
                  placeholder="Add Quantity"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  value={stockInputs[key] || ""}
                  onChangeText={(val) => handleStockChange(product.docId || product.id, vi, val)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-xs"
                />
             </View>
             <View className="px-4 items-center">
                <Text className="text-emerald-500 font-black text-xs">NEW</Text>
                <Text className="text-white font-black text-xs">{newTotal}</Text>
             </View>
          </View>
        </View>
      );
    });
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const isExpanded = expanded === (item.docId || item.id);
    const imageUrl = item.thumbnail || (item.images && item.images.length > 0 ? item.images[0] : null);
    const lowStock = (item.totalStock || 0) < 5;

    if (view === "list") {
      return (
        <View className="bg-slate-900 border border-slate-800 rounded-3xl mb-4 overflow-hidden shadow-2xl">
           <TouchableOpacity 
             onPress={() => setExpanded(isExpanded ? null : (item.docId || item.id))}
             className="p-4 flex-row items-center gap-4"
           >
              <Image 
                source={{ uri: imageUrl || "https://via.placeholder.com/150?text=Part" }} 
                className="w-12 h-12 rounded-2xl bg-slate-800"
              />
              <View className="flex-1">
                 <Text className="text-white font-black text-sm uppercase tracking-tighter" numberOfLines={1}>{item.name}</Text>
                 <View className="flex-row items-center gap-4 mt-1">
                    <Text className="text-gray-500 text-[9px] font-black uppercase">Variants: {item.variants?.length || 0}</Text>
                    <View className="w-1 h-1 rounded-full bg-slate-800" />
                    <Text className={`${lowStock ? 'text-red-500' : 'text-emerald-500'} text-[9px] font-black uppercase`}>
                      Stock: {item.totalStock || 0}
                    </Text>
                 </View>
              </View>
              <View className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? 'bg-sky-500' : 'bg-slate-800 border border-slate-700'}`}>
                 <Ionicons name={isExpanded ? "chevron-up" : "settings-sharp"} size={14} color="white" />
              </View>
           </TouchableOpacity>

           {isExpanded && (
             <View className="bg-slate-900/50 p-4 border-t border-slate-800">
                <Text className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-4 px-1">Inventory Management</Text>
                {renderVariantRows(item)}
                <TouchableOpacity 
                  onPress={() => updateStock(item)}
                  className="bg-sky-500 py-4 rounded-2xl mt-4 items-center shadow-lg shadow-sky-500/20"
                >
                   <Text className="text-white font-black text-xs uppercase tracking-widest">Update Warehouse Stock →</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>
      );
    }

    return (
      <View style={{ width: COLUMN_WIDTH }} className="bg-slate-900 border border-slate-800 rounded-3xl p-3 mb-4 shadow-2xl m-1">
         <Image 
            source={{ uri: imageUrl || "https://via.placeholder.com/300x200?text=Product+Image" }} 
            className="w-full h-32 rounded-2xl bg-slate-800 mb-3"
         />
         <Text className="text-white font-black text-[11px] uppercase tracking-tighter mb-1" numberOfLines={1}>{item.name}</Text>
         <Text className={`${lowStock ? 'text-red-500' : 'text-emerald-500'} text-[9px] font-black uppercase mb-4`}>Total: {item.totalStock || 0}</Text>
         
         <TouchableOpacity 
            onPress={() => setExpanded(isExpanded ? null : (item.docId || item.id))}
            className="bg-slate-800 py-2.5 rounded-xl border border-slate-700 items-center mb-2"
         >
            <Text className="text-sky-500 font-black text-[9px] uppercase">{isExpanded ? "Hide Details" : "Manage Stock"}</Text>
         </TouchableOpacity>

         {isExpanded && (
           <View className="mt-2 pt-2 border-t border-slate-800">
              {renderVariantRows(item)}
              <TouchableOpacity 
                onPress={() => updateStock(item)}
                className="bg-sky-500 py-3 rounded-xl mt-2 items-center"
              >
                 <Text className="text-white font-black text-[9px] uppercase">Update</Text>
              </TouchableOpacity>
           </View>
         )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Warehouse Distribution",
          headerTitleStyle: { color: 'white', fontWeight: '900', fontSize: 16 },
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: 'white',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2 w-8 h-8 items-center justify-center">
               <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
          )
        }} 
      />

      <View className="p-4 flex-1">
        {/* TOP CONTROLS */}
        <View className="mb-6 gap-4">
           {/* SEARCH */}
           <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-1 h-14 shadow-inner">
              <Ionicons name="search" size={18} color="#475569" />
              <TextInput 
                placeholder="Find components in warehouse..."
                placeholderTextColor="#475569"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-white font-bold text-xs"
              />
           </View>

           {/* VIEW TOGGLES */}
           <View className="flex-row justify-between items-center">
              <View>
                 <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Inventory Oversight</Text>
                 <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">Stock Portfolio</Text>
              </View>
              <View className="flex-row bg-slate-900 rounded-xl p-1 border border-slate-800">
                 <TouchableOpacity 
                   onPress={() => setView("list")}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                   className={`px-3 py-1.5 rounded-lg ${view === "list" ? 'bg-slate-800' : ''}`}
                 >
                   <MaterialIcons name="format-list-bulleted" size={14} color={view === "list" ? "white" : "#64748b"} />
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={() => setView("grid")}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                   className={`px-3 py-1.5 rounded-lg ${view === "grid" ? 'bg-slate-800' : ''}`}
                 >
                   <MaterialIcons name="grid-view" size={14} color={view === "grid" ? "white" : "#64748b"} />
                 </TouchableOpacity>
              </View>
           </View>
        </View>

        {/* LISTING */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
             <ActivityIndicator size="large" color="#0ea5e9" />
             <Text className="text-gray-600 text-[10px] font-black uppercase mt-4 tracking-widest">Loading Logistics Data...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center opacity-30">
             <MaterialIcons name="inventory" size={64} color="#1e293b" />
             <Text className="text-white font-black text-xs uppercase mt-6">Warehouse Empty</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => (item.docId || item.id || Math.random()).toString()}
            renderItem={renderProductItem}
            numColumns={view === "grid" ? 2 : 1}
            key={`products-${view}`}
            columnWrapperStyle={view === "grid" ? { justifyContent: 'space-between', paddingHorizontal: 4 } : null}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
          />
        )}
      </View>

      {/* FAB - ADD STOCK */}
      <TouchableOpacity 
        onPress={() => router.push("/(adminPages)/add-stock" as any)}
        className="absolute bottom-10 right-8 w-16 h-16 bg-sky-500 rounded-3xl items-center justify-center shadow-2xl shadow-sky-900"
        style={{ elevation: 15 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default StockDetails;
