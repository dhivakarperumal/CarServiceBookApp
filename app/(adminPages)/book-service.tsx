import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";

const BOOKING_STATUS = {
  BOOKED: "Booked",
  CALL_VERIFIED: "Call Verified",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  WAITING_SPARE: "Waiting for Spare",
  SERVICE_GOING: "Service Going on",
  BILL_PENDING: "Bill Pending",
  BILL_COMPLETED: "Bill Completed",
  SERVICE_COMPLETED: "Service Completed",
};

const VEHICLE_TYPES = ["car", "bike"];

const CAR_BRANDS = ["Honda", "Hyundai", "BMW", "Audi"];
const BIKE_BRANDS = ["Yamaha", "Royal Enfield", "Honda", "Bajaj", "TVS"];

const ISSUES = ["Engine Problem", "Brake Issue", "Electrical", "Others"];

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType,
  required,
}: any) => (
  <View className="mb-4">
    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 text-white font-bold ${
        error ? "border-red-500" : "border-slate-800"
      }`}
    />
    {error && (
      <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
        {error}
      </Text>
    )}
  </View>
);

const CustomSelect = ({
  label,
  value,
  options,
  onSelect,
  error,
  required,
}: any) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 flex-row justify-between items-center ${
          error ? "border-red-500" : "border-slate-800"
        }`}
      >
        <Text className={value ? "text-white font-bold" : "text-slate-500"}>
          {value || "Select option"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#0EA5E9"
        />
      </TouchableOpacity>

      {open && (
        <View className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl mt-1 z-50 shadow-2xl">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className="px-4 py-3 border-b border-slate-800 last:border-0"
            >
              <Text className="text-white font-bold capitalize">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
          {error}
        </Text>
      )}
    </View>
  );
};

