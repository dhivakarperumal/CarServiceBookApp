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
import { apiService } from "../../services/api";
import { COLORS, GRADIENT } from "../../theme/colors";

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

export default function HomeScreen({ navigation }) {

  const router = useRouter();
  const [services, setServices] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const [myVehicles, setMyVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [reviews, setReviews] = useState([]);
  const extendedReviews = [...reviews, ...reviews];

  // Spare parts state
  const [spareParts, setSpareParts] = useState([]);
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [approvingPartId, setApprovingPartId] = useState(null);

  const carAnim = useRef(new Animated.Value(0)).current;

  const whyListRef = useRef(null);
  const reviewListRef = useRef(null);
  const scrollX = useRef(0);

  const getStatusColor = (status) => {
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

  const handleApproveSpare = async (serviceId, partId, status) => {
    try {
      setApprovingPartId(partId);

      // TODO: Make API call to update spare part status
      // Example: await apiService.updateSparePartStatus(serviceId, partId, status);

      console.log(`Spare part ${partId} status changed to ${status}`);

      // Update local state
      setSpareParts((prev) =>
        prev.map((service) => {
          if (service.serviceId !== serviceId) return service;
          return {
            ...service,
            parts: service.parts.map((part) =>
              part.id === partId ? { ...part, status } : part
            ),
          };
        })
      );

      // Update booking if it's selected
      if (selectedBooking && selectedBooking.id === serviceId) {
        setSelectedBooking((prev) => ({
          ...prev,
          spareParts: (prev.spareParts || []).map((part) =>
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

  // Fetch current user from AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get user from AsyncStorage (set during login/register)
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUser(user);
          setUsername(user.username || user.name);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
    if (!user) return;

    const fetchBookings = async () => {
      try {
        // Fetch bookings and enrich with service details
        const bookingsData = await apiService.getBookings();
        const processedData = bookingsData.map((booking) => ({
          ...booking,
          normalizedStatus: STATUS_NORMALIZER[booking.status] || booking.status,
        }));

        setAllBookings(processedData);

        // Extract unique vehicles from bookings
        const vehiclesMap = {};
        processedData.forEach((item) => {
          if (item.vehicleNumber && item.vehicleType) {
            vehiclesMap[item.vehicleNumber] = {
              vehicleNumber: item.vehicleNumber,
              vehicleType: item.vehicleType,
              brand: item.brand,
              model: item.model,
            };
          }
        });

        setMyVehicles(Object.values(vehiclesMap));

        // Fetch spare parts for services
        try {
          const allParts = [];
          for (let booking of processedData) {
            // Try to get service details including spare parts
            if (booking.service_id) {
              try {
                const serviceDetail = await apiService.getServiceById(booking.service_id);
                if (serviceDetail && serviceDetail.parts) {
                  allParts.push({
                    serviceName: booking.bookingId,
                    serviceId: booking.service_id,
                    bookingId: booking.id,
                    customerName: booking.name,
                    parts: serviceDetail.parts || [],
                  });
                }
              } catch (err) {
                console.log('Could not fetch service details for booking:', booking.id);
              }
            }
          }
          setSpareParts(allParts);
        } catch (err) {
          console.error('Error fetching spare parts:', err);
        }

      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [user]);

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
        // Assuming API has getReviews endpoint
        // If not available, you may need to add it to api.ts
        const data = await apiService.getServices(); // Placeholder - update as needed
        setReviews(data.slice(0, 5)); // Mock reviews from services
      } catch (error) {
        console.error('Error fetching reviews:', error);
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
    }, 4000); // 🔥 4 seconds (different from why section)

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
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 120,
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

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/booking")}
            className="mt-6 bg-white px-6 py-3 rounded-full flex-row items-center"
          >
            <Ionicons name="car-outline" size={18} color={COLORS.primary} />
            <Text className="text-primary font-bold ml-2">
              Book Now
            </Text>
          </TouchableOpacity>

        </LinearGradient>
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
