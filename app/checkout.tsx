import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { api } from '../services/api';
import { COLORS } from '../theme/colors';

const indianStates = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Delhi", "Maharashtra", "Gujarat", "Punjab", "Rajasthan", "West Bengal",
];

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams<any>();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);

  const [shipping, setShipping] = useState({
    name: user?.username || "",
    email: user?.email || "",
    phone: user?.mobile || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  useEffect(() => {
    if (params.isBuyNow && params.product) {
      try {
        const prod = JSON.parse(params.product);
        setItems([{ ...prod, qty: prod.quantity, total: prod.price * prod.quantity }]);
      } catch (e) {
        console.error("Failed to parse buy now product", e);
        setItems([]);
      }
    } else {
      setItems(cart.map(i => ({ ...i, qty: i.quantity, total: i.price * i.quantity })));
    }

    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id, params.isBuyNow, params.product, cart]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get(`/addresses/${user?.id}`);
      setSavedAddresses(res.data || []);

      if (res.data && res.data.length > 0 && !shipping.address) {
        const recent = res.data[0];
        setShipping(prev => ({
          ...prev,
          name: recent.fullName || prev.name,
          phone: recent.phone || prev.phone,
          address: recent.street || "",
          city: recent.city || "",
          state: recent.state || "",
          zip: recent.pinCode || "",
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch addresses:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        await fetchAddresses();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const selectAddress = (addr: any) => {
    setShipping({
      ...shipping,
      name: addr.fullName || shipping.name,
      phone: addr.phone || shipping.phone,
      address: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.pinCode || "",
    });
    setShowAddressList(false);
    Alert.alert('Success', 'Address selected');
  };

  const finalTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handlePlaceOrder = async () => {
    if (!items.length) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.state) {
      Alert.alert('Missing Info', 'Please fill all delivery details');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'ONLINE') {
        const amountPaise = Math.round(finalTotal * 100);
        const options = {
          description: 'Car Service Order',
          image: 'https://cars.qtechx.com/logo.png',
          currency: 'INR',
          key: 'rzp_test_SGj8n5SyKSE10b',
          amount: amountPaise,
          name: 'Car Store',
          prefill: {
            email: shipping.email,
            contact: shipping.phone,
            name: shipping.name
          },
          theme: { color: COLORS.primary }
        };

        RazorpayCheckout.open(options).then((data: any) => {
          submitOrder(data.razorpay_payment_id);
        }).catch((error: any) => {
          Alert.alert(`Error: ${error.code}`, error.description);
          setLoading(false);
        });
        return;
      }

      await submitOrder();
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const submitOrder = async (paymentId: string | null = null) => {
    try {
      const orderData = {
        uid: user?.id,
        customerName: shipping.name,
        customerPhone: shipping.phone,
        customerEmail: shipping.email,
        orderType: "DELIVERY",
        paymentMethod,
        paymentStatus: paymentId ? "Paid" : "Pending",
        status: "orderplaced",
        shipping,
        subtotal: finalTotal,
        total: finalTotal,
        items: items.map(i => ({
          ...i,
          variant: i.variant || ""
        }))
      };

      const res = await api.post("/orders", orderData);
      const newOrderId = res.data.orderId;

      await api.post("/products/reduce-stock", { items });

      await api.post("/addresses", {
        userUid: user?.id,
        fullName: shipping.name,
        phone: shipping.phone,
        email: shipping.email,
        street: shipping.address,
        city: shipping.city,
        pinCode: shipping.zip,
        state: shipping.state,
        country: shipping.country,
      });

      if (!params.isBuyNow) {
        clearCart();
      }

      Alert.alert('Order Successful!', `Your order #${newOrderId} has been placed.`);
      router.replace('/profile/orders');
    } catch (err) {
      console.error("Submit order error", err);
      Alert.alert('Error', 'Could not save your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [showStateDropdown, setShowStateDropdown] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]">
      <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Back' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
            }>
          {/* Saved Addresses Toggle */}
          {savedAddresses.length > 0 && (
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setShowAddressList(!showAddressList)}
                className="flex-row justify-between items-center mb-4"
              >
                <Text className="text-[#0EA5E9] text-[14px] font-[900] tracking-[1.5px]">SAVED ADDRESSES</Text>
                <Ionicons
                  name={showAddressList ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#0EA5E9"
                />
              </TouchableOpacity>

              {showAddressList && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2.5">
                  {savedAddresses.map((addr, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => selectAddress(addr)}
                      className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 w-[200px] mr-4"
                    >
                      <Text className="text-white font-bold mb-1.5">{addr.fullName}</Text>
                      <Text className="text-[#94A3B8] text-xs leading-5" numberOfLines={2}>{addr.street}</Text>
                      <Text className="text-[#94A3B8] text-xs">{addr.city}, {addr.state}</Text>
                      <Text className="text-[#0EA5E9] text-[11px] mt-2">📞 {addr.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Shipping Details */}
          <View className="mb-6">
            <Text className="text-[#0EA5E9] text-[14px] font-[900] tracking-[1.5px] mb-4">SHIPPING DETAILS</Text>

            <View className="bg-[#111827] rounded-[24px] p-5 border border-[#334155]">
              <View className="mb-4">
                <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">FULL NAME</Text>
                <TextInput
                  value={shipping.name}
                  onChangeText={(val) => setShipping({ ...shipping, name: val })}
                  className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm"
                  placeholder="Enter your name"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View className="mb-4">
                <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">EMAIL ADDRESS</Text>
                <TextInput
                  value={shipping.email}
                  onChangeText={(val) => setShipping({ ...shipping, email: val })}
                  className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View className="mb-4">
                <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">PHONE NUMBER</Text>
                <TextInput
                  value={shipping.phone}
                  onChangeText={(val) => setShipping({ ...shipping, phone: val })}
                  className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm"
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View className="mb-4">
                <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">STREET ADDRESS</Text>
                <TextInput
                  value={shipping.address}
                  onChangeText={(val) => setShipping({ ...shipping, address: val })}
                  className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm h-20"
                  placeholder="Street name & house number"
                  multiline
                  placeholderTextColor="#64748B"
                />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">CITY</Text>
                  <TextInput
                    value={shipping.city}
                    onChangeText={(val) => setShipping({ ...shipping, city: val })}
                    className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm"
                    placeholder="City"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">PIN CODE</Text>
                  <TextInput
                    value={shipping.zip}
                    keyboardType="numeric"
                    onChangeText={(val) => setShipping({ ...shipping, zip: val })}
                    className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 color-white text-sm"
                    placeholder="Zip"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-[#475569] text-[10px] font-bold mb-2 ml-1.5">STATE</Text>
                <TouchableOpacity
                  onPress={() => setShowStateDropdown(true)}
                  className="flex-row items-center justify-between bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3"
                >
                  <Text className={`text-sm ${shipping.state ? 'text-white' : 'text-[#64748B]'}`}>
                    {shipping.state || "Select State"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#475569" />
                </TouchableOpacity>

                {showStateDropdown && (
                  <View className="bg-[#1E293B] border border-[#334155] rounded-xl mt-2 overflow-hidden">
                    {indianStates.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          setShipping({ ...shipping, state: s });
                          setShowStateDropdown(false);
                        }}
                        className={`px-4 py-3 border-b border-[#334155] ${shipping.state === s ? 'bg-[#0EA5E920]' : ''}`}
                      >
                        <Text className={`text-sm ${shipping.state === s ? 'text-[#0EA5E9] font-bold' : 'text-gray-400'}`}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View className="mb-6">
            <Text className="text-[#0EA5E9] text-[14px] font-[900] tracking-[1.5px] mb-4">PAYMENT METHOD</Text>
            <View className="bg-[#111827] rounded-[24px] p-2.5 border border-[#334155]">
              <TouchableOpacity
                onPress={() => setPaymentMethod('CASH')}
                className={`flex-row items-center p-4 rounded-2xl mb-1 ${paymentMethod === 'CASH' ? 'bg-[#0EA5E910]' : ''}`}
              >
                <Ionicons
                  name={paymentMethod === 'CASH' ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentMethod === 'CASH' ? "#0EA5E9" : "#475569"}
                />
                <Text className={`text-sm ml-4 ${paymentMethod === 'CASH' ? 'text-white font-bold' : 'text-[#64748B]'}`}>Cash on Delivery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod('ONLINE')}
                className={`flex-row items-center p-4 rounded-2xl ${paymentMethod === 'ONLINE' ? 'bg-[#0EA5E910]' : ''}`}
              >
                <Ionicons
                  name={paymentMethod === 'ONLINE' ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentMethod === 'ONLINE' ? "#0EA5E9" : "#475569"}
                />
                <Text className={`text-sm ml-4 ${paymentMethod === 'ONLINE' ? 'text-white font-bold' : 'text-[#64748B]'}`}>Online Payment (Razorpay)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Summary Preview */}
          <View className="bg-[#0EA5E910] rounded-[24px] p-5 border border-[#0EA5E930]">
            <Text className="text-[#0EA5E9] text-[12px] font-[900] mb-4 text-center">ORDER SUMMARY</Text>
            {items.map((item, i) => (
              <View key={i} className="flex-row justify-between mb-2.5">
                <Text className="text-[#94A3B8] text-sm flex-1 mr-2.5" numberOfLines={1}>{item.name}</Text>
                <Text className="text-white text-sm font-bold">₹{(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}
            <View className="border-t border-[#0EA5E930] pt-4 mt-1 flex-row justify-between items-center">
              <Text className="text-white font-bold">TOTAL AMOUNT</Text>
              <Text className="text-[#0EA5E9] text-2xl font-[900]">₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="absolute bottom-0 w-full px-6 pt-4 pb-10 bg-[#1E293B] border-t border-[#334155]">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View className="h-14 rounded-full overflow-hidden">
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              className="flex-1 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-base font-[900] tracking-[1px]">
                    CONFIRM ORDER
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" className="ml-2.5" />
                </>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