const CustomTextarea = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  required,
}: any) => (
  <View className="mb-4">
    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      value={value}
      onChangeText={onChangeText}
      multiline
      numberOfLines={4}
      className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 text-white font-bold ${
        error ? "border-red-500" : "border-slate-800"
      }`}
    />
    {error && (
      <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
        {error}
      </Text>
    )}
  </View>
);

export default function BookService() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("car");
  const [serviceType, setServiceType] = useState("home");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    altPhone: "",
    brand: "",
    model: "",
    issue: "",
    otherIssue: "",
    vehicleNumber: "",
    address: "",
    location: "",
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [isChennai, setIsChennai] = useState(true);
  const [errors, setErrors] = useState<any>({});
  const [submitError, setSubmitError] = useState("");

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`,
        { headers: { "User-Agent": "CarServiceBookApp/1.0" } },
      );
      const data = await res.json();
      setLocationResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSelectLocation = (place: any) => {
    setFormData((prev) => ({
      ...prev,
      location: place.display_name,
    }));

    setLocationQuery(place.display_name);

    setCoords({
      lat: place.lat,
      lng: place.lon,
    });

    const city =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      "";

    setIsChennai(["chennai", "tirupattur"].includes(city.toLowerCase()));
    setLocationResults([]);
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setSubmitError("");

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use current location.",
        );
        setLocationLoading(false);
        return;
      }

      let locationPlatform = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = locationPlatform.coords;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: { "User-Agent": "CarServiceBookApp/1.0" } },
      );

      if (!res.ok) {
        Alert.alert(
          "Error",
          res.status === 429
            ? "Location service is busy. Please try again later."
            : `Service error: ${res.status}`,
        );
        return;
      }

      const data = await res.json();

      const city =
        data.address?.city || data.address?.town || data.address?.village || "";

      setFormData((prev) => ({
        ...prev,
        location: data.display_name,
      }));

      setLocationQuery(data.display_name);

      setCoords({
        lat: latitude,
        lng: longitude,
      });

      setIsChennai(["chennai", "tirupattur"].includes(city.toLowerCase()));
    } catch (error: any) {
      console.error("Location error:", error);
      Alert.alert(
        "Error",
        "Could not fetch current location. Please try again or search manually.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const generateBookingId = async () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `BS${randomSuffix}`;
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.issue) newErrors.issue = "Issue is required";

    if (serviceType === "home") {
      if (!formData.location) newErrors.location = "Location is required";
      if (!formData.address) newErrors.address = "Service address is required";

      if (!coords.lat || !coords.lng) {
        newErrors.location = "Please select location or use current location";
      } else if (!isChennai) {
        newErrors.location = "Service available only in Chennai & Tirupattur";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors and try again");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const bookingId = await generateBookingId();

      const bookingData = {
        bookingId,
        uid: "admin-created", // Since this is admin creating booking
        vehicleType: vehicleType,
        place: serviceType,

        // User details
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        altPhone: formData.altPhone || "",

        // Vehicle & service details
        brand: formData.brand,
        model: formData.model,
        issue: formData.issue,
        otherIssue: formData.otherIssue || "",
        vehicleNumber: formData.vehicleNumber,
        address: formData.address,
        location: formData.location,
        latitude: coords.lat,
        longitude: coords.lng,

        // Status tracking
        status: BOOKING_STATUS.BOOKED,
      };

      await api.post("/bookings/create", bookingData);

      Alert.alert(
        "Success",
        `Service booked successfully! Booking ID: ${bookingId}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setFormData({
                name: "",
                phone: "",
                email: "",
                altPhone: "",
                brand: "",
                model: "",
                issue: "",
                otherIssue: "",
                address: "",
                location: "",
              });
              setErrors({});
              setSubmitError("");
              setLocationQuery("");
              setCoords({ lat: null, lng: null });
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Booking failed:", error);
      setSubmitError("Something went wrong. Please try again.");
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to book service",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const brands = vehicleType === "car" ? CAR_BRANDS : BIKE_BRANDS;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="p-6 border-b border-white/5 bg-slate-950">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-3 bg-slate-900 rounded-2xl border border-slate-800"
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">
                Book Service
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-black">
                Schedule vehicle service booking
              </Text>
            </View>
          </View>
        </View>

        {/* FORM CARD */}
        <View className="p-6">
          <View className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
            {/* CUSTOMER DETAILS */}
            <Text className="text-lg font-black text-white mb-6">
              👤 Customer Details
            </Text>

            <CustomInput
              label="Full Name"
              placeholder="Enter Name"
              value={formData.name}
              onChangeText={(val) => handleChange("name", val)}
              error={errors.name}
              required
            />

            <CustomInput
              label="Email Address"
              placeholder="Enter Email Address"
              value={formData.email}
              onChangeText={(val) => handleChange("email", val)}
              error={errors.email}
              keyboardType="email-address"
              required
            />

            <CustomInput
              label="Phone Number"
              placeholder="Enter Phone Number"
              value={formData.phone}
              onChangeText={(val) => handleChange("phone", val)}
              error={errors.phone}
              keyboardType="phone-pad"
              required
            />

            <CustomInput
              label="Alternative Phone (Optional)"
              placeholder="Alternative Phone"
              value={formData.altPhone}
              onChangeText={(val) => handleChange("altPhone", val)}
            />

            {/* VEHICLE TYPE */}
            <Text className="text-lg font-black text-white mt-8 mb-6">
              🚗 Vehicle Type
            </Text>

            <View className="flex-row gap-4 mb-6">
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setVehicleType(type);
                    setFormData((prev) => ({ ...prev, brand: "", model: "" }));
                  }}
                  className={`flex-1 p-4 rounded-2xl border-2 ${
                    vehicleType === type
                      ? "border-sky-500 bg-sky-500/20"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  <Text
                    className={`text-center font-black uppercase ${
                      vehicleType === type ? "text-sky-500" : "text-slate-400"
                    }`}
                  >
                    {type === "car" ? "🚗 Car" : "🏍️ Bike"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* VEHICLE DETAILS */}
            <Text className="text-lg font-black text-white mt-8 mb-6">
              🔧 Vehicle Details
            </Text>

            <CustomSelect
              label={`${vehicleType === "car" ? "Car Brand" : "Bike Brand"}`}
              value={formData.brand}
              options={brands}
              onSelect={(val: string) => handleChange("brand", val)}
              error={errors.brand}
              required
            />

            <CustomInput
              label={`${vehicleType === "car" ? "Car Model" : "Bike Model"}`}
              placeholder={`Enter ${vehicleType} model`}
              value={formData.model}
              onChangeText={(val) => handleChange("model", val)}
              error={errors.model}
              required
            />

            <CustomSelect
              label="Issue"
              value={formData.issue}
              options={ISSUES}
              onSelect={(val: string) => handleChange("issue", val)}
              error={errors.issue}
              required
            />

            {formData.issue === "Others" && (
              <CustomInput
                label="Describe the Issue"
                placeholder="Describe the problem in detail..."
                value={formData.otherIssue}
                onChangeText={(val) => handleChange("otherIssue", val)}
                error={errors.otherIssue}
              />
            )}

            <CustomInput
              label="Vehicle Number"
              placeholder="TN 01 AB 1234"
              value={formData.vehicleNumber}
              onChangeText={(val) =>
                handleChange("vehicleNumber", val.toUpperCase())
              }
            />

            {/* SERVICE TYPE */}
            <Text className="text-lg font-black text-white mt-8 mb-6">
              📍 Service Type
            </Text>

            <View className="flex-row gap-4 mb-6">
              {[
                {
                  value: "home",
                  label: "🏠 Home Service",
                  desc: "Service at your location",
                },
                {
                  value: "shop",
                  label: "🏪 Shop Service",
                  desc: "Service at our shop",
                },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setServiceType(type.value)}
                  className={`flex-1 p-4 rounded-2xl border-2 ${
                    serviceType === type.value
                      ? "border-sky-500 bg-sky-500/20"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  <Text
                    className={`text-center font-black uppercase text-sm mb-1 ${
                      serviceType === type.value
                        ? "text-sky-500"
                        : "text-slate-400"
                    }`}
                  >
                    {type.label}
                  </Text>
                  <Text
                    className={`text-center text-[8px] font-bold ${
                      serviceType === type.value
                        ? "text-sky-400"
                        : "text-slate-500"
                    }`}
                  >
                    {type.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {serviceType === "home" && (
              <>
                {/* LOCATION SEARCH */}
                <Text className="text-lg font-black text-white mt-8 mb-6">
                  📍 Service Location
                </Text>

                <View className="mb-4">
                  <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Location <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="Search your area..."
                    placeholderTextColor="#64748b"
                    value={locationQuery}
                    onChangeText={(text) => {
                      setLocationQuery(text);
                      setCoords({ lat: null, lng: null });
                      searchLocation(text);
                    }}
                    className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 text-white font-bold ${
                      errors.location ? "border-red-500" : "border-slate-800"
                    }`}
                  />

                  {/* SEARCH RESULTS */}
                  {locationResults.length > 0 && (
                    <View className="mt-2 bg-slate-800 rounded-2xl border border-slate-700 max-h-48">
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {locationResults.map((place: any) => (
                          <TouchableOpacity
                            key={place.place_id}
                            onPress={() => handleSelectLocation(place)}
                            className="px-4 py-3 border-b border-slate-700 last:border-0"
                          >
                            <Text className="text-white font-bold text-sm">
                              {place.display_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* CURRENT LOCATION BUTTON */}
                  <TouchableOpacity
                    onPress={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="mt-4 p-3 rounded-2xl bg-slate-800 border border-slate-700 items-center"
                  >
                    {locationLoading ? (
                      <ActivityIndicator color="#0EA5E9" />
                    ) : (
                      <Text className="text-sky-500 font-black uppercase text-sm">
                        📍 Use Current Location
                      </Text>
                    )}
                  </TouchableOpacity>

                  {errors.location && (
                    <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                      {errors.location}
                    </Text>
                  )}
                </View>

                {/* SERVICE ADDRESS */}
                <CustomTextarea
                  label="Service Address"
                  placeholder="House / Street / Area / Landmark"
                  value={formData.address}
                  onChangeText={(val) => handleChange("address", val)}
                  error={errors.address}
                  required
                />
              </>
            )}

            {submitError && (
              <Text className="text-red-500 text-sm text-center mb-4 font-bold">
                {submitError}
              </Text>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="mt-8 p-4 rounded-2xl items-center justify-center shadow-lg"
              style={{
                backgroundColor: submitting ? "#374151" : "#0EA5E9",
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-lg font-black uppercase tracking-widest">
                  Book Service →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
