import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

const { width } = Dimensions.get("window");
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
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert(
        "Error",
        "Failed to load products. Please check your connection.",
      );
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
          },
        },
      ],
    );
  };

  /* EDIT */
  const handleEdit = (product: any) => {
    router.push({
      pathname: "/(adminPages)/add-products",
      params: { editData: JSON.stringify(product) },
    });
  };

  /* TOGGLE ACTIVE */
  const toggleStatus = async (product: any) => {
    try {
      await api.put(`/products/status/${product.docId || product.id}`, {
        isActive: !product.isActive,
      });
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
    page * ITEMS_PER_PAGE,
  );

  const renderProductItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl =
      item.images && item.images.length > 0
        ? item.images[0]
        : item.thumbnail?.startsWith("[")
          ? JSON.parse(item.thumbnail)[0]
          : item.thumbnail;

    if (view === "list") {
      return (
        <View className="relative bg-slate-950 border border-slate-800 rounded-3xl p-4 mb-4 flex-row items-center overflow-hidden shadow-2xl">
  
  {/* Glow effect */}
  <View className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-sky-500/10" />

  {/* Glass overlay */}
  <View className="absolute inset-0 bg-white/[0.02]" />
          <View className="relative">
            <Image
              source={{
                uri:
                  imageUrl || "https://via.placeholder.com/150?text=No+Image",
              }}
              className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700"
              resizeMode="cover"
            />
            {item.isFeatured && (
              <View className="absolute -top-1 -left-1 bg-rating w-4 h-4 rounded-full items-center justify-center border border-background">
                <FontAwesome name="star" size={8} color={COLORS.textPrimary} />
              </View>
            )}
          </View>

          <View className="flex-1 ml-4">
            <Text
              className="text-text-primary font-black text-xs tracking-wide"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-primary font-black text-xs">
                ₹ {item.offerPrice || item.mrp}
              </Text>
              {item.offerPrice && item.offerPrice < item.mrp && (
                <Text className="text-text-secondary text-[10px] line-through ml-2">
                  ₹ {item.mrp}
                </Text>
              )}
            </View>
            <View className="flex-row items-center mt-1">
              <Text className="text-text-primary text-[12px] uppercase font-black tracking-tighter">
                Stock: {item.totalStock || 0}
              </Text>
              <View className="w-1 h-1 rounded-full bg-slate-600 mx-2" />
              <Text className="text-rating text-[10px] font-black">
                ⭐ {item.rating || 0}
              </Text>
            </View>
          </View>

          <View className="items-end gap-2">
            <TouchableOpacity
              onPress={() => toggleStatus(item)}
              className={`${item.isActive ? "bg-success/20" : "bg-error/20"} px-2 py-1 rounded-full border ${item.isActive ? "border-success" : "border-error"}`}
            >
              <Text
                className={`${item.isActive ? "text-success" : "text-error"} text-[8px] font-black uppercase`}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                className="w-8 h-8 rounded-full bg-slate-900 items-center justify-center border border-slate-700"
              >
                <MaterialIcons name="edit" size={14} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.docId || item.id)}
                className="w-8 h-8 rounded-full bg-card items-center justify-center border border-slate-600"
              >
                <MaterialIcons name="delete" size={14} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        style={{ width: COLUMN_WIDTH }}
        className="bg-card border border-slate-700 rounded-3xl p-3 mb-4 shadow-sm m-1"
      >
        <View className="relative">
          <Image
            source={{
              uri:
                imageUrl ||
                "https://via.placeholder.com/400x300?text=Product+Image",
            }}
            className="w-full h-32 rounded-2xl bg-slate-800"
            resizeMode="cover"
          />
          <View className="absolute top-2 right-2 flex-row gap-1">
            {item.isFeatured && (
              <View className="bg-rating px-2 py-0.5 rounded-full shadow-sm">
                <Text className="text-text-primary bg-blue-800 p-2 text-[8px] font-black uppercase">
                  Featured
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => toggleStatus(item)}
            className={`absolute bottom-2 right-2 px-2 py-1 rounded-full shadow-sm ${item.isActive ? "bg-success" : "bg-slate-700"}`}
          >
            <Text className="text-text-primary text-[8px] font-black uppercase">
              {item.isActive ? "Active" : "Inactive"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-3">
          <Text
            className="text-text-primary font-bold text-sm"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text className="text-primary font-black text-sm mt-1">
            ₹ {item.offerPrice || item.mrp}
          </Text>

          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <MaterialIcons
                name="inventory"
                size={11}
                color={COLORS.textMuted}
              />
              <Text className="text-text-muted text-[12px] font-black ml-1">
                {item.totalStock || 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-rating text-[11px] font-black">
                ⭐ {item.rating || 0}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              className="flex-1 h-8 rounded-xl bg-card items-center justify-center border border-primary"
            >
              <MaterialIcons name="edit" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.docId || item.id)}
              className="flex-1 h-8 rounded-xl bg-card items-center justify-center border border-primary"
            >
              <MaterialIcons name="delete" size={14} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Products Inventory",
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontWeight: "900",
            fontSize: 16,
          },
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-2 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="p-4 flex-1">
        {/* REMOVED PREVIOUS CUSTOM HEADER */}

        {/* SEARCH & FILTERS */}
        <View className="mb-6">
          <View className="flex-row items-center bg-card border border-slate-700 rounded-2xl px-4 py-2 mb-4">
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              placeholder="Search components, parts, products..."
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 ml-3 text-text-primary text-xs py-1"
              value={search}
              onChangeText={(txt) => {
                setSearch(txt);
                setPage(1);
              }}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-2"
          >
            {[
              { id: "all", label: "All Items" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
              { id: "featured", label: "Featured" },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={`mr-2 px-4 py-2 rounded-full border ${filter === f.id ? "bg-primary border-primary" : "bg-card border-slate-700"}`}
              >
                <Text
                  className={`${filter === f.id ? "text-text-primary" : "text-text-secondary"} text-[10px] font-black uppercase tracking-tighter`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row justify-between items-center mt-2 px-1">
            <Text className="text-text-secondary text-[10px] font-black uppercase">
              Showing {filteredProducts.length} Results
            </Text>
            <View className="flex-row bg-card rounded-xl p-1 border border-slate-700">
              <TouchableOpacity
                onPress={() => setView("list")}
                className={`px-3 py-1.5 rounded-lg ${view === "list" ? "bg-slate-700" : ""}`}
              >
                <MaterialIcons
                  name="format-list-bulleted"
                  size={14}
                  color={
                    view === "list" ? COLORS.textPrimary : COLORS.textMuted
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setView("grid")}
                className={`px-3 py-1.5 rounded-lg ${view === "grid" ? "bg-slate-700" : ""}`}
              >
                <MaterialIcons
                  name="grid-view"
                  size={14}
                  color={
                    view === "grid" ? COLORS.textPrimary : COLORS.textMuted
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PRODUCT LISTING */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-text-secondary text-[10px] font-black uppercase mt-4 tracking-widest">
              Accessing Secure Database...
            </Text>
          </View>
        ) : paginatedProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center p-10">
            <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-4 border border-slate-600 border-dashed">
              <MaterialIcons
                name="inventory"
                size={32}
                color={COLORS.slate500}
              />
            </View>
            <Text className="text-text-primary text-md font-bold mb-1">
              No Products Found
            </Text>
            <Text className="text-text-secondary text-xs text-center">
              Try adjusting your filters or search terms to find what you're
              looking for.
            </Text>
          </View>
        ) : (
          <FlatList
            data={paginatedProducts}
            keyExtractor={(item) =>
              (item.docId || item.id || Math.random()).toString()
            }
            renderItem={renderProductItem}
            numColumns={view === "grid" ? 2 : 1}
            key={view === "grid" ? "g" : "l"}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View className="flex-row items-center justify-center mt-6 gap-2">
                  <TouchableOpacity
                    disabled={page === 1}
                    onPress={() => setPage((p) => p - 1)}
                    className={`w-10 h-10 rounded-2xl items-center justify-center border border-slate-600 ${page === 1 ? "bg-background" : "bg-card shadow-sm"}`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={page === 1 ? COLORS.slate600 : COLORS.textPrimary}
                    />
                  </TouchableOpacity>

                  <View className="bg-card px-4 py-2 rounded-2xl border border-slate-600 shadow-sm">
                    <Text className="text-text-primary text-xs font-black">
                      PAGE {page}{" "}
                      <Text className="text-text-secondary">
                        / {totalPages}
                      </Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={page === totalPages}
                    onPress={() => setPage((p) => p + 1)}
                    className={`w-10 h-10 rounded-2xl items-center justify-center border border-slate-600 ${page === totalPages ? "bg-background" : "bg-card shadow-sm"}`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={
                        page === totalPages
                          ? COLORS.slate600
                          : COLORS.textPrimary
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/(adminPages)/add-products")}
        className="absolute bottom-8 right-8 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-2xl shadow-sky-500/50"
        style={{ elevation: 10 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AllProducts;
