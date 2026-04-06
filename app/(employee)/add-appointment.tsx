import React, { useState, useEffect, useMemo } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import DateTimePicker from '@react-native-community/datetimepicker';

const SERVICE_PRICES = {
  "General Service": 2499,
  "Full Service": 4999,
  "Oil Change": 1499,
  "Brake Repair": 1999,
  "Engine Check": 2999,
  "AC Service": 2499,
  "Wheel Alignment": 999,
  "Custom Issue": 499,
};

const SectionTitle = ({ icon, title }: { icon: any, title: string }) => (
  <View className="flex-row items-center gap-3 mb-6 mt-8">
    <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center">
      <Ionicons name={icon} size={18} color="#0EA5E9" />
    </View>
    <Text className="text-lg font-black text-white uppercase tracking-widest">{title}</Text>
    <View className="flex-1 h-[1px] bg-slate-700 ml-3" />
  </View>
);

export default function AddAppointment() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    vehicleType: "Car",
    brand: "",
    model: "",
    registrationNumber: "",
    fuelType: "Petrol",
    currentMileage: "",
    serviceType: "General Service",
    otherIssue: "",
    pickupDrop: "No",
    preferredDate: new Date(),
    preferredTimeSlot: "Morning (9AM–12PM)",
    emergencyService: false,
    status: "Appointment Booked"
  });

  const estimatedCost = useMemo(() => {
    let cost = (SERVICE_PRICES as any)[formData.serviceType] || 0;
    if (formData.emergencyService) cost += 500;
    if (formData.pickupDrop === "Yes") cost += 300;
    return cost;
  }, [formData.serviceType, formData.emergencyService, formData.pickupDrop]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.registrationNumber) {
      Alert.alert("Missing Info", "Please fill name, phone and registration number.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        estimatedCost,
        preferredDate: formData.preferredDate.toISOString().split('T')[0],
        uid: "admin-created",
      };

      // Using /bookings or /appointments based on existing patterns
      await api.post("/bookings", payload);
      Alert.alert("Success", "Appointment created successfully!");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="bg-slate-800 p-6 pb-4 border-b border-slate-700 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-900">
           <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-black text-white">New Appointment</Text>
          <Text className="text-sky-500 font-bold text-[10px] uppercase tracking-widest">₹{estimatedCost} Estimated</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <SectionTitle icon="person" title="Customer Details" />
        
        <View className="gap-4">
          <View>
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name *</Text>
            <TextInput
              placeholder="Enter customer name"
              placeholderTextColor="#475569"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Mobile *</Text>
              <TextInput
                placeholder="Number"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">City</Text>
              <TextInput
                placeholder="City"
                placeholderTextColor="#475569"
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
              />
            </View>
          </View>

          <View>
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Address</Text>
            <TextInput
              placeholder="Resident address"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={2}
              value={formData.address}
              onChangeText={(t) => setFormData({ ...formData, address: t })}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold min-h-[80px]"
            />
          </View>
        </View>

        <SectionTitle icon="car" title="Vehicle Specs" />
        
        <View className="gap-4">
           <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Reg Number *</Text>
                <TextInput
                  placeholder="MH 12 AB 1234"
                  autoCapitalize="characters"
                  placeholderTextColor="#475569"
                  value={formData.registrationNumber}
                  onChangeText={(t) => setFormData({ ...formData, registrationNumber: t })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fuel Type</Text>
                <View className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden px-4">
                   {/* Simplified Select */}
                   <TextInput
                     value={formData.fuelType}
                     onChangeText={(t) => setFormData({ ...formData, fuelType: t })}
                     className="py-4 text-white font-bold"
                   />
                </View>
              </View>
           </View>

           <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Brand</Text>
                <TextInput
                  placeholder="e.g. Maruti"
                  placeholderTextColor="#475569"
                  value={formData.brand}
                  onChangeText={(t) => setFormData({ ...formData, brand: t })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Model</Text>
                <TextInput
                  placeholder="e.g. Swift"
                  placeholderTextColor="#475569"
                  value={formData.model}
                  onChangeText={(t) => setFormData({ ...formData, model: t })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                />
              </View>
           </View>
        </View>

        <SectionTitle icon="construct" title="Service Config" />

        <View className="gap-4">
           <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Service Type</Text>
              <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex-row justify-between items-center">
                 <Text className="text-white font-black">{formData.serviceType}</Text>
                 <Ionicons name="chevron-down" size={16} color="#475569" />
              </View>
           </View>

           <View className="flex-row items-center justify-between bg-slate-800 p-5 rounded-3xl border border-slate-700">
              <View>
                 <Text className="text-white font-black">Emergency Service</Text>
                 <Text className="text-slate-500 text-[10px] mt-1 uppercase font-bold">+₹500 Premium</Text>
              </View>
              <Switch 
                value={formData.emergencyService} 
                onValueChange={(v) => setFormData({ ...formData, emergencyService: v })}
                trackColor={{ false: "#334155", true: "#0EA5E9" }}
              />
           </View>

           <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4"
              >
                 <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</Text>
                 <Text className="text-white font-bold">{formData.preferredDate.toDateString()}</Text>
              </TouchableOpacity>
              <View className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                 <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Slot</Text>
                 <Text className="text-white font-bold">Morning</Text>
              </View>
           </View>
           
           {showDatePicker && (
             <DateTimePicker
               value={formData.preferredDate}
               mode="date"
               onChange={(event, date) => {
                 setShowDatePicker(false);
                 if (date) setFormData({ ...formData, preferredDate: date });
               }}
             />
           )}

           <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Detailed Issue</Text>
              <TextInput
                placeholder="Describe specific problems..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={4}
                value={formData.otherIssue}
                onChangeText={(t) => setFormData({ ...formData, otherIssue: t })}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold min-h-[120px]"
              />
           </View>
        </View>

        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={submitting}
          className={`w-full py-5 bg-sky-500 rounded-3xl items-center mt-10 mb-20 ${submitting ? 'opacity-50' : ''}`}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-[2px]">Confirm Booking</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
