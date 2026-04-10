import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated, Dimensions, Image, Linking, Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api, apiService } from "../../services/api";
import { COLORS, GRADIENT } from "../../theme/colors";
import BookingModal from "../profile/BookingModal";
import VehicleBookingModal from "../profile/VehicleBookingModal";

const STATUS_FLOW = [
  "BOOKED",
  "CALL_VERIFIED",
  "APPROVED",
  "PROCESSING",
  "WAITING_SPARE",
  "SERVICE_GOING",
  "BILL_PENDING",
  "BILL_COMPLETED",
  "SERVICE_COMPLETED",
];

const STATUS_LABELS = {
  BOOKED: "Booked",
  CALL_VERIFIED: "Call Verified",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  WAITING_SPARE: "Waiting for Spare",
  SERVICE_GOING: "Service Going On",
  BILL_PENDING: "Bill Pending",
  BILL_COMPLETED: "Bill Completed",
  SERVICE_COMPLETED: "Service Completed",
  CANCELLED: "Cancelled",
};

const STATUS_NORMALIZER = {
  Booked: "BOOKED",
  "Call Verified": "CALL_VERIFIED",
  Approved: "APPROVED",
  Processing: "PROCESSING",
  "Waiting for Spare": "WAITING_SPARE",
  "Service Going on": "SERVICE_GOING",
  "Bill Pending": "BILL_PENDING",
  "Bill Completed": "BILL_COMPLETED",
  "Service Completed": "SERVICE_COMPLETED",
  Cancelled: "CANCELLED",
};

const whyData = [
  {
    title: "Certified Mechanics",
    subtitle: "Experienced & verified professionals",
    icon: <FontAwesome5 name="tools" size={20} color={COLORS.primary} />,
  },
  {
    title: "Pickup & Drop",
    subtitle: "Doorstep vehicle collection",
    icon: <Ionicons name="car-sport-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "Genuine Parts",
    subtitle: "100% authentic spare parts",
    icon: <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "Quick Service",
    subtitle: "Fast turnaround time",
    icon: <Ionicons name="flash-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "Affordable Pricing",
    subtitle: "Transparent pricing system",
    icon: <Ionicons name="cash-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "Service Warranty",
    subtitle: "Guaranteed workmanship",
    icon: <Ionicons name="ribbon-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "24/7 Support",
    subtitle: "Always available for help",
    icon: <Ionicons name="headset-outline" size={20} color={COLORS.primary} />,
  },
  {
    title: "Live Tracking",
    subtitle: "Track service progress",
    icon: <Ionicons name="location-outline" size={20} color={COLORS.primary} />,
  },
];

const { width } = Dimensions.get("window");
const REVIEW_CARD_WIDTH = width - 40;

const HORIZONTAL_PADDING = 20; // same as ScrollView paddingHorizontal
const CARD_MARGIN = 12;

const CARD_WIDTH =
  (width - HORIZONTAL_PADDING * 2 - CARD_MARGIN) / 2;

const extendedWhyData = [...whyData, ...whyData];

