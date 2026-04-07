import React from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Booking = {
  bookingId: string;
  vehicleName: string;
  vehicleType: string;
  createdAt: string;
  advanceAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupAddress: string;
  paymentStatus: string;
  paymentId: string;
};

type Props = {
  visible: boolean;
  booking: Booking;
  onClose: () => void;
};

const VehicleBookingModal: React.FC<Props> = ({
  visible,
  booking,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-center px-4">
        <View className="bg-background border border-primary rounded-2xl p-4 max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
           

            {/* HEADER */}
            <Text className="text-primary text-lg font-bold mb-2">
              Booking ID: {booking.bookingId}
            </Text>

            <Text className="text-text-secondary mb-4">
              {new Date(booking.createdAt).toLocaleString()}
            </Text>

            {/* VEHICLE */}
            <View className="mb-4 border-b border-gray700 pb-3">
              <Text className="text-text-primary text-xl font-bold">
                {booking.vehicleName}
              </Text>

              <Text className="text-text-secondary mt-1">
                Type: {booking.vehicleType}
              </Text>

              <Text className="text-primary text-xl font-bold mt-2">
                ₹{booking.advanceAmount}
              </Text>
            </View>

            {/* CUSTOMER */}
            <View className="mb-4">
              <Text className="text-text-primary font-bold mb-2">
                Customer Details
              </Text>

              <View className="bg-card p-3 rounded-xl">
                <Text className="text-text-primary font-bold">
                  {booking.customerName}
                </Text>

                <Text className="text-text-secondary">
                  📞 {booking.customerPhone}
                </Text>

                {booking.customerEmail && (
                  <Text className="text-text-secondary">
                    ✉️ {booking.customerEmail}
                  </Text>
                )}
              </View>
            </View>

            {/* PICKUP */}
            <View className="mb-4">
              <Text className="text-text-primary font-bold mb-2">
                Pickup Info
              </Text>

              <View className="bg-card p-3 rounded-xl">
                <Text className="text-text-secondary">
                  {booking.pickupAddress}
                </Text>
              </View>
            </View>

            {/* PAYMENT */}
            <View className="mb-4">
              <Text className="text-text-primary font-bold mb-2">
                Payment Info
              </Text>

              <View className="bg-success/20 border border-success p-3 rounded-xl">
                <Text className="text-success font-semibold">
                  {booking.paymentStatus}
                </Text>

                <Text className="text-text-secondary text-xs">
                  {booking.paymentId}
                </Text>
              </View>
            </View>

            {/* CLOSE BTN */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary p-3 rounded-lg mt-4"
            >
              <Text className="text-white text-center font-bold">
                Close
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default VehicleBookingModal;