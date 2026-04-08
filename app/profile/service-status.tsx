import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";
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
  email?: string;
  address?: string;
  location?: string;
  vehicleNumber?: string;
  brand?: string;
  model?: string;
  issue?: string;
  issueAmount?: number;
  issueStatus?: string;
  issues?: any[];
  serviceId?: number;
  preferredDate?: string;
  assignedEmployeeName?: string;
};

type SpareService = {
  serviceId: number;
  serviceName: string;
  parts: Part[];
  issues?: any[];
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
  "Completed": "SERVICE_COMPLETED",
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
  const [approving, setApproving] = useState<boolean>(false);

  /* ===== FETCH ===== */

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user?.email) {
        // console.log("ServiceStatus: no user email yet");
        return;
      }

      // console.log("ServiceStatus: fetching bookings and all-services for", user.email);
      const [bookingsRes, appointmentsRes, servicesRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/appointments/my", { params: { uid: user.uid } }),
        api.get("/all-services"),
      ]);

      const bookingsRaw = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || bookingsRes.data?.data || [];
      const appointmentsRaw = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : appointmentsRes.data?.appointments || [];
      const servicesRaw = Array.isArray(servicesRes.data)
        ? servicesRes.data
        : servicesRes.data?.services || servicesRes.data?.data || [];

      // console.log(
      //   "ServiceStatus: raw bookings",
      //   bookingsRaw.length,
      //   "raw all-services",
      //   servicesRaw.length
      // );

      const appointmentData = appointmentsRaw.map((apt: any) => ({
        ...apt,
        id: apt.id || apt.appointmentId,
        bookingId: apt.appointmentId,
        name: apt.name || apt.customerName,
        phone: apt.phone || apt.mobile,
        bookingType: "Appointment",

        // important mappings
        issue: apt.serviceType,
        vehicleNumber: apt.registrationNumber,

        status: apt.status,
        normalizedStatus: STATUS_NORMALIZER[apt.status] || apt.status,
      }));

      const userServices = servicesRaw.filter((service: any) => {
        const serviceEmail = service.email?.toLowerCase();
        const isUserEmail = serviceEmail === user.email.toLowerCase();
        const isUserUid = service.uid === user.uid || service.uid === user.id;
        const isBookingMatch = bookingsRaw.some(
          (b: any) =>
            b.bookingId === service.bookingId ||
            b.bookingId === service.booking_id ||
            b.id === service.serviceId ||
            b.id === service.id
        );
        return isUserEmail || isUserUid || isBookingMatch;
      });

      // console.log("ServiceStatus: userServices count", userServices.length);

      const servicesWithDetails = await Promise.all(
        userServices.map(async (service: any) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: detailRes.data?.parts || service.parts || [],
              issues: detailRes.data?.issues || service.issues || [],
              issueAmount: detailRes.data?.issueAmount ?? service.issueAmount,
              issueStatus: detailRes.data?.issueStatus || service.issueStatus,
            };
          } catch (err) {
            console.warn(
              "ServiceStatus: failed service detail fetch",
              service.id,
              err
            );
            return {
              ...service,
              parts: service.parts || [],
              issues: service.issues || [],
            };
          }
        })
      );

      const spares: SpareService[] = servicesWithDetails.map((service: any) => ({
        serviceId: service.id || service.serviceId,
        serviceName: service.bookingId || service.booking_id || service.orderId || "",
        parts: service.parts || [],
        issues: service.issues || [],
      }));

      // console.log("ServiceStatus: processed spare parts", spares);
      setSpareParts(spares);

      const regularBookings = bookingsRaw.filter(
        (b: any) =>
          b.email?.toLowerCase() === user.email.toLowerCase() ||
          b.uid === user.uid
      );

      // 🔥 MERGE HERE
      const combinedData = [...regularBookings, ...appointmentData];

      // 🔥 USE combinedData instead of bookingsRaw
      const userBookings: Booking[] = combinedData.map((b: any) => {
        const matchedService = servicesWithDetails.find(
          (s: any) =>
            s.id === b.serviceId ||
            s.id === b.service_id ||
            s.serviceId === b.serviceId ||
            s.serviceId === b.service_id ||
            s._id === b.serviceId ||
            s._id === b.service_id ||
            s.bookingId === b.bookingId ||
            s.bookingId === b.booking_id ||
            s.booking_id === b.bookingId ||
            s.booking_id === b.booking_id
        );

        console.log(`ServiceStatus: booking ${b.bookingId} matched service:`, matchedService?.id, matchedService?.bookingId);

        return {
          ...b,
          normalizedStatus: STATUS_NORMALIZER[b.status] || b.status,
          issues: matchedService?.issues || b.issues || b.serviceIssues || [],
          issue: b.issue || b.serviceType || matchedService?.issue || "",
          issueAmount: b.issueAmount ?? matchedService?.issueAmount,
          issueStatus: b.issueStatus || matchedService?.issueStatus,
          serviceId: b.serviceId || b.id || b.service_id || matchedService?.id || matchedService?.serviceId,
          brand: b.brand || b.vehicleBrand || matchedService?.brand,
          model: b.model || b.vehicleModel || matchedService?.model,
          vehicleNumber:
            b.vehicleNumber ||
            b.registrationNumber ||
            matchedService?.vehicleNumber ||
            matchedService?.registrationNumber,
          address: b.address || b.location || matchedService?.address || matchedService?.location,
          preferredDate: b.preferredDate || b.date || matchedService?.preferredDate,
          assignedEmployeeName:
            b.assignedEmployeeName ||
            b.assignedEmployee ||
            matchedService?.assignedEmployeeName,
        } as Booking;
      });

      // console.log("ServiceStatus: processed bookings", userBookings);
      setBookings(userBookings);

      if (selectedBooking) {
        const refreshed = userBookings.find(
          (booking) =>
            booking.bookingId === selectedBooking.bookingId ||
            booking.id === selectedBooking.id ||
            booking.serviceId === selectedBooking.serviceId
        );
        if (refreshed) {
          setSelectedBooking(refreshed);
        }
      }
    } catch (err) {
      console.log("ServiceStatus: fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApprove = async (
    serviceId: number,
    itemId: string | null,
    status: "approved" | "rejected",
    type: "part" | "issue" = "part"
  ) => {
    const normalizedItemId = itemId || null;
    // console.log("ServiceStatus: handleApprove", { serviceId, itemId: normalizedItemId, status, type });
    setApproving(true);
    try {
      if (type === "part") {
        try {
          await api.put(`/all-services/${serviceId}/parts/${itemId}/approve`, {
            status,
          });
        } catch (err) {
          console.warn("part approval fallback 1", err);
          await api.put(`/bookings/${serviceId}/parts/${itemId}`, { status });
        }
      } else {
        let primaryError: any = null;
        try {
          console.log("ServiceStatus: issue approve /all-services primary", { serviceId, itemId });
          await api.put(`/all-services/${serviceId}/issues/${itemId}/status`, {
            issueStatus: status,
          });
        } catch (err) {
          console.warn("ServiceStatus: issue primary failed", err);
          primaryError = err;
        }

        if (primaryError) {
          let fallbackError: any = null;
          try {
            console.log("ServiceStatus: issue approve fallback /all-services/issues/{itemId}", { serviceId, itemId });
            await api.put(`/all-services/${serviceId}/issues/${itemId}`, {
              issueStatus: status,
            });
          } catch (err2) {
            console.warn("ServiceStatus: issue fallback 1 failed", err2);
            fallbackError = err2;
          }

          if (fallbackError) {
            try {
              console.log("ServiceStatus: issue approve fallback /all-services/issues/{itemId}/approve", { serviceId, itemId });
              await api.put(`/all-services/${serviceId}/issues/${itemId}/approve`, {
                issueStatus: status,
              });
            } catch (err3) {
              console.warn("ServiceStatus: issue fallback 2 failed", err3);
              try {
                console.log("ServiceStatus: issue approve fallback /bookings/issues/{itemId}", { serviceId, itemId });
                await api.put(`/bookings/${serviceId}/issues/${itemId}`, {
                  issueStatus: status,
                });
              } catch (err4) {
                console.warn("ServiceStatus: issue fallback 3 failed", err4);
                if (!itemId) {
                  await api.put(`/bookings/${serviceId}/issue`, {
                    issueStatus: status,
                  });
                } else {
                  throw err4;
                }
              }
            }
          }
        }
      }

      // console.log("ServiceStatus: approve success", { serviceId, itemId, status, type });
      await fetchData();
      if (selectedBooking) {
        setSelectedBooking((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            issueStatus: type === "issue" ? status : prev.issueStatus,
            issues: prev.issues?.map((issue) =>
              issue.id === itemId ? { ...issue, issueStatus: status } : issue
            ),
          } as Booking;
        });
      }
    } catch (err) {
      console.log("ServiceStatus: approve error", err);
    } finally {
      setApproving(false);
    }
  };

  /* ===== RENDER ITEM ===== */

  const renderItem = ({ item }: { item: Booking }) => {
    const bookingSpares = spareParts.find(
      (sp) => sp.serviceId === item.serviceId || sp.serviceId === item.id
    );

    const hasPending =
      bookingSpares?.parts?.some((p) => p.status === "pending");

    return (
      <TouchableOpacity
        onPress={() => {
          // console.log("ServiceStatus: selected booking", item);
          setSelectedBooking(item);
        }}
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
      {/* {spareParts.some((sp) =>
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
        )} */}

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
          onApprove={handleApprove}
        />
      )}
    </SafeAreaView>
  );

};

export default ServiceStatus;