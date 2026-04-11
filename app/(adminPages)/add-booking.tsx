import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

/* 🎨 CONFIG */
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
  required,
  value,
  onChangeText,
  placeholder,
  ...props
}: any) => (
  <View className="mb-4">
    <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-2 ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      className="bg-card-light border border-slate-700 rounded-3xl px-6 py-4 text-white font-bold text-sm"
      {...props}
    />
  </View>
);

const CustomSelect = ({
  label,
  options,
  value,
  onSelect,
  placeholder,
}: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="bg-card-light border border-slate-700 rounded-3xl px-6 py-4 flex-row justify-between items-center"
      >
        <Text
          className={
            value
              ? "text-white font-bold text-sm"
              : "text-text-secondary font-bold text-sm"
          }
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {visible && (
        <View className="mt-2 bg-card border border-slate-700 rounded-3xl overflow-hidden">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setVisible(false);
              }}
              className="p-4 border-b border-slate-700"
            >
              <Text className="text-white font-bold text-sm">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function AdminAddBooking() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.phone ||
      !form.email ||
      !form.vehicleType ||
      !form.vehicleNumber
    ) {
      Alert.alert(
        "Required Fields",
        "Please fill name, phone, email, vehicle type and number.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date();
      const bookingId = `BKG${now.getTime()}`;

      const serviceData = {
        bookingId,
        uid: "admin-created",
        name: form.name,
        phone: form.phone,
        email: form.email,
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

      // 1. Create Booking
      await apiService.createBooking(serviceData);

      // 2. Auto-Create Account
      try {
        await apiService.register({
          username: form.name,
          email: form.email,
          mobile: form.phone,
          password: form.phone, // Phone as password
          role: "customer",
        });
      } catch (authErr) {
        console.log("Account creation skipped or failed", authErr);
      }

      setSuccessId(bookingId);
      Alert.alert(
        "Success",
        `Booking created and customer account registered! ID: ${bookingId}`,
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to register vehicle",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-8">
        <Stack.Screen
          options={{
            title: "Booking Created",
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: "900", fontSize: 16 },
          }}
        />
        <View className="mb-8">
          <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
            Sales Management
          </Text>
          <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
            Booking Created
          </Text>
        </View>

        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6 border border-primary/20">
          <Ionicons name="checkmark-done" size={40} color={COLORS.primary} />
        </View>
        <Text className="text-white font-black text-2xl uppercase tracking-tighter text-center mb-2">
          Vehicle Registered
        </Text>
        <Text className="text-text-secondary text-sm text-center mb-10 leading-relaxed px-4">
          The service vehicle has been added to the queue and a customer account
          was created automatically.
        </Text>

        <View className="bg-card border border-slate-700 p-6 rounded-3xl w-full items-center mb-12 shadow-sm">
          <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-2">
            Booking Identifier
          </Text>
          <Text className="text-primary font-black text-2xl tracking-widest">
            {successId}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSuccessId(null);
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
          className="bg-primary w-full py-5 rounded-3xl items-center shadow-2xl shadow-primary/5 mb-4"
        >
          <Text className="text-black font-black uppercase tracking-widest text-[10px]">
            Register Another Vehicle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(admin)/bookings")}
          className="bg-card-light w-full py-5 rounded-3xl items-center border border-slate-700"
        >
          <Text className="text-text-secondary font-black uppercase tracking-widest text-[10px]">
            Return to Bookings
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Add Booking",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-6">
            <View className="mb-8">
              <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
                Sales Management
              </Text>
              <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
                Add Booking
              </Text>
            </View>

            <View className="bg-card border border-slate-700 p-8 rounded-3xl">
              <View className="gap-6">
                <View className="flex-row items-center gap-2 mb-6">
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                    Customer Details
                  </Text>
                </View>

                <CustomInput
                  label="Customer Name"
                  placeholder="e.g. Rajan Kumar"
                  value={form.name}
                  onChangeText={(val: string) => handleChange("name", val)}
                  required
                />

                <CustomInput
                  label="Phone Number"
                  placeholder="9876543210"
                  keyboardType="numeric"
                  value={form.phone}
                  onChangeText={(val: string) => handleChange("phone", val)}
                  required
                />

                <CustomInput
                  label="Customer Email"
                  placeholder="customer@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(val: string) => handleChange("email", val)}
                  required
                />

                <CustomInput
                  label="Service Address"
                  placeholder="House / Street / Area"
                  value={form.address}
                  onChangeText={(val: string) => handleChange("address", val)}
                />

                <View className="h-px bg-slate-700 my-6" />

                <View className="flex-row items-center gap-2 mb-6">
                  <Ionicons
                    name="car-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                    Vehicle Details
                  </Text>
                </View>

                <CustomSelect
                  label="Vehicle Type"
                  options={VEHICLE_TYPES}
                  value={form.vehicleType}
                  onSelect={(val: string) => handleChange("vehicleType", val)}
                  placeholder="Select Type"
                />

                <CustomInput
                  label="Vehicle Number"
                  placeholder="TN01AB1234"
                  autoCapitalize="characters"
                  value={form.vehicleNumber}
                  onChangeText={(val: string) =>
                    handleChange("vehicleNumber", val)
                  }
                  required
                />

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <CustomInput
                      label="Brand"
                      placeholder="Honda"
                      value={form.brand}
                      onChangeText={(val: string) => handleChange("brand", val)}
                    />
                  </View>
                  <View className="flex-1">
                    <CustomInput
                      label="Model"
                      placeholder="City"
                      value={form.model}
                      onChangeText={(val: string) => handleChange("model", val)}
                    />
                  </View>
                </View>

                <CustomSelect
                  label="Select Issue"
                  options={ISSUE_OPTIONS}
                  value={form.issue}
                  onSelect={(val: string) => handleChange("issue", val)}
                  placeholder="General Service"
                />

                {form.issue === "Others" && (
                  <CustomInput
                    label="Describe the Issue"
                    placeholder="Details..."
                    multiline
                    numberOfLines={3}
                    value={form.otherIssue}
                    onChangeText={(val: string) =>
                      handleChange("otherIssue", val)
                    }
                  />
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className={`mt-6 rounded-3xl overflow-hidden ${submitting ? "opacity-50" : ""}`}
                >
                  <View className="bg-primary p-5 items-center">
                    {submitting ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <Text className="text-black font-black uppercase tracking-widest text-[10px]">
                        Add Service Vehicle →
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
