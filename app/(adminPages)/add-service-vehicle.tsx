import { Ionicons } from "@expo/vector-icons";
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

const VEHICLE_TYPES = [
  "Two Wheeler",
  "Four Wheeler",
  "Three Wheeler",
  "Heavy Vehicle",
];

const ISSUE_OPTIONS = [
  "Engine Problem",
  "Brake Issue",
  "Tyre / Wheel",
  "Electrical Problem",
  "AC Not Working",
  "Battery Issue",
  "Oil Leak",
  "Suspension / Steering",
  "Others",
];

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline,
  numberOfLines,
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
      multiline={multiline}
      numberOfLines={numberOfLines}
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

export default function AddServiceVehicle() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    vehicleType: "",
    vehicleNumber: "",
    brand: "",
    model: "",
    issue: "",
    otherIssue: "",
  });

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = "Customer name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (form.phone && !/^\d{6,15}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid phone number";
    if (!form.email.trim())
      errs.email = "Email is required for creating customer login";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address";
    if (!form.vehicleType) errs.vehicleType = "Vehicle type is required";
    if (!form.vehicleNumber.trim())
      errs.vehicleNumber = "Vehicle number is required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const now = new Date();
    const serviceData = {
      bookingId: `BKG${now.getTime()}`, // Generate unique ID
      uid: "admin-created",
      name: form.name,
      phone: form.phone,
      email: form.email || "N/A",
      address: form.address || "Shop Address",
      location: "Shop",
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      brand: form.brand || "Unknown",
      model: form.model || "Unknown",
      issue:
        form.issue === "Others"
          ? form.otherIssue
          : form.issue || "General Service",
      status: "Booked",
      createdDate: now.toLocaleDateString("en-GB"),
      createdTime: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      setSubmitting(true);

      // 1. Create Booking
      const bookRes = await api.post("/bookings/create", serviceData);
      const bookingId = serviceData.bookingId;

      // 2. Automatically Create User Account (ignore error if already exists)
      if (form.email && form.phone) {
        try {
          await api.post("/auth/register", {
            username: form.name,
            email: form.email,
            mobile: form.phone,
            password: form.phone, // Phone number is password
            role: "customer",
          });
          Alert.alert("Success", "Customer account created automatically");
        } catch (authErr) {
          // If email exists, we just skip account creation
          console.log("Account already exists or failed to create", authErr);
        }
      }

      setSuccess(bookingId);
      Alert.alert("Success", `Service added! ID: ${bookingId}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to add service vehicle",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== SUCCESS STATE ===== */
  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-black text-white mb-2">
            Service Vehicle Added!
          </Text>
          <Text className="text-slate-500 text-sm mb-1 font-bold">
            Booking ID
          </Text>
          <Text className="text-3xl font-black text-sky-500 mb-8">
            {success}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setSuccess(null);
                setForm({
                  name: "",
                  phone: "",
                  email: "",
                  address: "",
                  vehicleType: "",
                  vehicleNumber: "",
                  brand: "",
                  model: "",
                  issue: "",
                  otherIssue: "",
                });
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700"
            >
              <Text className="text-white font-bold">Add Another</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/bookings")}
              className="px-6 py-3 rounded-xl bg-sky-500"
            >
              <Text className="text-white font-bold">View Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ===== FORM ===== */
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
                Add Service Vehicle
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-black">
                Register vehicle for service (Auto-creates login using Email &
                Phone)
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
              label="Customer Name"
              placeholder="e.g. Rajan Kumar"
              value={form.name}
              onChangeText={(val) => handleChange("name", val)}
              error={errors.name}
              required
            />

            <CustomInput
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChangeText={(val) => handleChange("phone", val)}
              error={errors.phone}
              keyboardType="phone-pad"
              required
            />

            <CustomInput
              label="Customer Email (User Login)"
              placeholder="customer@email.com"
              value={form.email}
              onChangeText={(val) => handleChange("email", val)}
              error={errors.email}
              keyboardType="email-address"
              required
            />

            <CustomInput
              label="Service Address"
              placeholder="House / Street / Area"
              value={form.address}
              onChangeText={(val) => handleChange("address", val)}
              error={errors.address}
            />

            {/* VEHICLE DETAILS */}
            <Text className="text-lg font-black text-white mt-8 mb-6">
              🚗 Vehicle Details
            </Text>

            <CustomSelect
              label="Vehicle Type"
              value={form.vehicleType}
              options={VEHICLE_TYPES}
              onSelect={(val: string) => handleChange("vehicleType", val)}
              error={errors.vehicleType}
              required
            />

            <CustomInput
              label="Vehicle Number"
              placeholder="e.g. TN01AB1234"
              value={form.vehicleNumber}
              onChangeText={(val) =>
                handleChange("vehicleNumber", val.toUpperCase())
              }
              error={errors.vehicleNumber}
              required
            />

            <CustomInput
              label="Brand"
              placeholder="e.g. Honda, Hyundai, BMW"
              value={form.brand}
              onChangeText={(val) => handleChange("brand", val)}
              error={errors.brand}
            />

            <CustomInput
              label="Model"
              placeholder="e.g. City, Creta, 3 Series"
              value={form.model}
              onChangeText={(val) => handleChange("model", val)}
              error={errors.model}
            />

            {/* ISSUE */}
            <Text className="text-lg font-black text-white mt-8 mb-6">
              🔧 Service Issue
            </Text>

            <CustomSelect
              label="Select Issue"
              value={form.issue}
              options={ISSUE_OPTIONS}
              onSelect={(val: string) => handleChange("issue", val)}
              error={errors.issue}
            />

            {form.issue === "Others" && (
              <CustomInput
                label="Describe the Issue"
                placeholder="Describe the problem in detail..."
                value={form.otherIssue}
                onChangeText={(val) => handleChange("otherIssue", val)}
                error={errors.otherIssue}
                multiline
                numberOfLines={3}
              />
            )}

            {/* SUBMIT */}
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
                  Add Service Vehicle →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
