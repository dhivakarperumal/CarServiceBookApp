import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const AddStock = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [addQty, setAddQty] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [variantPickerVisible, setVariantPickerVisible] = useState(false);

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data || []);
    } catch {
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = products.find(
    (p) => String(p.docId || p.id) === String(selectedProductId),
  );
  const selectedVariant =
    selectedVariantIndex !== null
      ? selectedProduct?.variants?.[selectedVariantIndex]
      : null;
  const currentStock = Number(selectedVariant?.stock || 0);
  const newStock = currentStock + Number(addQty || 0);

  /* UPDATE STOCK */
  const handleUpdateStock = async () => {
    if (!selectedProductId || selectedVariantIndex === null) {
      Alert.alert("Validation", "Please select a product and a variant");
      return;
    }
    if (!addQty || Number(addQty) <= 0) {
      Alert.alert(
        "Validation",
        "Please enter a valid quantity greater than zero",
      );
      return;
    }

    setSubmitting(true);
    try {
      const updatedVariants = selectedProduct.variants.map(
        (v: any, i: number) => {
          if (i === selectedVariantIndex) {
            return { ...v, stock: Number(v.stock || 0) + Number(addQty) };
          }
          return v;
        },
      );

      const totalStock = updatedVariants.reduce(
        (sum: number, v: any) => sum + Number(v.stock || 0),
        0,
      );

      await apiService.updateProductStock(
        selectedProduct.docId || selectedProduct.id,
        {
          variants: updatedVariants,
          totalStock,
        },
      );

      Alert.alert("Success", "Stock added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Stock update failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Inbound Inventory",
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
              className="ml-2 w-8 h-8 items-center justify-center rounded-xl bg-card-light border border-slate-700"
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
            Stock Management
          </Text>
          <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
            Add Inventory
          </Text>
        </View>

        <View className="bg-card border border-slate-700 rounded-3xl p-6 shadow-sm">
          {/* PRODUCT SELECTION */}
          <View className="mb-6">
            <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-3">
              Select Product
            </Text>
            <TouchableOpacity
              onPress={() => setProductPickerVisible(true)}
              className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 flex-row justify-between items-center"
            >
              <Text
                className={`${selectedProduct ? "text-white" : "text-text-secondary"} font-bold text-sm`}
              >
                {selectedProduct ? selectedProduct.name : "Choose a product..."}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* VARIANT SELECTION (ONLY IF PRODUCT SELECTED) */}
          {selectedProduct && (
            <View className="mb-6">
              <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-3">
                Select Variant
              </Text>
              <TouchableOpacity
                onPress={() => setVariantPickerVisible(true)}
                className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text
                  className={`${selectedVariant ? "text-white" : "text-text-secondary"} font-bold text-xs`}
                >
                  {selectedVariant
                    ? `${selectedVariant.position} | ${selectedVariant.material}`
                    : "Select a variant..."}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* STOCK DETAILS & QUANTITY (ONLY IF VARIANT SELECTED) */}
          {selectedVariant && (
            <View className="mt-6 pt-6 border-t border-slate-700">
              <View className="flex-row justify-between bg-card-light p-4 rounded-2xl border border-slate-700 mb-6">
                <View className="items-center">
                  <Text className="text-text-secondary text-[8px] font-black uppercase mb-1">
                    Current
                  </Text>
                  <Text className="text-white font-black text-xl">
                    {currentStock}
                  </Text>
                </View>
                <View className="w-px bg-slate-700 h-full" />
                <View className="items-center">
                  <Text className="text-primary text-[8px] font-black uppercase mb-1">
                    After Add
                  </Text>
                  <Text className="text-primary font-black text-xl">
                    {newStock}
                  </Text>
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-3">
                  Quantity to Add
                </Text>
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={addQty}
                  onChangeText={setAddQty}
                  className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-sm shadow-inner"
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateStock}
                disabled={submitting}
                className={`${submitting ? "opacity-50" : ""} bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/20`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-widest">
                    Update Stock →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View className="h-10" />
      </ScrollView>

      {/* PRODUCT PICKER MODAL */}
      <Modal visible={productPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80">
          <View className="mt-20 flex-1 bg-background rounded-t-3xl border-t border-slate-700 p-4">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-white font-black text-lg uppercase tracking-tighter">
                Select Product
              </Text>
              <TouchableOpacity onPress={() => setProductPickerVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              keyExtractor={(item) => (item.docId || item.id).toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProductId(item.docId || item.id);
                    setSelectedVariantIndex(null);
                    setAddQty("");
                    setProductPickerVisible(false);
                  }}
                  className="bg-card border border-slate-700 rounded-2xl p-4 mb-3 flex-row items-center gap-3"
                >
                  <Image
                    source={{
                      uri: item.thumbnail || "https://via.placeholder.com/150",
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-800"
                  />
                  <View className="flex-1">
                    <Text
                      className="text-white font-black text-xs uppercase tracking-tighter"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                      Stock: {item.totalStock || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* VARIANT PICKER MODAL */}
      <Modal visible={variantPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80">
          <View className="mt-40 flex-1 bg-background rounded-t-3xl border-t border-slate-700 p-4">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-white font-black text-lg uppercase tracking-tighter">
                Select Variant
              </Text>
              <TouchableOpacity onPress={() => setVariantPickerVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
            {selectedProduct?.variants?.map((v: any, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setSelectedVariantIndex(i);
                  setVariantPickerVisible(false);
                }}
                className="bg-card border border-slate-700 rounded-2xl p-4 mb-3 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="text-white font-black text-xs uppercase tracking-tighter">
                    {v.position} | {v.material}
                  </Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                    SKU: {v.sku}
                  </Text>
                </View>
                <Text className="text-primary font-black text-xs ml-2">
                  {Number(v.stock || 0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddStock;
