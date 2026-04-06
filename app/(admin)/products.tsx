import React, { useEffect, useState } from "react";
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
import { api } from "../../services/api";
import { useRouter } from "expo-router";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;
const ITEMS_PER_PAGE = 10;

const AllProducts = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* FETCH */
  const fetchProducts = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const res = await api.get("/products");
      // Handle the case where response might not be an array
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert("Error", "Failed to load products. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchProducts(); 
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  /* DELETE */
  const handleDelete = (docId: string | number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/products/${docId}`);
              Alert.alert("Success", "Product deleted successfully");
              fetchProducts();
            } catch (error) {
              Alert.alert("Error", "Delete failed. Please try again.");
            }
          } 
        }
      ]
    );
  };

  /* EDIT */
  const handleEdit = (product: any) => {
    router.push({
      pathname: "/(adminPages)/add-products",
      params: { editData: JSON.stringify(product) }
    });
  };

  /* TOGGLE ACTIVE */
  const toggleStatus = async (product: any) => {
    try {
      await api.put(`/products/status/${product.docId || product.id}`, { isActive: !product.isActive });
      fetchProducts(true);
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  /* FILTER + SEARCH */
  const filteredProducts = products
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filter === "active") return p.isActive;
      if (filter === "inactive") return !p.isActive;
      if (filter === "featured") return p.isFeatured;
      return true;
    });

  /* PAGINATION */
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const renderProductItem = ({ item, index }: { item: any, index: number }) => {
    const imageUrl = (item.images && item.images.length > 0) 
      ? item.images[0] 
      : (item.thumbnail?.startsWith('[') ? JSON.parse(item.thumbnail)[0] : item.thumbnail);
    
    if (view === "list") {
      return (
        <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 mb-4 flex-row items-center shadow-sm">
          <View className="relative">
            <Image 
              source={{ uri: imageUrl || "https://via.placeholder.com/150?text=No+Image" }} 
              className="w-16 h-16 rounded-2xl bg-slate-800"
              resizeMode="cover"
            />
            {item.isFeatured && (
              <View className="absolute -top-1 -left-1 bg-amber-500 w-4 h-4 rounded-full items-center justify-center border border-slate-900">
                <FontAwesome name="star" size={8} color="white" />
              </View>
            )}
          </View>
          
          <View className="flex-1 ml-4">
            <Text className="text-white font-bold text-sm" numberOfLines={1}>{item.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-sky-400 font-black text-xs">₹ {item.offerPrice || item.mrp}</Text>
              {item.offerPrice && item.offerPrice < item.mrp && (
                <Text className="text-gray-500 text-[10px] line-through ml-2">₹ {item.mrp}</Text>
              )}
            </View>
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">Stock: {item.totalStock || 0}</Text>
              <View className="w-1 h-1 rounded-full bg-gray-700 mx-2" />
              <Text className="text-amber-500 text-[10px] font-black">⭐ {item.rating || 0}</Text>
            </View>
          </View>

          <View className="items-end gap-2">
            <TouchableOpacity 
              onPress={() => toggleStatus(item)}
              className={`${item.isActive ? 'bg-emerald-500/10' : 'bg-red-500/10'} px-2 py-1 rounded-full border ${item.isActive ? 'border-emerald-500/20' : 'border-red-500/20'}`}
            >
              <Text className={`${item.isActive ? 'text-emerald-500' : 'text-red-500'} text-[8px] font-black uppercase`}>
                {item.isActive ? "Active" : "Inactive"}
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => handleEdit(item)} className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-white/5">
                <MaterialIcons name="edit" size={14} color="#0ea5e9" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.docId || item.id)} className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-white/5">
                <MaterialIcons name="delete" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ width: COLUMN_WIDTH }} className="bg-slate-900/50 border border-white/5 rounded-3xl p-3 mb-4 shadow-sm m-1">
        <View className="relative">
          <Image 
            source={{ uri: imageUrl || "https://via.placeholder.com/400x300?text=Product+Image" }} 
            className="w-full h-32 rounded-2xl bg-slate-800"
            resizeMode="cover"
          />
          <View className="absolute top-2 right-2 flex-row gap-1">
            {item.isFeatured && (
               <View className="bg-amber-500 px-2 py-0.5 rounded-full shadow-sm">
                 <Text className="text-white text-[8px] font-black uppercase">Featured</Text>
               </View>
            )}
          </View>
          <TouchableOpacity 
            onPress={() => toggleStatus(item)}
            className={`absolute bottom-2 right-2 px-2 py-1 rounded-full shadow-sm ${item.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <Text className="text-white text-[8px] font-black uppercase">{item.isActive ? "Active" : "Inactive"}</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mt-3">
          <Text className="text-white font-bold text-xs" numberOfLines={1}>{item.name}</Text>
          <Text className="text-sky-400 font-black text-sm mt-1">₹ {item.offerPrice || item.mrp}</Text>
          
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <MaterialIcons name="inventory" size={10} color="#64748b" />
              <Text className="text-gray-500 text-[9px] font-black ml-1">{item.totalStock || 0}</Text>
            </View>
            <View className="flex-row items-center">
               <Text className="text-amber-500 text-[9px] font-black">⭐ {item.rating || 0}</Text>
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity onPress={() => handleEdit(item)} className="flex-1 h-8 rounded-xl bg-slate-800 items-center justify-center border border-white/5">
              <MaterialIcons name="edit" size={14} color="#0ea5e9" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.docId || item.id)} className="flex-1 h-8 rounded-xl bg-slate-800 items-center justify-center border border-white/5">
              <MaterialIcons name="delete" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-4 flex-1">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-black uppercase tracking-tighter">Inventory</Text>
            <Text className="text-sky-500 text-[10px] font-black uppercase tracking-widest">Global Product Catalog</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push("/(adminPages)/add-products")}
            className="w-12 h-12 bg-sky-500 rounded-3xl items-center justify-center shadow-lg shadow-sky-500/20"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* SEARCH & FILTERS */}
        <View className="mb-6">
          <View className="flex-row items-center bg-slate-900 border border-white/5 rounded-2xl px-4 py-2 mb-4">
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput 
              placeholder="Search components, parts, products..."
              placeholderTextColor="#64748b"
              className="flex-1 ml-3 text-white text-xs py-1"
              value={search}
              onChangeText={(txt) => { setSearch(txt); setPage(1); }}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="flex-row mb-2"
          >
            {[
              { id: 'all', label: 'All Items' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'featured', label: 'Featured' }
            ].map((f) => (
              <TouchableOpacity 
                key={f.id}
                onPress={() => { setFilter(f.id); setPage(1); }}
                className={`mr-2 px-4 py-2 rounded-full border ${filter === f.id ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-white/5'}`}
              >
                <Text className={`${filter === f.id ? 'text-white' : 'text-gray-500'} text-[10px] font-black uppercase tracking-tighter`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row justify-between items-center mt-2 px-1">
             <Text className="text-gray-600 text-[10px] font-black uppercase">
               Showing {filteredProducts.length} Results
             </Text>
             <View className="flex-row bg-slate-900 rounded-xl p-1 border border-white/5">
                <TouchableOpacity 
                  onPress={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg ${view === "list" ? 'bg-slate-800 shadow-sm' : ''}`}
                >
                  <MaterialIcons name="format-list-bulleted" size={14} color={view === "list" ? "white" : "#64748b"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setView("grid")}
                  className={`px-3 py-1.5 rounded-lg ${view === "grid" ? 'bg-slate-800 shadow-sm' : ''}`}
                >
                  <MaterialIcons name="grid-view" size={14} color={view === "grid" ? "white" : "#64748b"} />
                </TouchableOpacity>
             </View>
          </View>
        </View>

        {/* PRODUCT LISTING */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text className="text-gray-500 text-[10px] font-black uppercase mt-4 tracking-widest">Accessing Secure Database...</Text>
          </View>
        ) : paginatedProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center p-10">
            <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-4 border border-white/5 border-dashed">
                <MaterialIcons name="inventory" size={32} color="#1e293b" />
            </View>
            <Text className="text-white text-md font-bold mb-1">No Products Found</Text>
            <Text className="text-gray-500 text-xs text-center">Try adjusting your filters or search terms to find what you're looking for.</Text>
          </View>
        ) : (
          <FlatList
            data={paginatedProducts}
            keyExtractor={(item) => (item.docId || item.id || Math.random()).toString()}
            renderItem={renderProductItem}
            numColumns={view === "grid" ? 2 : 1}
            key={view === "grid" ? 'g' : 'l'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
            ListFooterComponent={
              totalPages > 1 ? (
                <View className="flex-row items-center justify-center mt-6 gap-2">
                  <TouchableOpacity 
                    disabled={page === 1}
                    onPress={() => setPage(p => p - 1)}
                    className={`w-10 h-10 rounded-2xl items-center justify-center border border-white/5 ${page === 1 ? 'bg-slate-950' : 'bg-slate-900 shadow-sm'}`}
                  >
                    <Ionicons name="chevron-back" size={20} color={page === 1 ? "#1e293b" : "white"} />
                  </TouchableOpacity>
                  
                  <View className="bg-slate-900 px-4 py-2 rounded-2xl border border-white/5 shadow-sm">
                    <Text className="text-white text-xs font-black">
                      PAGE {page} <Text className="text-gray-600">/ {totalPages}</Text>
                    </Text>
                  </View>

                  <TouchableOpacity 
                    disabled={page === totalPages}
                    onPress={() => setPage(p => p + 1)}
                    className={`w-10 h-10 rounded-2xl items-center justify-center border border-white/5 ${page === totalPages ? 'bg-slate-950' : 'bg-slate-900 shadow-sm'}`}
                  >
                    <Ionicons name="chevron-forward" size={20} color={page === totalPages ? "#1e293b" : "white"} />
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default AllProducts;
