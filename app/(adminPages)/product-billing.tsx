import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
   ActivityIndicator,
   Alert,
   Dimensions,
   FlatList,
   Image,
   Modal,
   SafeAreaView,
   ScrollView,
   Text,
   TextInput,
   TouchableOpacity,
   View
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const { width } = Dimensions.get("window");

const ProductBilling = () => {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* SELECTION STATE */
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [qty, setQty] = useState("1");
  const [cart, setCart] = useState<any[]>([]);

  /* ORDER DATA */
  const [orderType, setOrderType] = useState<"shop" | "online">("shop");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
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
  const price = selectedVariant
    ? Number(
        selectedVariant.price ||
          selectedProduct?.offerPrice ||
          selectedProduct?.mrp ||
          0,
      )
    : selectedProduct
      ? Number(selectedProduct.offerPrice || selectedProduct.mrp || 0)
      : 0;

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
      if (
        !shipping.name ||
        !shipping.phone ||
        !shipping.address ||
        !shipping.city ||
        !shipping.pincode
      ) {
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
        const product = products.find(
          (p) => String(p.docId || p.id) === String(item.productId),
        );
        const updatedVariants = product.variants.map((v: any, i: number) => {
          if (i === item.variantIndex) {
            return { ...v, stock: Number(v.stock) - item.qty };
          }
          return v;
        });
        const totalStock = updatedVariants.reduce(
          (sum: number, v: any) => sum + Number(v.stock || 0),
          0,
        );
        await apiService.updateProductStock(product.docId || product.id, {
          variants: updatedVariants,
          totalStock,
        });
      }

      /* 2. Create Order Manifest with redundant data for high-fidelity persistence */
      const orderData = {
        orderId,
        invoiceNo: orderId,
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
        grandTotal: grandTotal, // Include grandTotal for the billings ledger
        car: `${cart.length} Product(s)`, // Use car field for item summary
        paymentMethod: isOnline ? "ONLINE" : "CASH",
        paymentStatus: isOnline ? "Paid" : "Pending",
        status: "OrderPlaced",
        createdAt: now.toISOString(),
      };

      await apiService.createBilling(orderData);

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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Storefront Billing",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        }}
      />

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View className="mb-8">
            <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
              Sales Management
            </Text>
            <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
              Point of Sale
            </Text>
          </View>

          {/* ORDER TYPE SELECTOR - CONVERTED TO SELECT */}
          <TouchableOpacity
            onPress={() => setOrderTypePickerVisible(true)}
            className="bg-card border border-slate-700 rounded-3xl p-4 mb-6 flex-row justify-between items-center shadow-sm"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 bg-card-light rounded-2xl items-center justify-center border border-slate-700">
                <Ionicons
                  name={
                    orderType === "shop"
                      ? "storefront-outline"
                      : "globe-outline"
                  }
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View>
                <Text className="text-white font-black text-xs uppercase tracking-tighter">
                  {orderType === "shop"
                    ? "Walk-in (Shop Order)"
                    : "Digital (Online Order)"}
                </Text>
                <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-0.5">
                  Order Type
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {/* CUSTOMER / SHIPPING DETAILS */}
          <View className="bg-card border border-slate-700 rounded-3xl p-6 shadow-sm mb-6">
            <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-4">
              Acquisition Logistics
            </Text>

            {orderType === "shop" ? (
              <View className="gap-4">
                <TextInput
                  placeholder="Customer Name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={customer.name}
                  onChangeText={(val) =>
                    setCustomer({ ...customer, name: val })
                  }
                  className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={customer.phone}
                  onChangeText={(val) =>
                    setCustomer({ ...customer, phone: val })
                  }
                  className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                />
              </View>
            ) : (
              <View className="gap-4">
                <View className="flex-row gap-4">
                  <TextInput
                    placeholder="Receiver Name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={shipping.name}
                    onChangeText={(val) =>
                      setShipping({ ...shipping, name: val })
                    }
                    className="flex-1 bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                  />
                  <TextInput
                    placeholder="Phone"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={shipping.phone}
                    onChangeText={(val) =>
                      setShipping({ ...shipping, phone: val })
                    }
                    className="flex-1 bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                  />
                </View>
                <TextInput
                  placeholder="Delivery Address"
                  placeholderTextColor={COLORS.textSecondary}
                  value={shipping.address}
                  multiline
                  onChangeText={(val) =>
                    setShipping({ ...shipping, address: val })
                  }
                  className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                />
                <View className="flex-row gap-4">
                  <TextInput
                    placeholder="City"
                    placeholderTextColor={COLORS.textSecondary}
                    value={shipping.city}
                    onChangeText={(val) =>
                      setShipping({ ...shipping, city: val })
                    }
                    className="flex-1 bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                  />
                  <TextInput
                    placeholder="Pincode"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={shipping.pincode}
                    onChangeText={(val) =>
                      setShipping({ ...shipping, pincode: val })
                    }
                    className="flex-1 bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                  />
                </View>
              </View>
            )}
          </View>

          {/* PRODUCT ADDITION SECTION */}
          <View className="bg-card border border-slate-700 rounded-3xl p-6 shadow-sm mb-8">
            <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-4">
              Add Item
            </Text>

            <TouchableOpacity
              onPress={() => setProductPickerVisible(true)}
              className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 flex-row justify-between items-center mb-4"
            >
              <Text
                className={`${selectedProduct ? "text-white" : "text-text-secondary"} font-bold text-sm`}
              >
                {selectedProduct ? selectedProduct.name : "Select Product..."}
              </Text>
              <Ionicons name="search" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {selectedProduct && (
              <TouchableOpacity
                onPress={() => setVariantPickerVisible(true)}
                className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 flex-row justify-between items-center mb-4"
              >
                <Text
                  className={`${selectedVariant ? "text-white" : "text-text-secondary"} font-bold text-xs`}
                >
                  {selectedVariant
                    ? `${selectedVariant.position} | ${selectedVariant.material}`
                    : "Select Variant..."}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}

            <View className="flex-row gap-4">
              <View className="flex-1">
                <TextInput
                  placeholder="Qty"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={qty}
                  onChangeText={setQty}
                  className="bg-card-light border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-center"
                />
              </View>
              <TouchableOpacity
                onPress={addToCart}
                className="flex-[2] bg-primary rounded-2xl items-center justify-center flex-row gap-2"
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                  Add to Cart
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CART LISTING */}
          <View className="mb-10">
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              Order Items
            </Text>
            {cart.length === 0 ? (
              <View className="bg-card/50 border border-slate-700 border-dashed rounded-3xl p-10 items-center">
                <Ionicons
                  name="cart-outline"
                  size={32}
                  color={COLORS.textSecondary}
                />
                <Text className="text-text-secondary font-black text-[9px] uppercase mt-4">
                  Cart is empty
                </Text>
              </View>
            ) : (
              cart.map((item, index) => (
                <View
                  key={index}
                  className="bg-card border border-slate-700 rounded-2xl p-4 mb-3 flex-row items-center gap-4"
                >
                  <View className="w-10 h-10 rounded-xl bg-card-light items-center justify-center border border-slate-700">
                    <Text className="text-primary font-black text-xs">
                      {item.qty}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-black text-xs uppercase"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                      {item.variant}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white font-black text-xs">
                      ₹{item.total}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(index)}
                      className="mt-1"
                    >
                      <Text className="text-error/70 font-black text-[8px] uppercase">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* FOOTER ACTION BAR */}
      <View className="p-6 bg-background border-t border-slate-700">
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
            Grand Total
          </Text>
          <Text className="text-white text-2xl font-black tracking-tighter">
            ₹ {grandTotal}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSaveBill}
          disabled={submitting}
          className={`bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-3 shadow-lg shadow-primary/20 ${submitting ? "opacity-50" : ""}`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="print-outline" size={20} color="white" />
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Create Order
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* PRODUCT PICKER */}
      <Modal visible={productPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80">
          <View className="mt-20 flex-1 bg-background rounded-t-3xl border-t border-slate-700 p-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white font-black text-lg uppercase">
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
                      className="text-white font-black text-xs uppercase"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                      ₹ {item.offerPrice || item.mrp}
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

      {/* VARIANT PICKER */}
      <Modal visible={variantPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80">
          <View className="mt-40 flex-1 bg-background rounded-t-3xl border-t border-slate-700 p-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white font-black text-lg uppercase">
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
                  <Text className="text-white font-black text-xs uppercase">
                    {v.position} | {v.material}
                  </Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                    SKU: {v.sku}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary font-black text-xs">
                    {v.stock}
                  </Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase">
                    Units
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ORDER TYPE PICKER */}
      <Modal visible={orderTypePickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80">
          <View className="mt-60 flex-1 bg-background rounded-t-3xl border-t border-slate-700 p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white font-black text-lg uppercase">
                Select Order Type
              </Text>
              <TouchableOpacity
                onPress={() => setOrderTypePickerVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setOrderType("shop");
                setOrderTypePickerVisible(false);
              }}
              className={`flex-row items-center gap-4 p-4 rounded-2xl mb-4 border ${orderType === "shop" ? "bg-primary/20 border-primary" : "bg-card border-slate-700"}`}
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${orderType === "shop" ? "bg-primary" : "bg-card-light"}`}
              >
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color={orderType === "shop" ? "white" : COLORS.textSecondary}
                />
              </View>
              <View>
                <Text className="text-white font-black text-xs uppercase">
                  Shop Order (Walk-in)
                </Text>
                <Text className="text-text-secondary text-[8px] font-black uppercase">
                  Store transaction
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOrderType("online");
                setOrderTypePickerVisible(false);
              }}
              className={`flex-row items-center gap-4 p-4 rounded-2xl border ${orderType === "online" ? "bg-primary/20 border-primary" : "bg-card border-slate-700"}`}
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${orderType === "online" ? "bg-primary" : "bg-card-light"}`}
              >
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={
                    orderType === "online" ? "white" : COLORS.textSecondary
                  }
                />
              </View>
              <View>
                <Text className="text-white font-black text-xs uppercase">
                  Digital Order (Online)
                </Text>
                <Text className="text-text-secondary text-[8px] font-black uppercase">
                  Delivery logistics
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SUCCESS / INVOICE MODAL */}
      <Modal visible={billingSuccessVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/90 items-center justify-center p-6">
          <View className="bg-card w-full rounded-3xl p-8 border border-slate-700">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                <Ionicons
                  name="checkmark-done"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-white font-black text-lg uppercase tracking-tighter">
                Order Created
              </Text>
              <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-1">
                Success
              </Text>
            </View>

            <View className="bg-card-light border border-slate-700 rounded-2xl p-4 mb-6">
              <View className="flex-row justify-between mb-2 border-b border-slate-700 pb-2">
                <Text className="text-text-secondary text-[9px] font-black uppercase">
                  Order ID
                </Text>
                <Text className="text-white font-black text-xs">
                  {lastOrderDetails?.orderId}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2 border-b border-slate-700 pb-2">
                <Text className="text-text-secondary text-[9px] font-black uppercase">
                  Total
                </Text>
                <Text className="text-white font-black text-xs">
                  ₹ {lastOrderDetails?.total}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-text-secondary text-[9px] font-black uppercase">
                  Customer
                </Text>
                <Text
                  className="text-white font-black text-xs"
                  numberOfLines={1}
                >
                  {lastOrderDetails?.customer?.name}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setBillingSuccessVisible(false)}
              className="bg-primary py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProductBilling;
