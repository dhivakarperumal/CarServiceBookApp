import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
  <View className="mb-5">
    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">
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
      className={`w-full bg-slate-900/50 rounded-2xl border px-5 py-4 text-white font-bold text-[15px] ${
        error ? "border-red-500" : "border-white/10"
      }`}
    />
    {error && (
      <Text className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">
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
    <View className="mb-5">
      <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className={`w-full bg-slate-900/50 rounded-2xl border px-5 py-4 flex-row justify-between items-center transition-all ${
          error ? "border-red-500" : "border-white/10"
        }`}
      >
        <Text className={`font-bold text-[15px] ${value ? "text-white" : "text-slate-500"}`}>
          {value || "Select option"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#0EA5E9"
        />
      </TouchableOpacity>

      {open && (
        <View className="absolute top-full left-0 right-0 bg-slate-900 border border-white/10 rounded-2xl mt-2 z-50 shadow-2xl overflow-hidden">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className="px-5 py-4 border-b border-white/5 last:border-0 active:bg-slate-800/50"
            >
              <Text className="text-white font-bold capitalize text-[15px]">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">
          {error}
        </Text>
      )}
    </View>
  );
};

export default function AddServiceVehicle() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      <SafeAreaView className="flex-1 bg-[#0F172A]">
        <View className="flex-1 items-center justify-center px-6 py-8">
          {/* Success Icon */}
          <View className="w-28 h-28 rounded-full bg-emerald-500/15 items-center justify-center mb-8 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
            <Ionicons name="checkmark-done" size={56} color="#10B981" />
          </View>

          {/* Success Title */}
          <Text className="text-3xl font-black text-white text-center mb-2 uppercase tracking-tight">
            Service Vehicle Added!
          </Text>

          {/* Success Description */}
          <Text className="text-slate-400 text-center text-[15px] mb-10 leading-relaxed px-4">
            The vehicle has been registered and a customer account was created automatically.
          </Text>

          {/* Booking ID Card */}
          <View className="w-full bg-gradient-to-b from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl p-8 mb-12 shadow-2xl items-center">
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3">
              Booking Identifier
            </Text>
            <Text className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 tracking-wider">
              {success}
            </Text>
          </View>

          {/* Action Buttons */}
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
            className="w-full mb-4 rounded-2xl overflow-hidden shadow-lg"
          >
            <LinearGradient
              colors={["#2563EB", "#0EA5E9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-6 py-5 items-center"
            >
              <Text className="text-white font-black text-base uppercase tracking-widest">
                Add Another Vehicle
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(admin)/bookings")}
            className="w-full px-6 py-5 rounded-2xl border border-white/10 bg-slate-900/30 items-center"
          >
            <Text className="text-slate-300 font-black text-base uppercase tracking-widest">
              View All Bookings
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ===== FORM ===== */
  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="px-6 pt-4 pb-6 border-b border-white/5">
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-3 bg-slate-900/50 rounded-2xl border border-white/10 active:bg-slate-800/50"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">
                Add Service Vehicle
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-black">
                Register vehicle & auto-create customer login
              </Text>
            </View>
          </View>
        </View>

        {/* FORM CARD */}
        <View className="px-6 py-8">
          <View className="bg-gradient-to-b from-slate-900/60 to-slate-900/30 rounded-3xl border border-white/5 p-8 shadow-2xl">
            {/* CUSTOMER DETAILS SECTION */}
            <View className="mb-8">
              <View className="flex-row items-center gap-3 mb-7">
                <View className="w-8 h-8 rounded-full bg-sky-500/20 items-center justify-center border border-sky-500/30">
                  <Ionicons name="person" size={16} color="#0EA5E9" />
                </View>
                <Text className="text-base font-black text-white uppercase tracking-wider">
                  Customer Details
                </Text>
              </View>

              <CustomInput
                label="Customer Name"
                placeholder="e.g. Rajan Kumar"
                value={form.name}
                onChangeText={(val: string) => handleChange("name", val)}
                error={errors.name}
                required
              />

              <CustomInput
                label="Phone Number"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChangeText={(val: string) => handleChange("phone", val)}
                error={errors.phone}
                keyboardType="phone-pad"
                required
              />

              <CustomInput
                label="Customer Email (User Login)"
                placeholder="customer@email.com"
                value={form.email}
                onChangeText={(val: string) => handleChange("email", val)}
                error={errors.email}
                keyboardType="email-address"
                required
              />

              <CustomInput
                label="Service Address"
                placeholder="House / Street / Area"
                value={form.address}
                onChangeText={(val: string) => handleChange("address", val)}
              />
            </View>

            {/* DIVIDER */}
            <View className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

            {/* VEHICLE DETAILS SECTION */}
            <View className="mb-8">
              <View className="flex-row items-center gap-3 mb-7">
                <View className="w-8 h-8 rounded-full bg-sky-500/20 items-center justify-center border border-sky-500/30">
                  <Ionicons name="car" size={16} color="#0EA5E9" />
                </View>
                <Text className="text-base font-black text-white uppercase tracking-wider">
                  Vehicle Details
                </Text>
              </View>

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
                onChangeText={(val: string) =>
                  handleChange("vehicleNumber", val.toUpperCase())
                }
                error={errors.vehicleNumber}
                required
              />

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <CustomInput
                    label="Brand"
                    placeholder="e.g. Honda"
                    value={form.brand}
                    onChangeText={(val: string) => handleChange("brand", val)}
                  />
                </View>
                <View className="flex-1">
                  <CustomInput
                    label="Model"
                    placeholder="e.g. City"
                    value={form.model}
                    onChangeText={(val: string) => handleChange("model", val)}
                  />
                </View>
              </View>
            </View>

            {/* DIVIDER */}
            <View className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

            {/* SERVICE ISSUE SECTION */}
            <View>
              <View className="flex-row items-center gap-3 mb-7">
                <View className="w-8 h-8 rounded-full bg-sky-500/20 items-center justify-center border border-sky-500/30">
                  <Ionicons name="hammer-outline" size={16} color="#0EA5E9" />
                </View>
                <Text className="text-base font-black text-white uppercase tracking-wider">
                  Service Issue
                </Text>
              </View>

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
                  onChangeText={(val: string) => handleChange("otherIssue", val)}
                  multiline
                  numberOfLines={3}
                />
              )}
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="mt-10 rounded-2xl overflow-hidden shadow-xl active:shadow-lg"
            >
              <LinearGradient
                colors={submitting ? ["#64748B", "#475569"] : ["#2563EB", "#0EA5E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-6 py-5 items-center justify-center"
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-base font-black uppercase tracking-wider">
                    Add Service Vehicle →
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for scroll */}
        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
