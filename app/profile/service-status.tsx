import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import BookingModal from "./BookingModal";

/* ===== TYPES ===== */

type Part = {
  id: string;
  partName: string;
  qty: number;
  price: number;
  total: number;
  status: "pending" | "approved" | "rejected";
};

type Booking = {
  id: number;
  bookingId: string;
  name: string;
  phone: string;
  status: string;
  normalizedStatus?: string;
  parts?: Part[];
};

type SpareService = {
  serviceId: number;
  serviceName: string;
  parts: Part[];
};

/* ===== STATUS ===== */

const STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  APPOINTMENT_BOOKED: "Appointment Booked",
  CALL_VERIFIED: "Call Verified",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  WAITING_SPARE: "Waiting for Spare",
  SERVICE_GOING: "Service Going On",
  BILL_PENDING: "Bill Pending",
  BILL_COMPLETED: "Bill Completed",
  SERVICE_COMPLETED: "Service Completed",
  CANCELLED: "Cancelled",
  ASSIGNED: "Assigned",
};

const STATUS_NORMALIZER: Record<string, string> = {
  "Booked": "BOOKED",
  "Appointment Booked": "APPOINTMENT_BOOKED",
  "Call Verified": "CALL_VERIFIED",
  "Approved": "APPROVED",
  "Processing": "PROCESSING",
  "Waiting for Spare": "WAITING_SPARE",
  "Service Going on": "SERVICE_GOING",
  "Bill Pending": "BILL_PENDING",
  "Bill Completed": "BILL_COMPLETED",
  "Service Completed": "SERVICE_COMPLETED",
  "Cancelled": "CANCELLED",
  "Assigned": "ASSIGNED",
};

/* ===== COMPONENT ===== */

const ServiceStatus: React.FC = () => {
  const { user } = useAuth() as any;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spareParts, setSpareParts] = useState<SpareService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSpareModal, setShowSpareModal] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  /* ===== FETCH ===== */

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user?.email) return;

      const res = await api.get("/bookings");

      const userBookings: Booking[] = (res.data || [])
        .filter((b: any) =>
          b.email?.toLowerCase() === user.email.toLowerCase()
        )
        .map((b: any) => ({
          ...b,
          normalizedStatus: STATUS_NORMALIZER[b.status] || b.status,

          // ✅ IMPORTANT
          issues: b.issues || [],
          issue: b.issue || "",
          issueAmount: b.issueAmount,
          issueStatus: b.issueStatus,
          serviceId: b.serviceId || b.id,
        }));

      setBookings(userBookings);

      const spares: SpareService[] = (res.data || []).map((b: any) => ({
        serviceId: b.serviceId || b.id,
        serviceName: b.bookingId,
        parts: b.parts || b.spareParts || [], 
      }));

      setSpareParts(spares);

    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===== RENDER ITEM ===== */

  const renderItem = ({ item }: { item: Booking }) => {
    const bookingSpares = spareParts.find(
      (sp) => sp.serviceId === item.id
    );

    const hasPending =
      bookingSpares?.parts?.some((p) => p.status === "pending");

    return (
      <TouchableOpacity
        onPress={() => setSelectedBooking(item)}
        className="rounded-xl p-4 mb-4"
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: hasPending ? COLORS.warning : COLORS.primary,
        }}
      >
        <View className="flex-row justify-between items-center">

          {/* LEFT CONTENT */}
          <View className="flex-1 pr-2">
            <Text className="text-text-primary font-bold">
              {item.bookingId}
            </Text>

            <Text className="text-text-secondary text-sm mt-1">
              {item.name} • {item.phone}
            </Text>

            {bookingSpares?.parts?.length > 0 && (
              <Text className="text-xs mt-2 text-text-secondary">
                🔧 ₹
                {bookingSpares.parts.reduce(
                  (sum, p) => sum + Number(p.total || 0),
                  0
                )}
              </Text>
            )}
          </View>

          {/* RIGHT STATUS BADGE */}
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: hasPending
                ? COLORS.warning + "30"
                : COLORS.primary + "30",
            }}
          >
            <Text
              style={{
                color: hasPending ? COLORS.warning : COLORS.primary,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {(STATUS_LABELS[item.normalizedStatus || ""] ||
                item.status ||
                "PENDING"
              ).toUpperCase()}
            </Text>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  /* ===== LOADING ===== */

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background px-4">
      <Text className="text-primary mt-5 text-2xl font-bold mb-4">
        My Service Bookings
      </Text>

      {/* ALERT */}
      {spareParts.some((sp) =>
        sp.parts.some((p) => p.status === "pending")
      ) && (
          <TouchableOpacity
            onPress={() => setShowSpareModal(true)}
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: COLORS.warning + "20" }}
          >
            <Text style={{ color: COLORS.warning }}>
              Spare parts pending approval
            </Text>
          </TouchableOpacity>
        )}

      {/* LIST */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      {/* MODAL */}
      <Modal visible={showSpareModal} animationType="slide">
        <SafeAreaView className="flex-1 bg-background p-4">
          <Text className="text-text-primary text-xl font-bold mb-4">
            Spare Parts
          </Text>

          <ScrollView>
            {spareParts.map((service) =>
              service.parts.map((part) => (
                <View
                  key={part.id}
                  className="p-4 mb-3 rounded-lg"
                  style={{ backgroundColor: COLORS.card }}
                >
                  <Text className="text-text-primary font-semibold">
                    {part.partName}
                  </Text>

                  <Text className="text-text-secondary text-sm">
                    ₹{part.total}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      color:
                        part.status === "approved"
                          ? COLORS.success
                          : part.status === "rejected"
                            ? COLORS.error
                            : COLORS.warning,
                    }}
                  >
                    {part.status.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowSpareModal(false)}
            className="p-4 rounded-lg mt-4"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-text-primary text-center font-bold">
              Close
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
      {selectedBooking && (
        <BookingModal
          visible={true}
          booking={selectedBooking}
          spareParts={spareParts}
          onClose={() => setSelectedBooking(null)}
          onApprove={(serviceId, itemId, status, type) => {
            console.log("Approve:", serviceId, itemId, status, type);
          }}
        />
      )}
    </SafeAreaView>
  );

};

export default ServiceStatus;