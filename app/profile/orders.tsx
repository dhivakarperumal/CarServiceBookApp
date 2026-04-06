import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG = {
  orderplaced: { label: "Order Placed", step: 0 },
  processing: { label: "Processing", step: 1 },
  packing: { label: "Packing", step: 2 },
  outfordelivery: { label: "Out for Delivery", step: 3 },
  delivered: { label: "Delivered", step: 4 },
  cancelled: { label: "Cancelled", step: -1 },
};

const STATUS_STEPS = [
  "Order Placed",
  "Processing",
  "Packing",
  "Out for Delivery",
  "Delivered",
];

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/orders/user/${user.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-4">

      {orders.length === 0 ? (
        <Text className="text-text-secondary mt-6">
          No orders found
        </Text>
      ) : (
        <ScrollView className="mt-4">
          {orders.map((order: any) => {
            const statusKey = (order.status || "orderplaced").toLowerCase();
            const statusLabel =
              STATUS_CONFIG[statusKey]?.label || "Order Placed";

            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                className="bg-card p-4 rounded-2xl mb-4 border border-white/5"
              >
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-white font-bold">
                      Order ID: {order.orderId}
                    </Text>
                    <Text className="text-text-secondary text-xs mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-primary font-bold">
                      ₹{order.total}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-1">
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* MODAL */}
      <Modal visible={!!selectedOrder} animationType="slide">
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </Modal>

    </SafeAreaView>
  );
}

function OrderModal({ order, onClose }: any) {
  const statusKey = (order.status || "orderplaced").toLowerCase();
  const currentStep = STATUS_CONFIG[statusKey]?.step || 0;

  const shipping = {
    name: order.shippingName || order.customerName,
    phone: order.shippingPhone || order.customerPhone,
    email: order.shippingEmail || order.customerEmail,
    address: order.shippingAddress,
    city: order.shippingCity,
    state: order.shippingState,
    zip: order.shippingZip,
    country: order.shippingCountry,
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4">

      {/* HEADER */}
      <View className="flex-row justify-between items-center mt-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
          <Text className="text-text-primary font-bold text-lg">
            Order Details
          </Text>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="mt-4">

        {/* ORDER INFO */}
        <Text className="text-primary font-bold">
          Order ID: {order.orderId}
        </Text>

        <Text className="text-text-secondary mt-1 text-xs">
          {new Date(order.createdAt).toLocaleString()}
        </Text>

        {/* ================= ITEMS ================= */}
        <View className="mt-4">
          {order.items?.map((item: any, i: number) => (
            <View
              key={i}
              className="flex-row justify-between border-b border-white/10 py-3"
            >
              <View>
                <Text className="text-white font-semibold">
                  {item.name}
                </Text>

                {/* ✅ QUANTITY */}
                <Text className="text-text-secondary text-xs mt-1">
                  Qty: {item.qty || item.quantity} × ₹{item.price}
                </Text>
              </View>

              <Text className="text-primary font-bold">
                ₹{item.price * (item.qty || item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTAL */}
        <View className="flex-row justify-between mt-4">
          <Text className="text-white font-bold">Total</Text>
          <Text className="text-primary font-bold text-lg">
            ₹{order.total}
          </Text>
        </View>

        {/* ================= SHIPPING DETAILS ================= */}
        <View className="mt-6">
          <Text className="text-text-primary font-bold mb-3 uppercase text-xs">
            Shipping Details
          </Text>

          <View className="bg-card p-4 rounded-xl border border-white/10">
            <Text className="text-white font-bold">
              {shipping.name}
            </Text>

            <Text className="text-text-secondary text-sm mt-1">
              📞 {shipping.phone}
            </Text>

            {shipping.email && (
              <Text className="text-text-secondary text-sm">
                ✉️ {shipping.email}
              </Text>
            )}

            <Text className="text-text-secondary text-sm mt-2">
              {shipping.address}
            </Text>

            <Text className="text-text-secondary text-sm">
              {shipping.city}, {shipping.state} - {shipping.zip}
            </Text>

            <Text className="text-text-secondary text-sm">
              {shipping.country}
            </Text>
          </View>
        </View>

        {/* ================= TRACKING ================= */}
        <View className="mt-6">
          <Text className="text-text-primary font-bold mb-4 uppercase text-xs">
            Order Status
          </Text>

          {statusKey === "cancelled" ? (
            <View className="bg-error/20 border border-error p-4 rounded-xl">
              <Text className="text-error font-bold text-center">
                ❌ Order Cancelled
              </Text>
            </View>
          ) : (
            <View>
              {STATUS_STEPS.map((step, index) => (
                <View key={step} className="flex-row items-start mb-4">

                  {/* CIRCLE + LINE */}
                  <View className="items-center mr-3">
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${
                        index <= currentStep
                          ? "bg-primary"
                          : "bg-gray-700"
                      }`}
                    >
                      <Text className="text-black text-xs font-bold">
                        {index + 1}
                      </Text>
                    </View>

                    {index !== STATUS_STEPS.length - 1 && (
                      <View
                        className={`w-[2px] h-6 mt-1 ${
                          index < currentStep
                            ? "bg-primary"
                            : "bg-gray-700"
                        }`}
                      />
                    )}
                  </View>

                  {/* LABEL */}
                  <Text
                    className={`mt-1 ${
                      index <= currentStep
                        ? "text-primary font-bold"
                        : "text-text-secondary"
                    }`}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}