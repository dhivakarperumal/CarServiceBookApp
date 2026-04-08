import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal,
  FlatList,
  Image
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

const AddStock = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
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

  useEffect(() => { fetchProducts(); }, []);

  const selectedProduct = products.find((p) => String(p.docId || p.id) === String(selectedProductId));
  const selectedVariant = selectedVariantIndex !== null ? selectedProduct?.variants?.[selectedVariantIndex] : null;
  const currentStock = Number(selectedVariant?.stock || 0);
  const newStock = currentStock + Number(addQty || 0);

  /* UPDATE STOCK */
  const handleUpdateStock = async () => {
    if (!selectedProductId || selectedVariantIndex === null) {
      Alert.alert("Validation", "Please select a product and a variant");
      return;
    }
    if (!addQty || Number(addQty) <= 0) {
      Alert.alert("Validation", "Please enter a valid quantity greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const updatedVariants = selectedProduct.variants.map((v: any, i: number) => {
        if (i === selectedVariantIndex) {
          return { ...v, stock: Number(v.stock || 0) + Number(addQty) };
        }
        return v;
      });

      const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);

      await apiService.updateProductStock(selectedProduct.docId || selectedProduct.id, {
        variants: updatedVariants,
        totalStock,
      });

      Alert.alert("Success", "Stock added successfully", [
        { text: "OK", onPress: () => router.back() }
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
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Inbound Inventory",
          headerTitleStyle: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2 w-8 h-8 items-center justify-center">
               <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="mb-10">
           <Text className="text-white text-3xl font-black tracking-tighter uppercase mb-2">Restock Catalog</Text>
           <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px]">Logistics Inbound Management</Text>
        </View>

        <View className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-6">
           
           {/* PRODUCT SELECTION */}
           <View>
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Secure Product Lookup</Text>
              <TouchableOpacity 
                onPress={() => setProductPickerVisible(true)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center"
              >
                 <Text className={`${selectedProduct ? 'text-white' : 'text-slate-600'} font-bold text-sm`}>
                    {selectedProduct ? selectedProduct.name : "Select Target Product..."}
                 </Text>
                 <Ionicons name="chevron-down" size={16} color="#475569" />
              </TouchableOpacity>
           </View>

           {/* VARIANT SELECTION (ONLY IF PRODUCT SELECTED) */}
           {selectedProduct && (
             <View>
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Variant Identification</Text>
                <TouchableOpacity 
                  onPress={() => setVariantPickerVisible(true)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center"
                >
                   <Text className={`${selectedVariant ? 'text-white' : 'text-slate-600'} font-bold text-sm`}>
                      {selectedVariant ? `${selectedVariant.position} | ${selectedVariant.material} | SKU: ${selectedVariant.sku}` : "Identify Component Variant..."}
                   </Text>
                   <Ionicons name="chevron-down" size={16} color={COLORS.slate400} />
                </TouchableOpacity>
             </View>
           )}

           {/* STOCK DETAILS & QUANTITY (ONLY IF VARIANT SELECTED) */}
           {selectedVariant && (
             <View className="mt-4 pt-6 border-t border-slate-800 space-y-6">
                <View className="flex-row justify-between bg-slate-950 p-6 rounded-2xl border border-slate-800">
                   <View className="items-center">
                      <Text className="text-gray-600 text-[9px] font-black uppercase mb-1">Current Stock</Text>
                      <Text className="text-white font-black text-2xl">{currentStock}</Text>
                   </View>
                   <View className="w-px bg-slate-800 h-full mx-4" />
                   <View className="items-center">
                      <Text className="text-sky-500 text-[9px] font-black uppercase mb-1">New Pipeline</Text>
                      <Text className="text-sky-400 font-black text-2xl">{newStock}</Text>
                   </View>
                </View>

                <View>
                   <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Inbound Quantity</Text>
                   <TextInput
                      placeholder="e.g. 150"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      value={addQty}
                      onChangeText={setAddQty}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-lg shadow-inner"
                   />
                </View>

                <TouchableOpacity 
                   onPress={handleUpdateStock}
                   disabled={submitting}
                   className={`${submitting ? 'opacity-50' : ''} bg-sky-500 py-6 rounded-3xl items-center shadow-lg shadow-sky-500/20 active:scale-95 transition-all`}
                >
                   {submitting ? <ActivityIndicator color={COLORS.white} /> : (
                     <Text className="text-white font-black text-sm uppercase tracking-widest">Commit Inbound Shipment →</Text>
                   )}
                </TouchableOpacity>
             </View>
           )}
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* PRODUCT PICKER MODAL */}
      <Modal visible={productPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-20 flex-1 bg-slate-900 rounded-t-[40px] border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8 px-2">
                  <Text className="text-white font-black text-xl uppercase tracking-tighter">Inventory Lookup</Text>
                  <TouchableOpacity onPress={() => setProductPickerVisible(false)}>
                     <Ionicons name="close-circle" size={32} color="#1e293b" />
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
                      className="bg-slate-950 border border-slate-800 rounded-3xl p-5 mb-4 flex-row items-center gap-4"
                   >
                      <Image source={{ uri: item.thumbnail || "https://via.placeholder.com/150" }} className="w-12 h-12 rounded-2xl bg-slate-800" />
                      <View>
                        <Text className="text-white font-black text-xs uppercase tracking-tighter">{item.name}</Text>
                        <Text className="text-slate-500 text-[8px] font-black uppercase mt-1">Current Stock: {item.totalStock || 0}</Text>
                      </View>
                   </TouchableOpacity>
                 )}
                 showsVerticalScrollIndicator={false}
               />
            </View>
         </View>
      </Modal>

      {/* VARIANT PICKER MODAL */}
      <Modal visible={variantPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-40 flex-1 bg-slate-900 rounded-t-[40px] border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8 px-2">
                  <Text className="text-white font-black text-xl uppercase tracking-tighter">Variant Specifications</Text>
                  <TouchableOpacity onPress={() => setVariantPickerVisible(false)}>
                     <Ionicons name="close-circle" size={32} color="#1e293b" />
                  </TouchableOpacity>
               </View>
               {selectedProduct?.variants?.map((v: any, i: number) => (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => {
                      setSelectedVariantIndex(i);
                      setVariantPickerVisible(false);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-3xl p-5 mb-4 flex-row justify-between items-center"
                  >
                     <View>
                        <Text className="text-white font-black text-xs uppercase tracking-tighter">{v.position} | {v.material}</Text>
                        <Text className="text-slate-500 text-[8px] font-black uppercase mt-1">SKU: {v.sku}</Text>
                     </View>
                     <Text className="text-sky-500 font-black text-xs">Stock: {v.stock}</Text>
                  </TouchableOpacity>
               ))}
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddStock;
