import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { api, apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import * as Location from 'expo-location';

const APPOINTMENT_STATUS = {
  BOOKED: "Appointment Booked",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const SERVICE_PRICES: any = {
  "General Service": 2499,
  "Full Service": 4999,
  "Oil Change": 1499,
  "Brake Repair": 1999,
  "Engine Check": 2999,
  "AC Service": 2499,
  "Wheel Alignment": 999,
  "Custom Issue": 499,
};

const SectionTitle = ({ icon, title }: { icon: string, title: string }) => (
  <View className="flex-row items-center gap-3 mb-6 mt-8">
     <Text className="text-xl">{icon}</Text>
     <Text className="text-sm font-black text-sky-400 uppercase tracking-widest">{title}</Text>
     <View className="flex-1 h-[1px] bg-sky-400/20 ml-3" />
  </View>
);

const CustomInput = ({ label, required, error, disabled, ...props }: any) => (
  <View className="mb-4">
    <Text className="mb-1.5 text-[10px] uppercase font-black text-slate-500 tracking-[1px] ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      {...props}
      editable={!disabled}
      placeholderTextColor="#475569"
      className={`w-full bg-white/[0.05] border rounded-2xl px-5 py-4 text-white font-bold ${error ? 'border-red-500/50' : 'border-white/10'}`}
    />
    {error ? <Text className="mt-1 text-[10px] font-bold text-red-500 ml-1">{error}</Text> : null}
  </View>
);

const CustomSelect = ({ label, required, value, options, onSelect, error }: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[10px] uppercase font-black text-slate-500 tracking-[1px] ml-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className={`w-full bg-white/[0.05] border rounded-2xl px-5 py-4 flex-row justify-between items-center ${error ? 'border-red-500/50' : 'border-white/10'}`}
      >
        <Text className={`font-bold ${value ? 'text-white' : 'text-slate-500'}`}>{value || `Select ${label}`}</Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>
      {error ? <Text className="mt-1 text-[10px] font-bold text-red-500 ml-1">{error}</Text> : null}
      
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setVisible(false)} 
          className="flex-1 bg-black/80 justify-center p-6"
        >
          <View className="bg-slate-900 border border-white/10 rounded-3xl p-6">
            <Text className="text-white font-black uppercase tracking-widest mb-6">Select {label}</Text>
            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              {options.map((opt: string) => (
                <TouchableOpacity 
                  key={opt} 
                  onPress={() => { onSelect(opt); setVisible(false); }}
                  className="py-4 border-b border-white/5 last:border-0"
                >
                  <Text className="text-white font-bold">{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function AppointmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    vehicleType: "Car",
    brand: "",
    model: "",
    registrationNumber: "",
    fuelType: "Petrol",
    yearOfManufacture: "",
    currentMileage: "",
    serviceType: "General Service",
    otherIssue: "",
    pickupDrop: "No",
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTimeSlot: "Morning (9AM–12PM)",
    serviceMode: "At Service Center",
    pickupAddress: "",
    location: "",
    paymentMode: "Pay After Service",
    couponCode: "",
    notes: "",
    emergencyService: false,
    termsAccepted: true,
  });

  const [errors, setErrors] = useState<any>({});
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lat: null as any, lng: null as any });
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.username || "",
        email: user.email || "",
        phone: user.mobile || ""
      }));
    }
  }, [user]);

  const searchLocation = async (query: string) => {
    setLocationQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 3) { setLocationResults([]); return; }
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, { 
          headers: { 'User-Agent': 'CarServiceBookApp/1.0' }
        });
        if (!res.ok) throw new Error("Search service busy");
        const data = await res.json();
        setLocationResults(data);
      } catch (e: any) { 
        console.warn("Search failed", e.message); 
      }
    }, 600);
  };

  const handleSelectLocation = (p: any) => {
    const city = p.address?.city || p.address?.town || p.address?.village || "";
    const pincode = p.address?.postcode || "";
    setFormData(prev => ({
      ...prev,
      location: p.display_name,
      city,
      pincode
    }));
    setLocationQuery(p.display_name);
    setCoords({ lat: p.lat, lng: p.lon });
    setLocationResults([]);
  };

  const estimatedCost = useMemo(() => {
    let cost = SERVICE_PRICES[formData.serviceType] || 0;
    if (formData.emergencyService) cost += 500;
    if (formData.pickupDrop === "Yes") cost += 300;
    return cost;
  }, [formData.serviceType, formData.emergencyService, formData.pickupDrop]);

  const handleUseLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission", "Location permission denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`, {
        headers: { 'User-Agent': 'CarServiceBookApp/1.0' }
      });
      if (!res.ok) throw new Error("Location service unavailable");
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        location: data.display_name,
        city: data.address?.city || data.address?.town || "",
        pincode: data.address?.postcode || ""
      }));
      setLocationQuery(data.display_name);
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      console.log("Location fetch error:", e.message);
      Alert.alert("Error", "Could not fetch address. Please enter manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.registrationNumber) {
      Alert.alert("Required", "Please fill name, phone and registration number.");
      return;
    }

    try {
      setSubmitting(true);
      const bookingId = `AP${Math.floor(100000 + Math.random() * 900000)}`;
      
      const appointmentData = {
        ...formData,
        bookingId,
        uid: user?.id || user?.uid || (user as any)?._id,
        latitude: coords.lat || null,
        longitude: coords.lng || null,
        estimatedCost: estimatedCost || 0,
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
        status: APPOINTMENT_STATUS.BOOKED,
        
        // Extended Mapping for Backend Filtering (Fix for 'store booking' issue)
        customer_name: formData.name,
        name: formData.name,
        mobile: formData.phone,
        phone: formData.phone,
        vehicleNumber: formData.registrationNumber,
        vehicle_number: formData.registrationNumber,
        issue: formData.serviceType || formData.otherIssue || "General Service",
        vehicleType: formData.vehicleType ? formData.vehicleType.toLowerCase() : 'car',
        addVehicle: false,
        bookingType: "Appointment",
        is_appointment: true
      };

      console.log("Submitting Appointment Data via createAppointment:", appointmentData);
      
      await apiService.createAppointment(appointmentData);

      Alert.alert("Success", "Service Appointment Scheduled Successfully!");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.error("Appointment Submission Error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to schedule appointment.";
      Alert.alert("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0b]">
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-white/5">
        <View>
          <Text className="text-xl font-black text-white tracking-tighter">Service Appointment</Text>
          <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Premium Booking Desk</Text>
        </View>
        <View className="bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-2xl items-end">
          <Text className="text-[8px] font-black text-sky-500 uppercase tracking-widest leading-none mb-1">Est Cost</Text>
          <Text className="text-lg font-black text-white leading-none">₹{estimatedCost}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
          
          <View className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 mb-20 shadow-2xl">
            
            {/* CUSTOMER DETAILS */}
            <SectionTitle icon="🧾" title="Customer Details" />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <CustomInput label="Full Name" value={formData.name} onChangeText={(t: string) => setFormData({...formData, name: t})} required />
              </View>
              <View className="flex-1">
                <CustomInput label="Mobile" value={formData.phone} onChangeText={(t: string) => setFormData({...formData, phone: t})} required keyboardType="phone-pad" />
              </View>
            </View>
            <CustomInput label="Email Address" value={formData.email} onChangeText={(t: string) => setFormData({...formData, email: t})} keyboardType="email-address" />
            
            <View className="mb-4">
               <Text className="mb-1.5 text-[10px] uppercase font-black text-slate-500 tracking-[1px] ml-1">Search Location</Text>
               <View className="relative">
                  <TextInput
                    value={locationQuery}
                    onChangeText={searchLocation}
                    placeholder="Search area..."
                    placeholderTextColor="#475569"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold"
                  />
                  <TouchableOpacity 
                    onPress={handleUseLocation}
                    disabled={locationLoading}
                    className="absolute right-3 top-3.5"
                  >
                    {locationLoading ? <ActivityIndicator size="small" color="#0EA5E9" /> : <Ionicons name="locate-outline" size={24} color="#0EA5E9" />}
                  </TouchableOpacity>
               </View>
               {locationResults.length > 0 && (
                  <View className="mt-2 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden">
                    {locationResults.map((p, idx) => (
                      <TouchableOpacity 
                        key={p.place_id || idx} 
                        onPress={() => handleSelectLocation(p)}
                        className="px-5 py-4 border-b border-white/5"
                      >
                        <Text className="text-gray-400 text-xs">{p.display_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <CustomInput label="City" value={formData.city} onChangeText={(t: string) => setFormData({...formData, city: t})} />
              </View>
              <View className="flex-1">
                <CustomInput label="Pincode" value={formData.pincode} onChangeText={(t: string) => setFormData({...formData, pincode: t})} keyboardType="number-pad" />
              </View>
            </View>
            <CustomInput label="Complete Address" value={formData.address} onChangeText={(t: string) => setFormData({...formData, address: t})} multiline numberOfLines={3} />

            {/* VEHICLE DETAILS */}
            <SectionTitle icon="🚘" title="Vehicle Details" />
            <CustomSelect 
              label="Vehicle Type" 
              value={formData.vehicleType} 
              onSelect={(v: string) => setFormData({...formData, vehicleType: v})}
              options={["Car", "Bike", "SUV"]}
              required
            />
            <View className="flex-row gap-4">
               <View className="flex-1">
                <CustomInput label="Brand" value={formData.brand} onChangeText={(t: string) => setFormData({...formData, brand: t})} placeholder="Toyota..." />
               </View>
               <View className="flex-1">
                <CustomInput label="Model" value={formData.model} onChangeText={(t: string) => setFormData({...formData, model: t})} placeholder="i20..." />
               </View>
            </View>
            <CustomInput label="Reg Number" value={formData.registrationNumber} onChangeText={(t: string) => setFormData({...formData, registrationNumber: t.toUpperCase()})} required placeholder="TN 01 AB 1234" />
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <CustomSelect label="Fuel" value={formData.fuelType} onSelect={(v: string) => setFormData({...formData, fuelType: v})} options={["Petrol", "Diesel", "EV", "Hybrid"]} />
              </View>
              <View className="flex-1">
                <CustomInput label="Year" value={formData.yearOfManufacture} onChangeText={(t: string) => setFormData({...formData, yearOfManufacture: t})} keyboardType="number-pad" />
              </View>
            </View>
            <CustomInput label="Mileage (KM)" value={formData.currentMileage} onChangeText={(t: string) => setFormData({...formData, currentMileage: t})} keyboardType="number-pad" />

            {/* SERVICE DETAILS */}
            <SectionTitle icon="🛠️" title="Service Details" />
            <CustomSelect 
              label="Service Type" 
              value={formData.serviceType} 
              onSelect={(v: string) => setFormData({...formData, serviceType: v})}
              options={Object.keys(SERVICE_PRICES)}
              required
            />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <CustomSelect label="Pickup" value={formData.pickupDrop} onSelect={(v: string) => setFormData({...formData, pickupDrop: v})} options={["No", "Yes"]} />
              </View>
              <View className="flex-2 flex-row items-center gap-3 bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                 <Switch value={formData.emergencyService} onValueChange={(v) => setFormData({...formData, emergencyService: v})} trackColor={{ false: '#1e293b', true: '#0EA5E9' }} />
                 <Text className="text-white font-black text-[10px] uppercase">Emergency (+₹500)</Text>
              </View>
            </View>
            <View className="mt-4">
              <Text className="mb-1.5 text-[10px] uppercase font-black text-slate-500 tracking-[1px] ml-1">Problem Description</Text>
              <TextInput
                value={formData.otherIssue}
                onChangeText={(t: string) => setFormData({...formData, otherIssue: t})}
                placeholder="Explain the issue clearly..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={4}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold min-h-[100px]"
              />
            </View>

            {/* SCHEDULING */}
            <SectionTitle icon="📅" title="Appointment Scheduling" />
            <View className="flex-row gap-4 mb-2">
              <View className="flex-1">
                <CustomInput label="Date" value={formData.preferredDate} onChangeText={(t: string) => setFormData({...formData, preferredDate: t})} required placeholder="YYYY-MM-DD" />
              </View>
              <View className="flex-1">
                <CustomSelect label="Time Slot" value={formData.preferredTimeSlot} onSelect={(v: string) => setFormData({...formData, preferredTimeSlot: v})} options={["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–7PM)"]} required />
              </View>
            </View>

            {/* MODE & PAYMENT */}
            <SectionTitle icon="💳" title="Preferences" />
            <CustomSelect label="Mode" value={formData.serviceMode} onSelect={(v: string) => setFormData({...formData, serviceMode: v})} options={["At Service Center", "Doorstep Service"]} />
            {formData.serviceMode === "Doorstep Service" && (
              <CustomInput label="Pickup Address" value={formData.pickupAddress} onChangeText={(t: string) => setFormData({...formData, pickupAddress: t})} />
            )}
            <CustomSelect label="Payment" value={formData.paymentMode} onSelect={(v: string) => setFormData({...formData, paymentMode: v})} options={["Pay After Service", "Pay Online"]} />
            <CustomInput label="Coupon Code" value={formData.couponCode} onChangeText={(t: string) => setFormData({...formData, couponCode: t})} placeholder="CARCARE10" />
            <CustomInput label="Special Notes" value={formData.notes} onChangeText={(t: string) => setFormData({...formData, notes: t})} multiline />

            {/* BUTTON */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={submitting}
              className={`w-full py-6 rounded-[2rem] items-center mt-12 ${submitting ? 'bg-slate-800' : 'bg-sky-500'}`}
            >
              {submitting ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-black uppercase tracking-[3px]">Schedule Appointment →</Text>
              )}
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center gap-2">
               <Ionicons name="shield-checkmark" size={16} color="#475569" />
               <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">I agree to the Terms & Conditions</Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