export default function HomeScreen({ navigation }: any) {

  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<any[]>([]);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState<any>(null);
  const [selectedVehicleBooking, setSelectedVehicleBooking] = useState<any>(null);
  const [serviceBookingLoading, setServiceBookingLoading] = useState<boolean>(true);
  const [vehicleBookingLoading, setVehicleBookingLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { user } = useAuth();
  const authUser = user as any;
  const username = authUser?.username || authUser?.name || "";

  const getServiceImage = (service: any) => {
    const img = service.image || service.images?.[0];

    if (!img) return null;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;

    return `https://cars.qtechx.com/${img}`;
  };

  const serviceListRef = useRef<any>(null);
  const extendedServices = [...services, ...services];

  useEffect(() => {
    if (!services.length) return;

    let index = 0;

    const interval = setInterval(() => {
      if (!serviceListRef.current) return;

      index++;

      serviceListRef.current.scrollToOffset({
        offset: index * (CARD_WIDTH + CARD_MARGIN),
        animated: true,
      });

      if (index >= services.length) {
        index = 0;

        setTimeout(() => {
          serviceListRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }, 400);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [services]);

  const [myVehicles, setMyVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const extendedReviews = [...reviews, ...reviews];

  const [approving, setApproving] = useState(false);

  // Spare parts state
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [approvingPartId, setApprovingPartId] = useState<any>(null);

  const carAnim = useRef(new Animated.Value(0)).current;

  const whyListRef = useRef<any>(null);
  const reviewListRef = useRef<any>(null);
  const scrollX = useRef<number>(0);

  const getStatusColor = (status: any) => {
    switch (status) {
      case "BOOKED":
        return COLORS.primary;
      case "PROCESSING":
      case "SERVICE_GOING":
        return COLORS.warning;
      case "SERVICE_COMPLETED":
        return COLORS.success;
      case "CANCELLED":
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const handleApproveSpare = async (serviceId: any, partId: any, status: any) => {
    try {
      setApprovingPartId(partId);

      // TODO: Make API call to update spare part status
      // Example: await apiService.updateSparePartStatus(serviceId, partId, status);

      console.log(`Spare part ${partId} status changed to ${status}`);

      // Update local state
      setSpareParts((prev: any[]) =>
        prev.map((service: any) => {
          if (service.serviceId !== serviceId) return service;
          return {
            ...service,
            parts: service.parts.map((part: any) =>
              part.id === partId ? { ...part, status } : part
            ),
          };
        })
      );

      // Update booking if it's selected
      if (selectedBooking && selectedBooking.id === serviceId) {
        setSelectedBooking((prev: any) => ({
          ...prev,
          spareParts: (prev.spareParts || []).map((part: any) =>
            part.id === partId ? { ...part, status } : part
          ),
        }));
      }

    } catch (error) {
      console.error('Error updating spare part:', error);
    } finally {
      setApprovingPartId(null);
    }
  };

  const handleApproveBooking = async (
    serviceId: any,
    itemId: any,
    status: any,
    type: "part" | "issue" = "part"
  ) => {
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
          console.log("homescreen: issue approve /all-services primary", { serviceId, itemId });
          await api.put(`/all-services/${serviceId}/issues/${itemId}/status`, {
            issueStatus: status,
          });
        } catch (err) {
          console.warn("homescreen: issue primary failed", err);
          primaryError = err;
        }

        if (primaryError) {
          let fallbackError: any = null;
          try {
            console.log("homescreen: issue approve fallback /all-services/issues/{itemId}", { serviceId, itemId });
            await api.put(`/all-services/${serviceId}/issues/${itemId}`, {
              issueStatus: status,
            });
          } catch (err2) {
            console.warn("homescreen: issue fallback 1 failed", err2);
            fallbackError = err2;
          }

          if (fallbackError) {
            try {
              console.log("homescreen: issue approve fallback /all-services/issues/{itemId}/approve", { serviceId, itemId });
              await api.put(`/all-services/${serviceId}/issues/${itemId}/approve`, {
                issueStatus: status,
              });
            } catch (err3) {
              console.warn("homescreen: issue fallback 2 failed", err3);
              try {
                console.log("homescreen: issue approve fallback /bookings/issues/{itemId}", { serviceId, itemId });
                await api.put(`/bookings/${serviceId}/issues/${itemId}`, {
                  issueStatus: status,
                });
              } catch (err4) {
                console.warn("homescreen: issue fallback 3 failed", err4);
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

      console.log("homescreen: approve success", { serviceId, itemId, status, type });

      // Refresh bookings after approval
      if (!authUser?.id && !authUser?.uid && !authUser?.email) {
        return;
      }

      const bookingsData: any[] = await apiService.getBookings();
      const processedBookings = bookingsData.map((booking: any) => ({
        ...booking,
        normalizedStatus:
          STATUS_NORMALIZER[booking.status as keyof typeof STATUS_NORMALIZER] ||
          booking.status,
      }));

      const userServiceBookings = processedBookings.filter((booking: any) =>
        booking.user_id === authUser.id ||
        booking.userId === authUser.id ||
        booking.uid === authUser.id ||
        booking.user_id === authUser.uid ||
        booking.userId === authUser.uid ||
        booking.uid === authUser.uid ||
        booking.email?.toLowerCase() === authUser.email?.toLowerCase() ||
        booking.customerEmail?.toLowerCase() === authUser.email?.toLowerCase()
      ).filter((booking: any) => booking.normalizedStatus !== "SERVICE_COMPLETED");

      const mappedServiceBookings = userServiceBookings.map((booking) => ({
        ...booking,
        bookingId:
          booking.bookingId ||
          booking.booking_id ||
          booking.id?.toString() ||
          "N/A",
        name:
          booking.name ||
          booking.customerName ||
          booking.username ||
          booking.mobile ||
          "",
        phone:
          booking.phone ||
          booking.mobile ||
          booking.customerPhone ||
          "",
        address: booking.address || booking.location || "",
        location: booking.location || booking.address || "",
        vehicleNumber:
          booking.vehicleNumber ||
          booking.registrationNumber ||
          booking.vehicleNo ||
          "",
        brand:
          booking.brand ||
          booking.vehicleBrand ||
          booking.make ||
          "",
        model:
          booking.model ||
          booking.vehicleModel ||
          booking.modelName ||
          "",
        issue: booking.issue || booking.serviceType || "",
        issueAmount:
          booking.issueAmount || booking.issue_cost || booking.issueAmount,
        issueStatus: booking.issueStatus || booking.issueStatus || "",
        preferredDate:
          booking.preferredDate || booking.date || booking.bookingDate || "",
        assignedEmployeeName:
          booking.assignedEmployeeName || booking.assignedEmployee || "",
        serviceId:
          booking.service_id || booking.id || booking.serviceId || null,
      }));

      setServiceBookings(mappedServiceBookings);

      // Update selected booking if it's currently open
      if (selectedServiceBooking) {
        const refreshed = mappedServiceBookings.find(
          (booking) =>
            booking.bookingId === selectedServiceBooking.bookingId ||
            booking.id === selectedServiceBooking.id ||
            booking.serviceId === selectedServiceBooking.serviceId
        );
        if (refreshed) {
          setSelectedServiceBooking(refreshed);
        }
      }
    } catch (error) {
      console.error('Error approving booking item:', error);
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, {
          toValue: 10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(carAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiService.getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  // Fetch all bookings from API with spare parts
  useEffect(() => {
    if (!authUser?.id && !authUser?.uid && !authUser?.email) {
      setServiceBookingLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        // Fetch bookings and enrich with service details
        const bookingsData: any[] = await apiService.getBookings();
        const processedData = bookingsData.map((booking: any) => ({
          ...booking,
          normalizedStatus:
            STATUS_NORMALIZER[booking.status as keyof typeof STATUS_NORMALIZER] ||
            booking.status,
        }));

        setAllBookings(processedData);

        // Fetch all services and filter user services (like profile page)
        const [servicesRes] = await Promise.all([
          api.get("/all-services"),
        ]);

        const servicesRaw = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : servicesRes.data?.services || servicesRes.data?.data || [];

        const userServices = servicesRaw.filter((service: any) => {
          const serviceEmail = service.email?.toLowerCase();
          const isUserEmail = serviceEmail === authUser.email.toLowerCase();
          const isUserUid = service.uid === authUser.uid || service.uid === authUser.id;
          const isBookingMatch = processedData.some(
            (b: any) =>
              b.bookingId === service.bookingId ||
              b.bookingId === service.booking_id ||
              b.id === service.serviceId ||
              b.id === service.id
          );
          return isUserEmail || isUserUid || isBookingMatch;
        });

        // Fetch detailed service data for each user service (like profile page)
        const servicesWithDetails = await Promise.all(
          userServices.map(async (service: any) => {
            try {
              const detailRes = await api.get(`/all-services/${service.id}`);
              console.log(`Home: service ${service.id} (${service.bookingId}) has ${detailRes.data?.issues?.length || 0} issues`);
              return {
                ...service,
                parts:
                  detailRes.data?.parts ||
                  detailRes.data?.spareParts ||
                  detailRes.data?.serviceParts ||
                  [],
                issues:
                  detailRes.data?.issues ||
                  detailRes.data?.serviceIssues ||
                  detailRes.data?.issueDetails ||
                  [],
                issueAmount:
                  detailRes.data?.issueAmount ??
                  detailRes.data?.issue_amount ??
                  null,
                issueStatus:
                  detailRes.data?.issueStatus ??
                  detailRes.data?.issue_status ??
                  null,
              };
            } catch (err) {
              console.warn(
                "Home: failed service detail fetch",
                service.id,
                err
              );
              return {
                ...service,
                parts: [],
                issues: [],
                issueAmount: null,
                issueStatus: null,
              };
            }
          })
        );

        // Create spares array (like profile page)
        const spares: any[] = servicesWithDetails.map((service: any) => ({
          serviceId: service.id || service.serviceId,
          serviceName: service.bookingId || service.booking_id || service.orderId || "",
          parts: service.parts || [],
          issues: service.issues || [],
        }));

        setSpareParts(spares);

        // Filter user bookings
        const userServiceBookings = processedData.filter((booking: any) =>
          booking.user_id === authUser.id ||
          booking.userId === authUser.id ||
          booking.uid === authUser.id ||
          booking.user_id === authUser.uid ||
          booking.userId === authUser.uid ||
          booking.uid === authUser.uid ||
          booking.email?.toLowerCase() === authUser.email?.toLowerCase() ||
          booking.customerEmail?.toLowerCase() === authUser.email?.toLowerCase()
        );

        // Match bookings with service details to get issues (like profile page)
        const mappedServiceBookings = userServiceBookings.map((booking) => {
          const matchedService = servicesWithDetails.find((s: any) => {
            const bookingId = booking.bookingId || booking.booking_id;
            const serviceId = booking.serviceId || booking.service_id;

            return (
              (bookingId && (s.bookingId === bookingId || s.booking_id === bookingId)) ||
              (serviceId && (s.id === serviceId || s.serviceId === serviceId)) ||
              (bookingId && s.bookingDocId === bookingId)
            );
          });

          console.log(`Home: booking ${booking.bookingId} matched service:`, matchedService?.id, matchedService?.bookingId);
          console.log(`Home: booking ${booking.bookingId} getting ${matchedService?.issues?.length || 0} issues from service ${matchedService?.id}`);

          return {
            ...booking,
            normalizedStatus: STATUS_NORMALIZER[booking.status] || booking.status,
            issues: matchedService?.issues || [],
            issue: matchedService?.issue || booking.issue || booking.serviceType || "",
            issueAmount: matchedService?.issueAmount ?? null,
            issueStatus: matchedService?.issueStatus || null,
            serviceId: booking.serviceId || booking.service_id || matchedService?.id || matchedService?.serviceId || null,
            brand: booking.brand || booking.vehicleBrand || matchedService?.brand,
            model: booking.model || booking.vehicleModel || matchedService?.model,
            vehicleNumber:
              booking.vehicleNumber ||
              booking.registrationNumber ||
              matchedService?.vehicleNumber ||
              matchedService?.registrationNumber,
            address: booking.address || booking.location || matchedService?.address || matchedService?.location,
            preferredDate: booking.preferredDate || booking.date || matchedService?.preferredDate,
            assignedEmployeeName:
              booking.assignedEmployeeName ||
              booking.assignedEmployee ||
              matchedService?.assignedEmployeeName,
          };
        }).filter((booking) => booking.normalizedStatus !== "SERVICE_COMPLETED");

        setServiceBookings(mappedServiceBookings);

      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setServiceBookingLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  useEffect(() => {
    if (!authUser?.id && !authUser?.uid && !authUser?.email && !authUser?.mobile && !authUser?.phone) {
      setVehicleBookingLoading(false);
      return;
    }

    const fetchVehicleBookings = async () => {
      try {
        setVehicleBookingLoading(true);
        let data = [];

        try {
          const response = await api.get(`/vehicle-bookings/user/${authUser.id}`);
          data = response.data;
        } catch (error) {
          console.warn('Could not load user vehicle bookings by user route, falling back to all vehicle bookings.', error);
          const allVehicleBookings = await apiService.getVehicleBookings();
          data = allVehicleBookings;
        }

        const mappedVehicleBookings = (Array.isArray(data) ? data : []).map((booking: any) => ({
          ...booking,
          bookingId: booking.bookingId || booking.booking_id || booking.id?.toString() || "N/A",
          vehicleName: booking.vehicleName || booking.vehicle_name || booking.vehicle || "N/A",
          vehicleType: booking.vehicleType || booking.vehicle_type || booking.type || "N/A",
          createdAt: booking.createdAt || booking.created_at || booking.date || new Date().toISOString(),
          advanceAmount: booking.advanceAmount || booking.amount || booking.advanceAmount || 0,
          status: booking.status || booking.bookingStatus || "Pending",
          customerName: booking.customerName || booking.customer_name || booking.customer || "",
          customerPhone: booking.customerPhone || booking.customer_phone || booking.mobile || booking.phone || "",
          customerEmail: booking.customerEmail || booking.customer_email || booking.email || "",
          pickupAddress: booking.pickupAddress || booking.pickup_address || booking.address || "",
          paymentStatus: booking.paymentStatus || booking.payment_status || "Unknown",
          paymentId: booking.paymentId || booking.payment_id || booking.paymentId || "",
          userId: booking.userId || booking.user_id || booking.uid || booking.customerId,
        })).filter((booking: any) =>
          booking.userId === authUser.id ||
          booking.userId === authUser.uid ||
          booking.user_id === authUser.id ||
          booking.user_id === authUser.uid ||
          booking.uid === authUser.id ||
          booking.uid === authUser.uid ||
          booking.customerEmail?.toLowerCase() === authUser.email?.toLowerCase() ||
          booking.email?.toLowerCase() === authUser.email?.toLowerCase() ||
          booking.customerPhone === authUser.mobile ||
          booking.customerPhone === authUser.phone ||
          booking.phone === authUser.mobile ||
          booking.phone === authUser.phone
        );

        setVehicleBookings(mappedVehicleBookings);
      } catch (error) {
        console.error('Error fetching vehicle bookings:', error);
      } finally {
        setVehicleBookingLoading(false);
      }
    };

    fetchVehicleBookings();
  }, [user?.id]);


  // Fetch My Vehicles from API
  useEffect(() => {
    if (!user) return;

    const fetchVehicles = async () => {
      try {
        const data = await apiService.getVehicles();
        setMyVehicles(data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [user]);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/reviews");

        // ✅ only approved reviews (same as web)
        const approvedReviews = (res.data || []).filter(
          (r: any) => r.status === 1 || r.status === true
        );

        setReviews(approvedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      }
    };

    fetchReviews();
  }, []);

  // auto scroll reviews
  useEffect(() => {
    if (!reviews.length) return;

    let index = 0;

    const interval = setInterval(() => {
      if (!reviewListRef.current) return;

      index++;

      reviewListRef.current.scrollToOffset({
        offset: index * REVIEW_CARD_WIDTH,
        animated: true,
      });

      if (index >= reviews.length) {
        index = 0;

        setTimeout(() => {
          reviewListRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }, 400);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [reviews]);

  // why swiper auto-scroll
  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      if (!whyListRef.current) return;

      index++;

      whyListRef.current.scrollToOffset({
        offset: index * (CARD_WIDTH + CARD_MARGIN),
        animated: true,
      });

      // reset silently after half (no visible jump)
      if (index >= whyData.length) {
        index = 0;

        setTimeout(() => {
          whyListRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }, 400);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 50,
        paddingTop: 10,
      }}
    >

      {/* ================= BANNER ================= */}
      <View className="mx-5 mt-4 mb-8">
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24 }}
          className="p-6 items-center overflow-hidden"
        >

          <Text className="text-white text-sm text-center">
            Welcome Back
            {username && (
              <Text className="text-white font-bold text-base">
                , {username}
              </Text>
            )} 👋
          </Text>

          <Text className="text-white text-2xl font-extrabold text-center mt-3">
            Premium Car Care Service
          </Text>

          <Text className="text-white/80 text-sm text-center mt-2">
            Book trusted mechanics at your doorstep
          </Text>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/booking")}
              className="bg-white px-5 py-3 rounded-2xl flex-1 flex-row items-center justify-center"
            >
              <Ionicons name="flash-outline" size={18} color={COLORS.primary} />
              <Text className="text-primary font-black ml-2 uppercase text-[10px] tracking-widest">
                Quick Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/appointment")}
              className="bg-black/20 border border-white/20 px-5 py-3 rounded-2xl flex-1 flex-row items-center justify-center"
            >
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text className="text-white font-black ml-2 uppercase text-[10px] tracking-widest">
                Appointment
              </Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </View>

      {/* ================= MY SERVICE BOOKINGS ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
          <Text className="text-primary text-lg font-bold ml-2">
            My Service Bookings
          </Text>
        </View>

        {serviceBookingLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : serviceBookings.length === 0 ? (
          <Text className="text-textSecondary">
            No recent service bookings found.
          </Text>
        ) : (
          serviceBookings.map((item) => {
            const hasPending = item.status === "WAITING_SPARE" || item.status === "BILL_PENDING" || item.status === "PROCESSING";
            return (
              <TouchableOpacity
                key={item.id || item.bookingId}
                onPress={() => setSelectedServiceBooking(item)}
                className="rounded-xl p-4 mb-4"
                style={{
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: hasPending ? COLORS.warning : COLORS.primary,
                }}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-2">
                    <Text className="text-text-primary font-bold">
                      {item.bookingId}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-1">
                      {item.name} • {item.phone}
                    </Text>
                  </View>
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
                      {(STATUS_LABELS[item.normalizedStatus as keyof typeof STATUS_LABELS] || item.status || "Pending").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ================= MY VEHICLE BOOKINGS ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Ionicons name="car-outline" size={18} color={COLORS.primary} />
          <Text className="text-primary text-lg font-bold ml-2">
            My Vehicle Bookings
          </Text>
        </View>

        {vehicleBookingLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : vehicleBookings.length === 0 ? (
          <Text className="text-textSecondary">
            No vehicle bookings found.
          </Text>
        ) : (
          vehicleBookings.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.id || item.bookingId}
              onPress={() => setSelectedVehicleBooking(item)}
              className="bg-card border border-gray700 p-4 mb-4 rounded-2xl"
            >
              <Text className="text-text-primary font-semibold">
                Booking ID: {item.bookingId}
              </Text>
              <Text className="text-text-primary text-lg font-bold mt-1">
                {item.vehicleName}
              </Text>
              <Text className="text-text-secondary text-sm mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <View className="flex-row justify-between items-center mt-4">
                <Text className="bg-success/20 text-success px-3 py-1 rounded-full text-xs font-semibold">
                  {item.status || "Booked"}
                </Text>
                <Text className="text-primary font-bold text-base">
                  ₹{item.advanceAmount}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {selectedServiceBooking && (
        <BookingModal
          visible={true}
          booking={selectedServiceBooking}
          spareParts={spareParts}
          onClose={() => setSelectedServiceBooking(null)}
          onApprove={handleApproveBooking}
        />
      )}

      {selectedVehicleBooking && (
        <VehicleBookingModal
          visible={true}
          booking={selectedVehicleBooking}
          onClose={() => setSelectedVehicleBooking(null)}
        />
      )}

      {/* ================= SERVICES ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Ionicons name="construct-outline" size={18} color={COLORS.primary} />
          <Text className="text-primary text-lg font-bold ml-2">
            Our Services
          </Text>
        </View>

        <Animated.FlatList
          ref={serviceListRef}
          data={extendedServices}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item: service }) => {
            const imageUri = getServiceImage(service);

            return (
              <View
                style={{ width: CARD_WIDTH, borderRadius: 18 }}
                className="bg-[#111827] p-2.5 rounded-[18px] mr-3 border border-[#0EA5E9]/20"
              >
                {/* IMAGE */}
                <View className="mb-2.5">
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      className="w-full h-[110px] rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-[110px] rounded-xl bg-[#1F2937] justify-center items-center">
                      <Text className="text-[#94A3B8] text-xs">No Image</Text>
                    </View>
                  )}
                </View>

                {/* NAME */}
                <Text
                  className="text-white text-[13px] font-bold mb-1"
                  numberOfLines={1}
                >
                  {service.name}
                </Text>

                {/* DESCRIPTION */}
                <Text
                  className="text-[#94A3B8] text-[11px] mb-2"
                  numberOfLines={2}
                >
                  {service.description || "No description provided."}
                </Text>

                {/* PRICE */}
                {/* <View className="flex-row items-center mb-1">
                  {service.price ? (
                    <Text className="text-[#0EA5E9] font-bold text-sm">
                      {service.price}
                    </Text>
                  ) : (
                    <Text className="text-[#64748B] italic text-[11px]">
                      Price on request
                    </Text>
                  )}
                </View> */}

                {/* BUTTON */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/service/[id]",
                      params: { id: service.id },
                    })
                  }
                  activeOpacity={0.8}
                  className="rounded-full overflow-hidden w-[90%] self-center mt-1"
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 25 }}
                    className="py-1.5 justify-center items-center"
                  >
                    <Text className="text-white font-bold text-xs tracking-[0.5px]">
                      Details
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>


      {/* ================= WHY CHOOSE US ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Text className="text-primary text-lg font-bold">
            Why Choose Us
          </Text>
        </View>

        <Animated.FlatList
          ref={whyListRef}
          data={extendedWhyData}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item }) => (
            <View
              style={{ width: CARD_WIDTH, borderRadius: 20 }}
              className="bg-card p-5 mr-4 border border-primary/10 overflow-hidden"
            >
              <View className="bg-primary/10 p-3 rounded-xl self-start mb-3">
                {item.icon}
              </View>

              <Text className="text-white font-bold text-sm">
                {item.title}
              </Text>

              <Text className="text-gray-400 text-xs mt-1">
                {item.subtitle}
              </Text>
            </View>
          )}
        />
      </View>


      {/* ================= CUSTOMER REVIEWS ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Ionicons name="star-outline" size={18} color={COLORS.primary} />
          <Text className="text-primary text-lg font-bold ml-2">
            Customer Reviews
          </Text>
        </View>

        <Animated.FlatList
          ref={reviewListRef}
          data={extendedReviews}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                width: width - 40,
                borderRadius: 20,
              }}
              className="bg-card p-5 border border-primary/10 overflow-hidden mr-4"
            >

              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="person" size={20} color={COLORS.primary} />
                  )}
                </View>

                <View className="ml-3">
                  <Text className="text-white font-bold">
                    {item.name}
                  </Text>

                  <View className="flex-row mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= item.rating ? "star" : "star-outline"}
                        size={14}
                        color={COLORS.rating}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <Text className="text-gray-400 text-xs">
                "{item.message}"
              </Text>

            </View>
          )}
        />
      </View>


      {/* ================= CONTACT ================= */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-1 h-5 bg-white rounded mr-2" />
          <Ionicons name="call-outline" size={18} color={COLORS.primary} />
          <Text className="text-primary text-lg font-bold ml-2">
            Contact Us
          </Text>
        </View>

        <View
          style={{ borderRadius: 20 }}
          className="bg-card p-5 border border-primary/10 overflow-hidden"
        >

          <View className="flex-row items-center mb-3">
            <Ionicons name="call" size={18} color={COLORS.primary} />
            <Text className="text-white ml-3">
              +91 98765 43210
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="mail" size={18} color={COLORS.primary} />
            <Text className="text-white ml-3">
              support@carservice.com
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text className="text-white ml-3">
              No. 24, Anna Nagar, Chennai
            </Text>
          </View>

        </View>
      </View>


      {/* ================= BUTTON ================= */}
      <TouchableOpacity
        onPress={() =>
          Linking.openURL("https://maps.app.goo.gl/kv7qjVpYMpcXuzx17")
        }
        className="mx-5 mt-2"
      >
        <LinearGradient
          colors={GRADIENT}
          style={{ borderRadius: 30 }}
          className="py-4 items-center justify-center flex-row overflow-hidden"
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text className="text-white font-bold ml-2">
            Get Directions
          </Text>
        </LinearGradient>
      </TouchableOpacity>

    </ScrollView>
  );
}

/* ================= BOOKING DETAIL MODAL ================= */

function BookingDetailModal({ booking, onClose }) {
  return (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className="w-full max-h-[85%] bg-modal rounded-xl p-5 border border-primary">
          <TouchableOpacity
            className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-[9px] justify-center items-center"
            onPress={onClose}
          >
            <Text className="text-white text-lg">✕</Text>
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 40 }}>
            {/* Title */}
            <Text className="text-sky text-xl font-bold mb-5 -mt-2">
              Booking Details
            </Text>

            {/* Booking ID */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Booking ID</Text>
              <Text className="text-white text-sm font-medium">{booking.bookingId}</Text>
            </View>

            {/* Name */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Name</Text>
              <Text className="text-white text-sm font-medium">{booking.name}</Text>
            </View>

            {/* Phone */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Phone</Text>
              <Text className="text-white text-sm font-medium">{booking.phone}</Text>
            </View>

            {/* Car Brand */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Car Brand</Text>
              <Text className="text-white text-sm font-medium">{booking.brand}</Text>
            </View>

            {/* Car Model */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Car Model</Text>
              <Text className="text-white text-sm font-medium">{booking.model}</Text>
            </View>

            {/* Issue */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Issue</Text>
              <Text className="text-white text-sm font-medium">{booking.issue}</Text>
            </View>

            {/* Location */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Location</Text>
              <Text className="text-white text-sm font-medium">{booking.location}</Text>
            </View>

            {/* Address */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Service Address</Text>
              <Text className="text-white text-sm font-medium">{booking.address}</Text>
            </View>

            {/* Status */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Status</Text>
              <Text className="text-white text-sm font-medium text-primary">
                {STATUS_LABELS[booking.normalizedStatus] || booking.status}
              </Text>
            </View>

            {/* Service Tracker */}
            <View className="mt-5 mb-7.5">
              {/* Line + Circles Row */}
              <View className="flex-row items-center">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(
                    booking.normalizedStatus
                  );
                  const isCompleted = index <= currentIndex;

                  return (
                    <View
                      key={status}
                      className="flex-row items-center flex-1"
                    >
                      <View
                        className={`w-7.5 h-7.5 rounded-[7.5px] justify-center items-center z-10 ${isCompleted ? 'bg-sky' : 'bg-gray-800'
                          }`}
                      >
                        <Text
                          className={`font-bold text-xs ${isCompleted ? 'text-black' : 'text-gray-400'
                            }`}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      {index !== STATUS_FLOW.length - 1 && (
                        <View
                          className={`flex-1 h-1 ${index < currentIndex ? 'bg-sky' : 'bg-gray-700'
                            }`}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* CURRENT STATUS */}
              <View className="mt-5 items-center">
                <Text className="text-textSecondary text-xs mb-1.5">
                  Current Status
                </Text>

                <Text className="text-sky text-lg font-bold">
                  {STATUS_LABELS[booking.normalizedStatus]}
                </Text>
              </View>

              {/* LEGEND LIST */}
              <View className="mt-5 pt-3.75 border-t border-sky/20">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(
                    booking.normalizedStatus
                  );
                  const isCurrent = index === currentIndex;

                  return (
                    <View key={status} className="flex-row items-center mb-2">
                      <Text
                        className={`text-xs ${isCurrent ? 'text-sky font-bold' : 'text-slate-300'
                          }`}
                      >
                        {index + 1} - {STATUS_LABELS[status]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function VehicleDetailModal({ vehicle, onClose }) {

  const [actionLoadingIndex, setActionLoadingIndex] = useState(null);
  const [localIssues, setLocalIssues] = useState(vehicle.issuesDetails || []);

  const normalizedStatus =
    STATUS_NORMALIZER[vehicle.serviceStatus] || vehicle.serviceStatus;
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(null);

  const handleIssueUpdate = async (issueIndex, newStatus) => {
    try {
      setActionLoadingIndex(issueIndex);

      const updatedIssues = [...localIssues];
      const currentIssue = updatedIssues[issueIndex];

      updatedIssues[issueIndex] = {
        ...currentIssue,
        approvalStatus: newStatus,
      };

      setLocalIssues(updatedIssues);

      // TODO: Make API call to update booking status
      // You'll need to add an updateBooking endpoint to api.ts
      // Example: await apiService.updateBooking(vehicle.id, { issuesDetails: updatedIssues });

      console.log("Issue status updated locally. Sync with API when endpoint is available.");

    } catch (error) {
      console.log("Update error:", error);
    } finally {
      setActionLoadingIndex(null);
    }
  };

  useEffect(() => {
    setLocalIssues(vehicle.issuesDetails || []);
  }, [vehicle]);

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    try {
      setActionLoadingIndex(selectedIssueIndex);

      const updatedIssues = [...localIssues];
      const currentIssue = updatedIssues[selectedIssueIndex];

      updatedIssues[selectedIssueIndex] = {
        ...currentIssue,
        approvalStatus: "rejected",
        rejectionReason: rejectReason,
      };

      setLocalIssues(updatedIssues);

      // TODO: Make API call to reject booking
      // You'll need to add a rejectBooking endpoint to api.ts
      // Example: await apiService.rejectBooking(vehicle.id, { issuesDetails: updatedIssues });

      setRejectModalVisible(false);
      setRejectReason("");
      setSelectedIssueIndex(null);

      console.log("Rejection recorded locally. Sync with API when endpoint is available.");

    } catch (error) {
      console.log("Reject error:", error);
    } finally {
      setActionLoadingIndex(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className="w-full max-h-[85%] bg-modal rounded-xl p-5 border border-primary">
          <TouchableOpacity
            className="self-end py-2 px-2"
            onPress={onClose}
          >
            <Text className="text-white text-lg">✕</Text>
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 30 }}>

            <Text className="text-sky text-xl font-bold mb-5 -mt-2">
              Vehicle Details
            </Text>

            {/* Add Vehicle ID */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Vehicle ID</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.addVehicleId}
              </Text>
            </View>

            {/* Name */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Customer Name</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.name}
              </Text>
            </View>

            {/* Phone */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Phone</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.phone}
              </Text>
            </View>

            {/* Email */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Email</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.email}
              </Text>
            </View>

            {/* Brand */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Brand</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.brand}
              </Text>
            </View>

            {/* Model */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Model</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.model}
              </Text>
            </View>

            {/* Vehicle Type */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Vehicle Type</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.vehicleType}
              </Text>
            </View>

            {/* Vehicle Number */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Vehicle Number</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.vehicleNumber}
              </Text>
            </View>

            {/* Issue */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Issue</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.issue}
              </Text>
            </View>

            {/* Address */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Address</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.address}
              </Text>
            </View>

            {/* Created Date */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Created Date</Text>
              <Text className="text-white text-sm font-medium">
                {vehicle.createdDate} • {vehicle.createdTime}
              </Text>
            </View>

            {/* Status */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Vehicle Status</Text>
              <Text className="text-white text-sm font-medium text-warning">
                {vehicle.addVehicleStatus}
              </Text>
            </View>

            {/* Service Status */}
            <View className="mb-4 pb-3 border-b border-primary/10">
              <Text className="text-textSecondary text-xs font-semibold mb-1">Service Status</Text>
              <Text className="text-white text-sm font-medium text-sky">
                {vehicle.serviceStatus}
              </Text>
            </View>

            {vehicle.assigned && (
              <View className="bg-success/10 p-3 rounded-xl mb-3.75">
                <Text className="text-success font-semibold">
                  ✅ Mechanic assigned to your vehicle
                </Text>
              </View>
            )}

            {vehicle.issuesAdded && localIssues?.length > 0 && (
              <>
                <Text className="text-sky text-base font-bold mb-3.75">
                  Spare Report Status
                </Text>

                {localIssues.map((item, index) => (
                  <View
                    key={index}
                    className="bg-card p-3.75 rounded-xl mb-3.75 border border-primary/20"
                  >
                    <Text className="text-white font-semibold">
                      {item.issue}
                    </Text>

                    <Text className="text-gray-400 mt-1">
                      Amount: ₹{item.amount}
                    </Text>

                    {/* APPROVE / REJECT BUTTONS */}
                    {item.approvalStatus === "pending" && (
                      <View className="flex-row mt-2.5">

                        <TouchableOpacity
                          disabled={actionLoadingIndex === index}
                          onPress={() => handleIssueUpdate(index, "approved")}
                          className={`bg-success py-2 px-4.5 rounded-xl mr-2.5 ${actionLoadingIndex === index ? 'opacity-60' : ''
                            }`}
                        >
                          {actionLoadingIndex === index ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                          ) : (
                            <Text className="text-white font-semibold">
                              Approve
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={actionLoadingIndex === index}
                          onPress={() => {
                            setSelectedIssueIndex(index);
                            setRejectModalVisible(true);
                          }}
                          className={`bg-error py-2 px-4.5 rounded-xl ${actionLoadingIndex === index ? 'opacity-60' : ''
                            }`}
                        >
                          <Text className="text-white font-semibold">
                            Reject
                          </Text>
                        </TouchableOpacity>

                      </View>
                    )}
                    {item.approvalStatus === "approved" && (
                      <View className="mt-2.5">
                        <Text className="text-success font-semibold">
                          ✅ You Approved This Spare
                        </Text>
                      </View>
                    )}

                    {item.approvalStatus === "rejected" && (
                      <View className="mt-2.5">
                        <Text className="text-error font-semibold">
                          ❌ You Rejected This Spare
                        </Text>

                        {item.rejectionReason && (
                          <Text className="text-gray-400 mt-1">
                            Reason: {item.rejectionReason}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* SERVICE TRACKER */}
            <View className="mt-6 mb-7.5">

              {/* Line + Circles */}
              <View className="flex-row items-center">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(normalizedStatus);
                  const isCompleted = index <= currentIndex;

                  return (
                    <View
                      key={status}
                      className="flex-row items-center flex-1"
                    >
                      <View
                        className={`w-7.5 h-7.5 rounded-[7.5px] justify-center items-center z-10 ${isCompleted ? 'bg-sky' : 'bg-gray-800'
                          }`}
                      >
                        <Text
                          className={`font-bold text-xs ${isCompleted ? 'text-black' : 'text-gray-400'
                            }`}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      {index !== STATUS_FLOW.length - 1 && (
                        <View
                          className={`flex-1 h-1 ${index < currentIndex ? 'bg-sky' : 'bg-gray-700'
                            }`}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* CURRENT STATUS */}
              <View className="mt-5 items-center">
                <Text className="text-textSecondary text-xs mb-1.5">
                  Current Status
                </Text>

                <Text className="text-sky text-lg font-bold">
                  {STATUS_LABELS[normalizedStatus]}
                </Text>
              </View>

              {/* LEGEND */}
              <View className="mt-5 pt-3.75 border-t border-sky/20">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(normalizedStatus);
                  const isCurrent = index === currentIndex;

                  return (
                    <View key={status} className="flex-row items-center mb-2">
                      <Text
                        className={`text-xs ${isCurrent ? 'text-sky font-bold' : 'text-slate-300'
                          }`}
                      >
                        {index + 1} - {STATUS_LABELS[status]}
                      </Text>
                    </View>
                  );
                })}
              </View>

            </View>

            {/* Reject Reason Modal */}
            <Modal
              visible={rejectModalVisible}
              transparent
              animationType="fade"
            >
              <View className="flex-1 bg-black/70 justify-center items-center p-5">
                <View className="bg-modal w-full rounded-xl p-5">
                  <Text className="text-sky text-base font-bold mb-3.75">
                    Enter Rejection Reason
                  </Text>

                  <TextInput
                    placeholder="Enter reason..."
                    placeholderTextColor={COLORS.gray400}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    className="bg-card text-white p-3 rounded-xl min-h-20 mb-3.75"
                  />

                  <TouchableOpacity
                    onPress={confirmReject}
                    className="bg-error py-3 rounded-xl items-center"
                  >
                    <Text className="text-white font-bold">
                      Confirm Reject
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRejectModalVisible(false)}
                    className="mt-2.5 items-center"
                  >
                    <Text className="text-gray-400">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            </Modal>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
