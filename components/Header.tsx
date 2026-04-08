import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { api } from "../services/api";
import { COLORS } from "../theme/colors";

// ✅ User Type
type User = {
  id?: number;
  uid?: string;
  username?: string;
  name?: string;
  email?: string;
};

// ✅ Auth Context Type
type AuthContextType = {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
};

// ✅ Cart Context Type
type CartContextType = {
  totalItems: number;
};

type StatusItem = {
  id: string;
  label: string;
  status: string;
};

const Header: React.FC = () => {
  const router = useRouter();

  const { user, logout } = useAuth() as AuthContextType;
  const { totalItems: cartCount } = useCart() as CartContextType;

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [bookingStatuses, setBookingStatuses] = useState<StatusItem[]>([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState<StatusItem[]>([]);
  const [vehicleBookingStatuses, setVehicleBookingStatuses] = useState<StatusItem[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<StatusItem[]>([]);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const notificationCount =
    bookingStatuses.length +
    appointmentStatuses.length +
    vehicleBookingStatuses.length +
    orderStatuses.length;

  const formatStatusItem = (item: any, type: "booking" | "appointment" | "vehicle" | "order"): StatusItem => {
    const id =
      item.bookingId ||
      item.orderId ||
      item.appointmentId ||
      item.id?.toString?.() ||
      item.booking_id ||
      item.appointment_id ||
      "N/A";

    const status =
      item.status ||
      item.bookingStatus ||
      item.paymentStatus ||
      item.serviceStatus ||
      item.orderStatus ||
      item.issueStatus ||
      "Unknown";

    const label =
      type === "booking"
        ? "Booking"
        : type === "appointment"
        ? "Appointment"
        : type === "vehicle"
        ? "Vehicle Booking"
        : "Order";

    return {
      id,
      label,
      status: status.toString(),
    };
  };

  const loadStatusCounts = async () => {
    if (!user?.id) {
      setBookingStatuses([]);
      setAppointmentStatuses([]);
      setVehicleBookingStatuses([]);
      setOrderStatuses([]);
      return;
    }

    setStatusLoading(true);
    setStatusError(null);

    try {
      const [bookingsRes, appointmentsRes, vehicleRes, ordersRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/appointments/my", { params: { uid: user.uid } }),
        api.get(`/vehicle-bookings/user/${user.id}`),
        api.get(`/orders/user/${user.id}`),
      ]);

      const bookingsData = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || bookingsRes.data?.data || [];

      const appointmentData = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : appointmentsRes.data?.appointments || appointmentsRes.data?.data || [];

      const vehicleData = Array.isArray(vehicleRes.data)
        ? vehicleRes.data
        : vehicleRes.data?.vehicleBookings || vehicleRes.data?.data || [];

      const orderData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.orders || ordersRes.data?.data || [];

      const filteredBookings = bookingsData.filter((booking: any) => {
        return (
          booking.user_id === user.id ||
          booking.userId === user.id ||
          booking.uid === user.id ||
          booking.uid === user.uid ||
          booking.email?.toLowerCase() === user.email?.toLowerCase() ||
          booking.customerEmail?.toLowerCase() === user.email?.toLowerCase()
        );
      });

      const filteredAppointments = appointmentData.filter((appointment: any) => {
        return (
          appointment.uid === user.uid ||
          appointment.email?.toLowerCase() === user.email?.toLowerCase() ||
          appointment.user_id === user.id ||
          appointment.userId === user.id
        );
      });

      const filteredVehicles = vehicleData.filter((vehicle: any) => {
        return (
          vehicle.userId === user.id ||
          vehicle.user_id === user.id ||
          vehicle.uid === user.id ||
          vehicle.uid === user.uid ||
          vehicle.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
          vehicle.email?.toLowerCase() === user.email?.toLowerCase()
        );
      });

      const filteredOrders = orderData.filter((order: any) => {
        return (
          order.userId === user.id ||
          order.user_id === user.id ||
          order.uid === user.id ||
          order.uid === user.uid ||
          order.email?.toLowerCase() === user.email?.toLowerCase() ||
          order.customerEmail?.toLowerCase() === user.email?.toLowerCase()
        );
      });

      setBookingStatuses(filteredBookings.slice(0, 3).map((item: any) => formatStatusItem(item, "booking")));
      setAppointmentStatuses(filteredAppointments.slice(0, 3).map((item: any) => formatStatusItem(item, "appointment")));
      setVehicleBookingStatuses(filteredVehicles.slice(0, 3).map((item: any) => formatStatusItem(item, "vehicle")));
      setOrderStatuses(filteredOrders.slice(0, 3).map((item: any) => formatStatusItem(item, "order")));
    } catch (error) {
      console.error("Header: failed to load status counts", error);
      setStatusError("Unable to load status data");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (notificationOpen) {
      loadStatusCounts();
    }
  }, [notificationOpen, user]);

  useEffect(() => {
    if (user) {
      loadStatusCounts();
    }
  }, [user]);

  const renderStatusSection = (
    title: string,
    items: StatusItem[],
    route: string,
    countLabel: string
  ) => (
    <View className="mb-3">
      <TouchableOpacity
        onPress={() => {
          setNotificationOpen(false);
          router.push(route as any);
        }}
        className="flex-row items-center justify-between"
        activeOpacity={0.7}
      >
        <View>
          <Text className="text-white font-semibold">{title}</Text>
          <Text className="text-text-secondary text-xs">{countLabel}</Text>
        </View>
        <View className="bg-primary rounded-full px-2 py-1">
          <Text className="text-[10px] font-bold text-white">
            {items.length}
          </Text>
        </View>
      </TouchableOpacity>
      {items.length > 0 ? (
        <View className="mt-2 space-y-1">
          {items.map((item) => (
            <View key={`${title}-${item.id}`}>
              <Text className="text-text-secondary text-xs">
                {item.id} • {item.status}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-text-secondary text-xs mt-2">
          No active {title.toLowerCase()}.
        </Text>
      )}
    </View>
  );

  // 🔥 Logout Function
  const handleLogout = async (): Promise<void> => {
    setMenuOpen(false);
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <>
      {/* 🔷 HEADER */}
      <SafeAreaView edges={["top"]} className="bg-background">
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{
            borderBottomWidth: 0.6,
            borderBottomColor: COLORS.primary,
          }}
        >

          {/* 🧩 LOGO */}
          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.7}
          >
            <Image
              source={require("../assets/images/logo_no_bg.png")}
              className="w-16 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* 🔷 RIGHT SIDE */}
          <View className="flex-row items-center gap-3">

            {/* 🛒 CART */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => router.push("/cart")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cart-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {/* 🔴 CART BADGE */}
              {cartCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-1.5 min-w-[16px] h-[16px] items-center justify-center">
                  <Text className="text-[10px] text-white font-bold">
                    {cartCount}
                  </Text>
                </View>
              )}
            </View>

            {/* 🔔 NOTIFICATIONS */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => {
                  setNotificationOpen(true);
                  setMenuOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
              {notificationCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-1.5 min-w-[16px] h-[16px] items-center justify-center">
                  <Text className="text-[10px] text-white font-bold">
                    {notificationCount}
                  </Text>
                </View>
              )}
            </View>

            {/* 👤 USER / LOGIN */}
            {user ? (
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(true);
                  setNotificationOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-primary items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold">
                  {(user.username || user.name || "U")[0].toUpperCase()}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* 🔥 DROPDOWN MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">

        {/* BACKDROP */}
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setMenuOpen(false)}
        />

        {/* MENU BOX */}
        <View className="absolute top-20 right-5 w-[320px] max-h-[70%] bg-card rounded-2xl border border-primary/30 py-2 shadow-lg">

          {/* PROFILE */}
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              router.push("/(tabs)/profile");
            }}
            className="px-4 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">
              My Profile
            </Text>
          </TouchableOpacity>

          {/* LOGOUT */}
          <TouchableOpacity
            onPress={handleLogout}
            className="px-4 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-error font-semibold">
              Logout
            </Text>
          </TouchableOpacity>

        </View>
      </Modal>

      <Modal visible={notificationOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setNotificationOpen(false)}
        />

        <View className="absolute top-20 right-5 w-80 max-h-[80%] bg-card rounded-2xl border border-primary/30 py-2 shadow-lg">
          <View className="px-4 py-3 border-b border-primary/30">
            <Text className="text-white font-semibold text-base">
              Notifications
            </Text>
            <Text className="text-text-secondary text-xs mt-1">
              Status updates for bookings, appointments, vehicle bookings, and orders.
            </Text>
          </View>

          <View className="px-4 py-3">
            {statusLoading ? (
              <Text className="text-text-secondary text-xs">Loading...</Text>
            ) : statusError ? (
              <Text className="text-error text-xs">{statusError}</Text>
            ) : (
              <>
                {renderStatusSection(
                  "Bookings",
                  bookingStatuses,
                  "/profile/service-status",
                  `Showing ${bookingStatuses.length} item${bookingStatuses.length === 1 ? "" : "s"}`
                )}
                {renderStatusSection(
                  "Appointments",
                  appointmentStatuses,
                  "/profile/service-status",
                  `Showing ${appointmentStatuses.length} item${appointmentStatuses.length === 1 ? "" : "s"}`
                )}
                {renderStatusSection(
                  "Vehicle Bookings",
                  vehicleBookingStatuses,
                  "/profile/vehicle-bookings",
                  `Showing ${vehicleBookingStatuses.length} item${vehicleBookingStatuses.length === 1 ? "" : "s"}`
                )}
                {renderStatusSection(
                  "Orders",
                  orderStatuses,
                  "/profile/orders",
                  `Showing ${orderStatuses.length} item${orderStatuses.length === 1 ? "" : "s"}`
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Header;