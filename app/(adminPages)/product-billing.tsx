import React, { useEffect, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const ProductBilling = () => {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* SELECTION STATE */
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [qty, setQty] = useState("1");
  const [cart, setCart] = useState<any[]>([]);

  /* ORDER DATA */
  const [orderType, setOrderType] = useState<"shop" | "online">("shop");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [shipping, setShipping] = useState({
    name: "", phone: "", address: "", city: "", pincode: "",
  });

  /* UI MODALS */
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [variantPickerVisible, setVariantPickerVisible] = useState(false);
  const [orderTypePickerVisible, setOrderTypePickerVisible] = useState(false);
  const [billingSuccessVisible, setBillingSuccessVisible] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);

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
  const price = selectedProduct ? (selectedProduct.offerPrice || selectedProduct.mrp || 0) : 0;

  /* CART ACTIONS */
  const addToCart = () => {
    if (!selectedProductId || selectedVariantIndex === null) {
      Alert.alert("Validation", "Select product & variant");
      return;
    }
    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Validation", "Enter valid quantity");
      return;
    }
    if (quantity > (selectedVariant?.stock || 0)) {
      Alert.alert("Stock Alert", "Not enough stock available");
      return;
    }

    const item = {
      productId: selectedProduct.docId || selectedProduct.id,
      name: selectedProduct.name,
      variant: `${selectedVariant.position} | ${selectedVariant.material}`,
      variantIndex: selectedVariantIndex,
      sku: selectedVariant.sku,
      price,
      qty: quantity,
      total: price * quantity,
    };

    setCart((prev) => [...prev, item]);
    setSelectedProductId("");
    setSelectedVariantIndex(null);
    setQty("1");
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  /* SAVE BILL */
  const handleSaveBill = async () => {
    const isOnline = orderType === "online";
    if (isOnline) {
      if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode) {
        Alert.alert("Required Fields", "Please complete all shipping details");
        return;
      }
    } else {
      if (!customer.name || !customer.phone) {
        Alert.alert("Required Fields", "Please enter customer name and phone");
        return;
      }
    }

    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Please add items to create a bill");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const orderId = `ORD${now.getTime().toString().slice(-6)}`;

      /* 1. Update Stock for each item */
      for (const item of cart) {
        const product = products.find((p) => String(p.docId || p.id) === String(item.productId));
        const updatedVariants = product.variants.map((v: any, i: number) => {
          if (i === item.variantIndex) {
            return { ...v, stock: Number(v.stock) - item.qty };
          }
          return v;
        });
        const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
        await apiService.updateProductStock(product.docId || product.id, { variants: updatedVariants, totalStock });
      }

      /* 2. Create Order Manifest with redundant data for high-fidelity persistence */
      const orderData = {
        orderId,
        // Flat keys for backend flexibility
        customerName: isOnline ? shipping.name : customer.name,
        customerPhone: isOnline ? shipping.phone : customer.phone,
        customerMobile: isOnline ? shipping.phone : customer.phone,
        mobile: isOnline ? shipping.phone : customer.phone,
        phone: isOnline ? shipping.phone : customer.phone,
        
        // Structured Logistics data
        customer: isOnline ? shipping : customer,
        shipping: isOnline ? shipping : null,
        
        orderType,
        items: cart,
        total: grandTotal,
        paymentMethod: isOnline ? "ONLINE" : "CASH",
        paymentStatus: isOnline ? "Paid" : "Pending",
        status: "OrderPlaced",
        createdAt: now.toISOString()
      };

      // Assuming we can POST to /orders based on the snippet
      // I'll use a generic API call here as it's not and-service method yet
      await apiService.api.post("/orders", orderData);

      setLastOrderDetails(orderData);
      setBillingSuccessVisible(true);
      
      // RESET
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setShipping({ name: "", phone: "", address: "", city: "", pincode: "" });
      setOrderType("shop");
      fetchProducts();
    } catch (err) {
      console.error(err);
      Alert.alert("Submission Failed", "There was an error saving the order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen options={{ 
        title: "Storefront Billing",
        headerShown: true,
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 }
      }} />

      <View className="flex-1">
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View className="mb-8">
             <Text className="text-white text-3xl font-black tracking-tighter uppercase">Point of Sale</Text>
             <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px]">ShopFloor & Logistics Invoice System</Text>
          </View>

          {/* ORDER TYPE SELECTOR - CONVERTED TO SELECT */}
          <TouchableOpacity 
            onPress={() => setOrderTypePickerVisible(true)}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 flex-row justify-between items-center shadow-xl"
          >
             <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-slate-950 rounded-2xl items-center justify-center border border-slate-800">
                   <Ionicons 
                     name={orderType === "shop" ? "storefront-outline" : "globe-outline"} 
                     size={18} 
                     color="#0ea5e9" 
                   />
                </View>
                <View>
                   <Text className="text-white font-black text-xs uppercase tracking-tighter">
                      {orderType === "shop" ? "Walk-in (Shop Order)" : "Digital (Online Order)"}
                   </Text>
                   <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-0.5">Order Type Logic</Text>
                </View>
             </View>
             <Ionicons name="chevron-down" size={16} color="#1e293b" />
          </TouchableOpacity>

          {/* CUSTOMER / SHIPPING DETAILS */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-6">
             <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-2">Acquisition Logistics</Text>
             
             {orderType === "shop" ? (
               <View className="gap-4">
                  <TextInput 
                     placeholder="Customer Name" 
                     placeholderTextColor="#334155"
                     value={customer.name}
                     onChangeText={(val) => setCustomer({...customer, name: val})}
                     className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                  />
                  <TextInput 
                     placeholder="Phone Number" 
                     placeholderTextColor="#334155"
                     keyboardType="numeric"
                     value={customer.phone}
                     onChangeText={(val) => setCustomer({...customer, phone: val})}
                     className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                  />
               </View>
             ) : (
               <View className="gap-4">
                  <View className="flex-row gap-4">
                     <TextInput 
                        placeholder="Receiver Name" 
                        placeholderTextColor="#334155"
                        value={shipping.name}
                        onChangeText={(val) => setShipping({...shipping, name: val})}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                     />
                     <TextInput 
                        placeholder="Phone" 
                        placeholderTextColor="#334155"
                        keyboardType="numeric"
                        value={shipping.phone}
                        onChangeText={(val) => setShipping({...shipping, phone: val})}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                     />
                  </View>
                  <TextInput 
                     placeholder="Delivery Address" 
                     placeholderTextColor="#334155"
                     value={shipping.address}
                     multiline
                     onChangeText={(val) => setShipping({...shipping, address: val})}
                     className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                  />
                  <View className="flex-row gap-4">
                     <TextInput 
                        placeholder="City" 
                        placeholderTextColor="#334155"
                        value={shipping.city}
                        onChangeText={(val) => setShipping({...shipping, city: val})}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                     />
                     <TextInput 
                        placeholder="Pincode" 
                        placeholderTextColor="#334155"
                        keyboardType="numeric"
                        value={shipping.pincode}
                        onChangeText={(val) => setShipping({...shipping, pincode: val})}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                     />
                  </View>
               </View>
             )}
          </View>

          {/* PRODUCT ADDITION SECTION */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
             <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-2">Manifest Entry</Text>
             
             <TouchableOpacity 
               onPress={() => setProductPickerVisible(true)}
               className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center mb-4"
             >
                <Text className={`${selectedProduct ? 'text-white' : 'text-slate-700'} font-bold text-sm`}>
                   {selectedProduct ? selectedProduct.name : "Select Product manifest..."}
                </Text>
                <Ionicons name="search" size={16} color="#475569" />
             </TouchableOpacity>

             {selectedProduct && (
               <TouchableOpacity 
                  onPress={() => setVariantPickerVisible(true)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center mb-4"
               >
                  <Text className={`${selectedVariant ? 'text-white' : 'text-slate-700'} font-bold text-sm`}>
                     {selectedVariant ? `${selectedVariant.position} | ${selectedVariant.material} (Stock: ${selectedVariant.stock})` : "Identify Variant specifications..."}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#475569" />
               </TouchableOpacity>
             )}

             <View className="flex-row gap-4">
                <View className="flex-1">
                   <TextInput 
                      placeholder="Qty" 
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      value={qty}
                      onChangeText={setQty}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-center"
                   />
                </View>
                <TouchableOpacity 
                  onPress={addToCart}
                  className="flex-[2] bg-sky-500 rounded-2xl items-center justify-center flex-row gap-2"
                >
                   <Ionicons name="add-circle" size={18} color="white" />
                   <Text className="text-white font-black text-[10px] uppercase tracking-widest">Append to Cart</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* CART LISTING */}
          <View className="mb-10">
             <Text className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-4 px-2">Order Manifest</Text>
             {cart.length === 0 ? (
               <View className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-10 items-center">
                  <Ionicons name="cart-outline" size={32} color="#1e293b" />
                  <Text className="text-slate-700 font-black text-[9px] uppercase mt-4">Transaction is currently empty</Text>
               </View>
             ) : (
               cart.map((item, index) => (
                 <View key={index} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-3 flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-xl bg-slate-950 items-center justify-center border border-slate-800">
                       <Text className="text-sky-500 font-black text-xs">{item.qty}</Text>
                    </View>
                    <View className="flex-1">
                       <Text className="text-white font-black text-xs uppercase" numberOfLines={1}>{item.name}</Text>
                       <Text className="text-gray-500 text-[8px] font-black uppercase mt-1">{item.variant}</Text>
                    </View>
                    <View className="items-end">
                       <Text className="text-white font-black text-xs">₹{item.total}</Text>
                       <TouchableOpacity onPress={() => removeItem(index)} className="mt-1">
                          <Text className="text-red-500/50 font-black text-[8px] uppercase">Discard</Text>
                       </TouchableOpacity>
                    </View>
                 </View>
               ))
             )}
          </View>
        </ScrollView>
      </View>

      {/* FOOTER ACTION BAR */}
      <View className="p-6 bg-slate-950 border-t border-slate-900">
         <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[2px]">Grand Total</Text>
            <Text className="text-white text-2xl font-black tracking-tighter">₹ {grandTotal}</Text>
         </View>
         <TouchableOpacity 
           onPress={handleSaveBill}
           disabled={submitting}
           className={`bg-white py-5 rounded-3xl items-center flex-row justify-center gap-3 shadow-2xl ${submitting ? 'opacity-50' : ''}`}
         >
            {submitting ? <ActivityIndicator color="#020617" /> : (
              <>
                <Ionicons name="print-outline" size={20} color="#020617" />
                <Text className="text-slate-950 font-black text-xs uppercase tracking-widest">Execute Order & Finalize Bill</Text>
              </>
            )}
         </TouchableOpacity>
      </View>

      {/* PRODUCT PICKER */}
      <Modal visible={productPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-20 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-white font-black text-xl uppercase">Manifest Lookup</Text>
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
                        setProductPickerVisible(false);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-3xl p-5 mb-4 flex-row items-center gap-4"
                   >
                      <Image source={{ uri: item.thumbnail || "https://via.placeholder.com/150" }} className="w-12 h-12 rounded-2xl bg-slate-800" />
                      <View>
                        <Text className="text-white font-black text-xs uppercase">{item.name}</Text>
                        <Text className="text-slate-600 text-[8px] font-black uppercase mt-1">₹ {item.offerPrice || item.mrp}</Text>
                      </View>
                   </TouchableOpacity>
                 )}
               />
            </View>
         </View>
      </Modal>

      {/* VARIANT PICKER */}
      <Modal visible={variantPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-40 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-white font-black text-xl uppercase">Specifications</Text>
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
                        <Text className="text-white font-black text-xs uppercase">{v.position} | {v.material}</Text>
                        <Text className="text-slate-500 text-[8px] font-black uppercase mt-1">SKU: {v.sku}</Text>
                     </View>
                     <View className="items-end">
                        <Text className="text-sky-500 font-black text-xs">{v.stock}</Text>
                        <Text className="text-gray-600 text-[8px] font-black uppercase">Units Avail</Text>
                     </View>
                  </TouchableOpacity>
               ))}
            </View>
         </View>
      </Modal>

      {/* ORDER TYPE PICKER */}
      <Modal visible={orderTypePickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-60 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 p-8">
               <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-white font-black text-xl uppercase">Order Manifest Logic</Text>
                  <TouchableOpacity onPress={() => setOrderTypePickerVisible(false)}>
                     <Ionicons name="close-circle" size={32} color="#1e293b" />
                  </TouchableOpacity>
               </View>
               
               <TouchableOpacity 
                 onPress={() => { setOrderType("shop"); setOrderTypePickerVisible(false); }}
                 className={`flex-row items-center gap-4 p-5 rounded-3xl mb-4 border ${orderType === "shop" ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-950 border-slate-800'}`}
               >
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${orderType === "shop" ? 'bg-sky-500' : 'bg-slate-900'}`}>
                     <Ionicons name="storefront-outline" size={24} color={orderType === "shop" ? "white" : "#475569"} />
                  </View>
                  <View>
                     <Text className="text-white font-black text-sm uppercase">Shop Order (Walk-in)</Text>
                     <Text className="text-slate-500 text-[8px] font-black uppercase">Standard storefront transaction</Text>
                  </View>
               </TouchableOpacity>

               <TouchableOpacity 
                 onPress={() => { setOrderType("online"); setOrderTypePickerVisible(false); }}
                 className={`flex-row items-center gap-4 p-5 rounded-3xl border ${orderType === "online" ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-950 border-slate-800'}`}
               >
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${orderType === "online" ? 'bg-sky-500' : 'bg-slate-900'}`}>
                     <Ionicons name="globe-outline" size={24} color={orderType === "online" ? "white" : "#475569"} />
                  </View>
                  <View>
                     <Text className="text-white font-black text-sm uppercase">Digital Order (Online)</Text>
                     <Text className="text-slate-500 text-[8px] font-black uppercase">Home delivery logistics required</Text>
                  </View>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* SUCCESS / INVOICE MODAL */}
      <Modal visible={billingSuccessVisible} transparent animationType="fade">
         <View className="flex-1 bg-black/90 items-center justify-center p-6">
            <View className="bg-white w-full rounded-3xl p-8">
               <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-4">
                     <Ionicons name="checkmark-done" size={32} color="#10b981" />
                  </View>
                  <Text className="text-slate-950 font-black text-xl uppercase tracking-tighter">Order Executed</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Transaction Success</Text>
               </View>

               <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6">
                  <View className="flex-row justify-between mb-3 border-b border-slate-200 pb-2">
                     <Text className="text-slate-400 text-[9px] font-black uppercase">Order ID</Text>
                     <Text className="text-slate-900 font-black text-xs">{lastOrderDetails?.orderId}</Text>
                  </View>
                  <View className="flex-row justify-between mb-3 border-b border-slate-200 pb-2">
                     <Text className="text-slate-400 text-[9px] font-black uppercase">Total Amount</Text>
                     <Text className="text-slate-900 font-black text-xs">₹ {lastOrderDetails?.total}</Text>
                  </View>
                  <View className="flex-row justify-between">
                     <Text className="text-slate-400 text-[9px] font-black uppercase">Customer</Text>
                     <Text className="text-slate-900 font-black text-xs" numberOfLines={1}>{lastOrderDetails?.customer?.name}</Text>
                  </View>
               </View>

               <TouchableOpacity 
                 onPress={() => setBillingSuccessVisible(false)}
                 className="bg-slate-950 py-5 rounded-3xl items-center"
               >
                  <Text className="text-white font-black text-xs uppercase tracking-widest">Acknowledge & Close</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ProductBilling;
