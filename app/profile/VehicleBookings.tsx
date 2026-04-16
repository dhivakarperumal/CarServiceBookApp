import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";
import VehicleBookingModal from "./VehicleBookingModal";

type Booking = {
  id: number;
  bookingId: string;
  vehicleName: string;
  vehicleType: string;
  createdAt: string;
  advanceAmount: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupAddress: string;
  paymentStatus: string;
  paymentId: string;
};

const VehicleBookings: React.FC = () => {
  const { user } = useAuth() as any;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);
      const res = await api.get(`/vehicle-bookings/user/${user.id}`);
      setBookings(res.data || []);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["left", "right"]}
      className="flex-1 bg-background px-4"
    >
      {/* TITLE */}
      <Text className="text-primary text-2xl font-bold mt-5 mb-4">
        My Booked Vehicles
      </Text>

      {/* EMPTY STATE */}
      {bookings.length === 0 ? (
        <Text className="text-textSecondary text-center mt-10">
          No vehicle bookings found
        </Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedBooking(item)}
              className="bg-card border border-gray700 p-4 mb-4 rounded-2xl"
            >
              {/* BOOKING ID */}
              <Text className="text-text-primary font-semibold">
                Booking ID: {item.bookingId}
              </Text>

              {/* VEHICLE NAME */}
              <Text className="text-text-primary text-lg font-bold mt-1">
                {item.vehicleName}
              </Text>

              {/* DATE */}
              <Text className="text-text-secondary text-sm mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              {/* STATUS + PRICE */}
              <View className="flex-row justify-between items-center mt-4">
                <Text className="bg-success/20 text-success px-3 py-1 rounded-full text-xs font-semibold">
                  {item.status || "Sold"}
                </Text>

                <Text className="text-primary font-bold text-base">
                  ₹{item.advanceAmount}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL */}
      {selectedBooking && (
        <VehicleBookingModal
          visible={true}
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default VehicleBookings;