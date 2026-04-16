import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const { width } = Dimensions.get("window");

const StockDetails = () => {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  /* SEARCH FILTER */
  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  /* HANDLE STOCK INPUT */
  const handleStockChange = (
    productId: string,
    index: number,
    value: string,
  ) => {
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

      const totalStock = updatedVariants.reduce(
        (sum: number, v: any) => sum + Number(v.stock || 0),
        0,
      );

      await apiService.updateProductStock(product.docId || product.id, {
        variants: updatedVariants,
        totalStock,
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
        <View
          key={vi}
          className="bg-card p-4 rounded-2xl border border-slate-700 mb-2"
        >
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-white font-black text-[12px] uppercase tracking-tighter">
                {v.position || "Standard"} | {v.material || "N/A"}
              </Text>
              <Text className="text-text-secondary text-[12px] mt-1 font-black uppercase">
                SKU: {v.sku || "N/A"}
              </Text>
            </View>
            <View className="bg-card-light px-3 py-1.5 rounded-xl border border-slate-700">
              <Text className="text-text-secondary text-[9px] font-black uppercase">
                Current: <Text className="text-white">{v.stock || 0}</Text>
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <TextInput
                placeholder="Add Quantity"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={stockInputs[key] || ""}
                onChangeText={(val) =>
                  handleStockChange(product.docId || product.id, vi, val)
                }
                className="bg-card-light border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-xs"
              />
            </View>
            <View className="px-4 items-center">
              <Text className="text-primary font-black text-sm">NEW</Text>
              <Text className="text-white font-black text-sm">{newTotal}</Text>
            </View>
          </View>
        </View>
      );
    });
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const isExpanded = expanded === (item.docId || item.id);
    const imageUrl =
      item.thumbnail ||
      (item.images && item.images.length > 0 ? item.images[0] : null);
    const lowStock = (item.totalStock || 0) < 5;

    return (
      <View className="bg-card border border-slate-700 rounded-3xl mb-4 overflow-hidden shadow-sm">
        <TouchableOpacity
          onPress={() => setExpanded(isExpanded ? null : item.docId || item.id)}
          className="p-4 flex-row items-center gap-4"
        >
          <Image
            source={{
              uri: imageUrl || "https://via.placeholder.com/150?text=Part",
            }}
            className="w-12 h-12 rounded-2xl bg-slate-800"
          />
          <View className="flex-1">
            <Text
              className="text-white font-black text-sm uppercase tracking-tighter"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View className="flex-row items-center gap-4 mt-1">
              <Text className="text-text-secondary text-[12px] font-black uppercase">
                Variants: {item.variants?.length || 0}
              </Text>
              <View className="w-1 h-1 rounded-full bg-text-primary" />
              <Text
                className={`${lowStock ? "text-error" : "text-success"} text-[12px] font-black uppercase`}
              >
                Stock: {item.totalStock || 0}
              </Text>
            </View>
          </View>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? "bg-primary" : "bg-card border border-slate-700"}`}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "settings-sharp"}
              size={14}
              color="white"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className="bg-card-light/70 p-4 border-t border-slate-700">
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-4 px-1">
              Inventory Management
            </Text>
            {renderVariantRows(item)}
            <TouchableOpacity
              onPress={() => updateStock(item)}
              className="bg-primary py-4 rounded-2xl mt-4 items-center shadow-lg shadow-primary/20"
            >
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Update Warehouse Stock →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View className="px-5 pt-8 pb-1 ">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-2xl font-black uppercase tracking-tight">Stock</Text>
             
            </View>
          </View>
          <View className="items-end">
            <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Text className="text-primary text-[10px] font-black uppercase">{filteredProducts.length} Items</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="p-4 flex-1">
        {/* TOP CONTROLS */}
        <View className="mb-6 gap-4">
          {/* SEARCH */}
          <View className="flex-row items-center bg-card border border-slate-700 rounded-2xl px-4 py-1 h-14 shadow-inner">
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              placeholder="Find components in warehouse..."
              placeholderTextColor={COLORS.textSecondary}
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-white font-bold text-xs"
            />
          </View>

          {/* TITLE */}
          <View>
            <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
              Inventory Oversight
            </Text>
            <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
              Stock Portfolio
            </Text>
          </View>
        </View>

        {/* LISTING */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-text-secondary text-[10px] font-black uppercase mt-4 tracking-widest">
              Loading Logistics Data...
            </Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center opacity-30">
            <MaterialIcons name="inventory" size={64} color={COLORS.slate700} />
            <Text className="text-white font-black text-xs uppercase mt-6">
              Warehouse Empty
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) =>
              (item.docId || item.id || Math.random()).toString()
            }
            renderItem={renderProductItem}
            numColumns={1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </View>

      {/* FAB - ADD STOCK */}
      <TouchableOpacity
        onPress={() => router.push("/(adminPages)/add-stock" as any)}
        className="absolute bottom-10 right-8 w-16 h-16 bg-primary rounded-3xl items-center justify-center shadow-2xl shadow-primary/30"
        style={{ elevation: 15 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default StockDetails;
