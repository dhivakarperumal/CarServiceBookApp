import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const BOOKING_STATUS = { BOOKED: "Booked" };
const APPOINTMENT_STATUS = { BOOKED: "Booked" }; // Changed from "Appointment Booked" to "Booked" for consistency

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

const CustomInput = ({ label, required, error, disabled, ...props }: any) => (
  <View className="mb-4">
    <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">
      {label} {required && <Text className="text-error">*</Text>}
    </Text>
    <TextInput
      {...props}
      editable={!disabled}
      placeholderTextColor="#6b7280"
      className={`w-full bg-card-light rounded-xl border px-5 py-4 text-text-primary ${error ? 'border-red-400' : 'border-white/20'} ${disabled ? 'opacity-50' : ''}`}
    />
    {error ? <Text className="mt-1 text-xs text-error ml-1">{error}</Text> : null}
  </View>
);

const CustomSelect = ({ label, required, error, options, value, onSelect, placeholder }: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">
        {label} {required && <Text className="text-error">*</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`w-full bg-card-light rounded-xl border px-5 py-4 flex-row justify-between items-center ${error ? 'border-red-400' : 'border-white/20'}`}
      >
        <Text className={value ? "text-text-primary" : "text-gray-500"}>{value ? value : placeholder || `Select ${label}`}</Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>
      {error ? <Text className="mt-1 text-xs text-error ml-1">{error}</Text> : null}

      <Modal visible={visible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="w-full bg-modal rounded-2xl p-4 border border-white/10">
            <Text className="text-text-primary text-lg font-bold mb-4 px-2">Select {label}</Text>
            <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
              {options.map((opt: string) => (
                <TouchableOpacity key={opt} className="py-4 px-2 border-b border-white/5" onPress={() => { onSelect(opt); setVisible(false); }}>
                  <Text className="text-text-primary text-base">{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setVisible(false)} className="mt-4 py-3 bg-card-light rounded-xl items-center border border-white/20">
              <Text className="text-text-primary font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SectionTitle = ({ icon, title }: { icon: string, title: string }) => (
  <View className="flex-row items-center gap-2 mb-4 mt-6 border-b border-white/10 pb-2">
    <Text className="text-xl">{icon}</Text>
    <Text className="text-base font-bold text-text-primary uppercase tracking-wide">{title}</Text>
  </View>
);

const BookingForm = ({ currentUser, router }: any) => {
  const [vehicleType, setVehicleType] = useState('car');
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", altPhone: "", brand: "", model: "", issue: "", otherIssue: "", vehicleNumber: "", address: "", location: "", preferredDate: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lat: null as any, lng: null as any });
  const [errors, setErrors] = useState<any>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const [serviceType, setServiceType] = useState<"home" | "shop">("home");
  const params = useLocalSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const isShopOnly = selectedPackage?.place === "shop";

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, name: currentUser.username || currentUser.name || prev.name, email: currentUser.email || prev.email, phone: currentUser.mobile || prev.phone }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (params?.selectedPackage) {
      const pkg = JSON.parse(params.selectedPackage);

      setSelectedPackage(pkg);

      // ✅ set default service type
      setServiceType(pkg.place === "shop" ? "shop" : "home");

      // ✅ set package info
      setFormData(prev => ({
        ...prev,
        issue: "Others",
        otherIssue: `Package: ${pkg.title} - Price: ₹${pkg.price}`
      }));
    }
  }, [params?.selectedPackage]);

  const searchLocation = async (query: string) => {
    setLocationQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 3) { setLocationResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, { headers: { 'User-Agent': 'CarServiceBookApp/1.0' } });
        if (res.status === 429) { Alert.alert("Notice", "Search is busy. Please wait a moment."); return; }
        const data = await res.json();
        setLocationResults(data);
      } catch (error) { console.error("Search failed", error); }
    }, 800);
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Denied', 'Permission is required.'); setLocationLoading(false); return; }
      let locationPlatform = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = locationPlatform.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers: { 'User-Agent': 'CarServiceBookApp/1.0' } });
      if (!res.ok) { Alert.alert("Error", res.status === 429 ? "Location service is busy." : `Service error: ${res.status}`); return; }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, location: data.display_name }));
      setLocationQuery(data.display_name);
      setCoords({ lat: latitude, lng: longitude });
    } catch (error: any) { Alert.alert("Notice", "Could not fetch current location."); } finally { setLocationLoading(false); }
  };

  const handleChange = (name: string, value: string) => { setFormData({ ...formData, [name]: value }); };

  const handleSubmit = async () => {
    if (!currentUser) { Alert.alert("Login Required", "Please login."); router.push('/(auth)/login'); return; }
    const newErrors: any = {};
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    if (!formData.brand) newErrors.brand = "Required";
    if (!formData.model) newErrors.model = "Required";
    if (!formData.issue) newErrors.issue = "Required";
    // ✅ ONLY FOR HOME
    if (serviceType === "home") {
      if (!formData.location) newErrors.location = "Location required";
      if (!formData.address) newErrors.address = "Address required";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      const bookingId = `BS${Math.floor(100000 + Math.random() * 900000)}`;
      await api.post("/bookings/create", { ...formData, place: serviceType, bookingId, uid: currentUser.id || currentUser.uid || currentUser._id, vehicleType, latitude: coords.lat, longitude: coords.lng, status: BOOKING_STATUS.BOOKED });
      Alert.alert("Success", "Your service booking was successful!");
      setFormData({ name: currentUser.username || currentUser.name || "", email: currentUser.email || "", phone: currentUser.mobile || "", altPhone: "", brand: "", model: "", issue: "", otherIssue: "", vehicleNumber: "", address: "", location: "", preferredDate: new Date().toISOString().split('T')[0] });
      setLocationQuery(""); setCoords({ lat: null, lng: null });
      // Navigate to service status page
      router.push('/profile/service-status');
    } catch (error) { Alert.alert("Error", "Booking failed."); } finally { setSubmitting(false); }
  };

  return (
    <View className="bg-card rounded-3xl p-6 border border-white/10  mb-8">
      {/* <Text className="text-text-primary text-xl font-black mb-6">Quick Service Booking</Text> */}
      <CustomInput label="Full Name" value={formData.name} onChangeText={(val: string) => handleChange('name', val)} placeholder="John Doe" required error={errors.name} />
      <CustomInput label="Email Address" value={formData.email} onChangeText={(val: string) => handleChange('email', val)} placeholder="Optional" disabled />
      <CustomInput label="Phone Number" value={formData.phone} onChangeText={(val: string) => handleChange('phone', val)} placeholder="+91" keyboardType="phone-pad" required error={errors.phone} />
      <CustomInput label="Alternative Phone" value={formData.altPhone} onChangeText={(val: string) => handleChange('altPhone', val)} placeholder="Optional" keyboardType="phone-pad" />
      {/* <View className="flex-row gap-6 py-5 border-y border-white/10 mb-5 justify-around mt-2">
        <TouchableOpacity onPress={() => setVehicleType('car')} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${vehicleType === 'car' ? 'border-primary' : 'border-gray-500'}`}>{vehicleType === 'car' && <View className="w-2 h-2 rounded-full bg-primary" />}</View>
          <Text className={`font-bold ${vehicleType === 'car' ? 'text-text-primary' : 'text-text-secondary'}`}>Car</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVehicleType('bike')} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${vehicleType === 'bike' ? 'border-primary' : 'border-gray-500'}`}>{vehicleType === 'bike' && <View className="w-2 h-2 rounded-full bg-primary" />}</View>
          <Text className={`font-bold ${vehicleType === 'bike' ? 'text-text-primary' : 'text-text-secondary'}`}>Bike</Text>
        </TouchableOpacity>
      </View> */}
      <CustomSelect label="Brand" value={formData.brand} onSelect={(val: string) => handleChange('brand', val)} options={vehicleType === 'car' ? ["Honda", "Hyundai", "BMW", "Audi", "Ford", "Toyota"] : ["Yamaha", "Royal Enfield", "Bajaj", "TVS"]} required error={errors.brand} />
      <CustomInput label="Model" value={formData.model} onChangeText={(val: string) => handleChange('model', val)} placeholder="i20, R15..." required error={errors.model} />
      <CustomSelect label="Issue" value={formData.issue} onSelect={(val: string) => handleChange('issue', val)} options={["Engine Problem", "Brake Issue", "Electrical", "Others"]} required error={errors.issue} />
      {formData.issue === 'Others' && <CustomInput label="Describe Issue" value={formData.otherIssue} onChangeText={(val: string) => handleChange('otherIssue', val)} />}
      <CustomInput label="Vehicle Number" value={formData.vehicleNumber} onChangeText={(val: string) => handleChange('vehicleNumber', val)} placeholder="TN 01 AB 1234" />

      <View className="flex-row justify-around py-4 border-y border-primary/20 my-4">

        {/* HOME */}
        <TouchableOpacity
          onPress={() => !isShopOnly && setServiceType("home")}
          className="flex-row items-center gap-2"
          disabled={isShopOnly}
        >
          <View
            className={`w-5 h-5 rounded-full border-2 items-center justify-center 
      ${serviceType === "home" ? "border-primary" : "border-gray400"}
      ${isShopOnly ? "opacity-40" : ""}
    `}
          >
            {serviceType === "home" && (
              <View className="w-2 h-2 rounded-full bg-primary" />
            )}
          </View>

          <Text className={`${serviceType === "home" ? "text-text-primary font-bold" : "text-gray400"} ${isShopOnly ? "opacity-40" : ""}`}>
            Home Service
          </Text>
        </TouchableOpacity>

        {/* SHOP */}
        <TouchableOpacity
          onPress={() => setServiceType("shop")}
          className="flex-row items-center gap-2"
        >
          <View
            className={`w-5 h-5 rounded-full border-2 items-center justify-center ${serviceType === "shop" ? "border-primary" : "border-gray400"
              }`}
          >
            {serviceType === "shop" && (
              <View className="w-2 h-2 rounded-full bg-primary" />
            )}
          </View>
          <Text className={serviceType === "shop" ? "text-text-primary font-bold" : "text-gray400"}>
            Shop Service
          </Text>
        </TouchableOpacity>

      </View>
      {serviceType === "home" && (
        <>
          <View className="mb-4 relative ">
            <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">Search Location <Text className="text-error">*</Text></Text>
            <TextInput value={locationQuery} onChangeText={searchLocation} placeholder="Search area..." placeholderTextColor="#6b7280" className={`w-full bg-card-light rounded-xl border px-5 py-4 text-text-primary ${errors.location ? 'border-red-400' : 'border-white/20'}`} />
            {errors.location && <Text className="mt-1 text-xs text-error ml-1">{errors.location}</Text>}
            {locationResults.length > 0 && (
              <View className="mt-2 rounded-xl bg-modal border border-white/20 max-h-56 overflow-hidden ">
                {locationResults.map((p, index) => (
                  <TouchableOpacity key={p.place_id || index} onPress={() => { setFormData((prev) => ({ ...prev, location: p.display_name })); setLocationQuery(p.display_name); setCoords({ lat: p.lat, lng: p.lon }); setLocationResults([]); }} className="px-5 py-4 border-b border-white/10">
                    <Text className="text-text-secondary text-sm">{p.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={handleUseCurrentLocation} disabled={locationLoading} className="mt-5 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 items-center flex-row justify-center">
              {locationLoading ? <ActivityIndicator color="#0EA5E9" /> : <><Ionicons name="location-outline" size={18} color="#0EA5E9" /><Text className="text-text-primary font-bold tracking-wide text-xs ml-2">USE CURRENT LOCATION</Text></>}
            </TouchableOpacity>
          </View>
          <View className="mb-6 mt-2">
            <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">Service Address <Text className="text-error">*</Text></Text>
            <TextInput value={formData.address} onChangeText={(val: string) => handleChange('address', val)} placeholder="Door No, Street Name, City..." placeholderTextColor="#6b7280" multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100 }} className={`w-full bg-card-light rounded-xl border px-5 py-4 text-text-primary ${errors.address ? 'border-red-400' : 'border-white/20'}`} />
            {errors.address && <Text className="mt-1 text-xs text-error ml-1">{errors.address}</Text>}
          </View>

        </>
      )}
      <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`w-full mt-2 py-4 rounded-xl items-center ${submitting ? 'bg-primary/50' : 'bg-primary '}`}>
        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base tracking-wide">BOOK SERVICE →</Text>}
      </TouchableOpacity>
    </View>
  );
};

const AppointmentForm = ({ currentUser, router }: any) => {
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "", city: "", pincode: "",
    vehicleType: "Car", brand: "", model: "", registrationNumber: "",
    fuelType: "Petrol", yearOfManufacture: "", currentMileage: "",
    serviceType: "", otherIssue: "", pickupDrop: "No",
    preferredDate: "", preferredTimeSlot: "Morning (9AM–12PM)",
    serviceMode: "At Service Center", pickupAddress: "", location: "",
    paymentMode: "Pay After Service", couponCode: "", notes: "",
    emergencyService: false
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [errors, setErrors] = useState<any>({});

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lat: null as any, lng: null as any });
  const [locationLoading, setLocationLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, name: currentUser.username || currentUser.name || prev.name, email: currentUser.email || prev.email, phone: currentUser.mobile || prev.phone }));
    }
  }, [currentUser]);

  useEffect(() => {
    let cost = SERVICE_PRICES[formData.serviceType] || 0;
    if (formData.emergencyService) cost += 500;
    if (formData.pickupDrop === "Yes") cost += 300;
    setEstimatedCost(cost);
  }, [formData.serviceType, formData.pickupDrop, formData.emergencyService]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const searchLocation = async (query: string) => {
    setLocationQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 3) { setLocationResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, { headers: { 'User-Agent': 'CarServiceBookApp/1.0' } });
        if (res.status === 429) { Alert.alert("Notice", "Search is busy. Please wait a moment."); return; }
        const data = await res.json();
        setLocationResults(data);
      } catch (error) { console.error("Search failed", error); }
    }, 800);
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Denied', 'Permission is required.'); setLocationLoading(false); return; }
      let locationPlatform = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = locationPlatform.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers: { 'User-Agent': 'CarServiceBookApp/1.0' } });
      if (!res.ok) { Alert.alert("Error", res.status === 429 ? "Location service is busy." : `Service error: ${res.status}`); return; }
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      const pincode = data.address?.postcode || "";
      setFormData((prev) => ({ ...prev, location: data.display_name, city, pincode }));
      setLocationQuery(data.display_name);
      setCoords({ lat: latitude, lng: longitude });
    } catch (error: any) { Alert.alert("Notice", "Could not fetch current location."); } finally { setLocationLoading(false); }
  };

  const handleSubmit = async () => {
    if (!currentUser) { Alert.alert("Login Required", "Please login."); router.push('/(auth)/login'); return; }
    const newErrors: any = {};
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Required";
    if (!formData.serviceType) newErrors.serviceType = "Required";
    if (!formData.preferredDate) newErrors.preferredDate = "Required";
    if (formData.serviceMode === "Doorstep Service" && !formData.pickupAddress) { newErrors.pickupAddress = "Required for doorstep"; }
    if (!termsAccepted) newErrors.termsAccepted = "Required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) { Alert.alert("Missing Fields", "Please fix the errors in the form (scroll)."); return; }

    try {
      setSubmitting(true);
      const bookingId = `AP${Math.floor(100000 + Math.random() * 900000)}`;

      // Prepare normalized data for backend compatibility
      const appointmentData = {
        ...formData,
        bookingId,
        uid: currentUser.id || currentUser.uid || currentUser._id,
        latitude: coords.lat || null,
        longitude: coords.lng || null,
        estimatedCost,
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
        status: "Appointment Booked", // Match requested status

        // Map fields for common booking endpoint compatibility
        vehicleNumber: formData.registrationNumber,
        issue: formData.serviceType || formData.otherIssue || "General Service",
        vehicleType: formData.vehicleType ? formData.vehicleType.toLowerCase() : 'car'
      };

      console.log("Submitting Appointment Data:", appointmentData);

      // Try multiple potential endpoints
      await api.post("/appointments", appointmentData)
        .catch((err) => {
          console.warn("/appointments failed, trying /bookings/appointment");
          return api.post("/bookings/appointment", appointmentData);
        })
        .catch((err) => {
          console.warn("/bookings/appointment failed, trying /bookings");
          return api.post("/bookings", appointmentData);
        })
        .catch((err) => {
          console.warn("/bookings failed, trying /bookings/create");
          return api.post("/bookings/create", appointmentData);
        });

      Alert.alert("Success", "Service Appointment Scheduled Successfully!");
      setTermsAccepted(false);
      setFormData({
        name: currentUser.username || currentUser.name || "",
        phone: currentUser.mobile || "",
        email: currentUser.email || "",
        address: "", city: "", pincode: "",
        vehicleType: "Car", brand: "", model: "", registrationNumber: "",
        fuelType: "Petrol", yearOfManufacture: "", currentMileage: "",
        serviceType: "", otherIssue: "", pickupDrop: "No",
        preferredDate: "", preferredTimeSlot: "Morning (9AM–12PM)",
        serviceMode: "At Service Center", pickupAddress: "", location: "",
        paymentMode: "Pay After Service", couponCode: "", notes: "", emergencyService: false
      });
      setLocationQuery("");
      setCoords({ lat: null, lng: null });
      // Navigate to service status page
      router.push('/profile/service-status');
    } catch (err: any) {
      console.error("Appointment Error Full:", err);
      if (err.response) {
        console.error("Backend Error Data:", err.response.data);
      }

      const errorMsg = err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        "Failed to schedule appointment.";

      Alert.alert("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="bg-card rounded-3xl p-6 border border-white/10  mb-8">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-text-primary text-lg font-black uppercase tracking-wider">Service Spec</Text>
        {estimatedCost > 0 && (
          <View className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl items-end">
            <Text className="text-[8px] font-black text-text-primary uppercase tracking-widest leading-none mb-1">Estimate</Text>
            <Text className="text-xl font-black text-text-primary leading-none">₹{estimatedCost}</Text>
          </View>
        )}
      </View>

      <SectionTitle icon="🧾" title="Customer Details" />
      <CustomInput label="Full Name" value={formData.name} onChangeText={(val: string) => handleChange('name', val)} required error={errors.name} />
      <CustomInput label="Mobile Number" value={formData.phone} onChangeText={(val: string) => handleChange('phone', val)} keyboardType="phone-pad" required error={errors.phone} />
      <CustomInput label="Email Address" value={formData.email} onChangeText={(val: string) => handleChange('email', val)} keyboardType="email-address" />

      <View className="mb-4 relative ">
        <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">Search Location</Text>
        <TextInput value={locationQuery} onChangeText={searchLocation} placeholder="Search area..." placeholderTextColor="#6b7280" className={`w-full bg-card-light rounded-xl border px-5 py-4 text-text-primary border-white/20`} />
        {locationResults.length > 0 && (
          <View className="mt-2 rounded-xl bg-modal border border-white/20 max-h-56 overflow-hidden ">
            {locationResults.map((p, index) => (
              <TouchableOpacity key={p.place_id || index} onPress={() => { const city = p.address?.city || p.address?.town || p.address?.village || ""; const pincode = p.address?.postcode || ""; setFormData((prev) => ({ ...prev, location: p.display_name, city, pincode })); setLocationQuery(p.display_name); setCoords({ lat: p.lat, lng: p.lon }); setLocationResults([]); }} className="px-5 py-4 border-b border-white/10">
                <Text className="text-text-secondary text-sm">{p.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity onPress={handleUseCurrentLocation} disabled={locationLoading} className="mt-5 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 items-center flex-row justify-center">
          {locationLoading ? <ActivityIndicator color="#0EA5E9" /> : <><Ionicons name="location-outline" size={18} color="#0EA5E9" /><Text className="text-text-primary font-bold tracking-wide text-xs ml-2">USE CURRENT LOCATION</Text></>}
        </TouchableOpacity>
      </View>

      <CustomInput label="City" value={formData.city} onChangeText={(val: string) => handleChange('city', val)} />
      <CustomInput label="Complete Address" value={formData.address} onChangeText={(val: string) => handleChange('address', val)} multiline numberOfLines={3} />
      <CustomInput label="Pincode" value={formData.pincode} onChangeText={(val: string) => handleChange('pincode', val)} keyboardType="number-pad" />

      <SectionTitle icon="🚘" title="Vehicle Details" />
      <CustomSelect label="Vehicle Type" value={formData.vehicleType} onSelect={(val: string) => handleChange('vehicleType', val)} options={["Car", "Bike", "SUV"]} required />
      <CustomInput label="Brand" value={formData.brand} onChangeText={(val: string) => handleChange('brand', val)} placeholder="Toyota, Hyundai..." />
      <CustomInput label="Model" value={formData.model} onChangeText={(val: string) => handleChange('model', val)} placeholder="i20, Innova..." />
      <CustomInput label="Registration Number" value={formData.registrationNumber} onChangeText={(val: string) => handleChange('registrationNumber', val)} placeholder="TN 01 AB 1234" required error={errors.registrationNumber} />
      <CustomSelect label="Fuel Type" value={formData.fuelType} onSelect={(val: string) => handleChange('fuelType', val)} options={["Petrol", "Diesel", "EV", "Hybrid"]} />
      <CustomInput label="Year of Manufacture" value={formData.yearOfManufacture} onChangeText={(val: string) => handleChange('yearOfManufacture', val)} keyboardType="number-pad" />
      <CustomInput label="Current Mileage" value={formData.currentMileage} onChangeText={(val: string) => handleChange('currentMileage', val)} keyboardType="number-pad" placeholder="e.g. 50000" />

      <SectionTitle icon="🛠️" title="Service Details" />
      <CustomSelect label="Service Type" value={formData.serviceType} onSelect={(val: string) => handleChange('serviceType', val)} options={Object.keys(SERVICE_PRICES)} required error={errors.serviceType} />

      <CustomSelect label="Service Mode" value={formData.serviceMode} onSelect={(val: string) => handleChange('serviceMode', val)} options={["At Service Center", "Doorstep Service"]} />

      {formData.serviceMode === "Doorstep Service" && (
        <CustomInput label="Pickup Address" value={formData.pickupAddress} onChangeText={(val: string) => handleChange('pickupAddress', val)} required error={errors.pickupAddress} multiline numberOfLines={3} />
      )}

      <CustomSelect label="Pickup & Drop" value={formData.pickupDrop} onSelect={(val: string) => handleChange('pickupDrop', val)} options={["No", "Yes"]} />

      <View className="flex-row items-center gap-3 my-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
        <Switch value={formData.emergencyService} onValueChange={(val: boolean) => handleChange('emergencyService', val)} trackColor={{ false: '#374151', true: '#ef4444' }} thumbColor="#fff" />
        <Text className="text-text-secondary text-sm flex-1">Emergency Service <Text className="text-red-400 font-bold">(+ ₹500)</Text></Text>
      </View>

      <CustomInput label="Describe Problem" value={formData.otherIssue} onChangeText={(val: string) => handleChange('otherIssue', val)} multiline numberOfLines={3} />
      <CustomInput label="Additional Notes" value={formData.notes} onChangeText={(val: string) => handleChange('notes', val)} multiline numberOfLines={2} placeholder="Optional instructions..." />

      <SectionTitle icon="📅" title="Appointment Scheduling" />
      <View className="mb-4">
        <Text className="mb-2 text-sm text-text-secondary font-medium ml-1">Preferred Date *</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className={`w-full bg-card-light rounded-xl border px-5 py-4 flex-row justify-between items-center ${errors.preferredDate ? 'border-red-400' : 'border-white/20'}`}
        >
          <Text className="text-text-primary">{formData.preferredDate || "Select Date"}</Text>
          <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.preferredDate ? new Date(formData.preferredDate) : new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData({ ...formData, preferredDate: selectedDate.toISOString().split('T')[0] });
              }
            }}
          />
        )}
        {errors.preferredDate && <Text className="mt-1 text-xs text-error ml-1">{errors.preferredDate}</Text>}
      </View>
      <CustomSelect label="Time Slot" value={formData.preferredTimeSlot} onSelect={(val: string) => handleChange('preferredTimeSlot', val)} options={["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–7PM)"]} required />

      <SectionTitle icon="💳" title="Payment & Offers" />
      <CustomSelect label="Payment Mode" value={formData.paymentMode} onSelect={(val: string) => handleChange('paymentMode', val)} options={["Pay After Service", "Pay Online"]} />
      <CustomInput label="Coupon Code" value={formData.couponCode} onChangeText={(val: string) => handleChange('couponCode', val)} placeholder="Enter code if any" />

      {estimatedCost > 0 && (
        <View className="bg-primary/10 border border-primary/30 p-4 rounded-xl my-4">
          <Text className="text-text-primary font-bold text-center">Estimated Base Cost: ₹{estimatedCost}</Text>
        </View>
      )}

      <View className="flex-row items-center gap-3 mt-6 mb-8 border-t border-white/10 pt-6">
        <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: '#374151', true: '#0EA5E9' }} thumbColor="#fff" />
        <Text className="text-text-secondary text-sm flex-1">I agree to the <Text className="text-text-primary">Terms & Conditions</Text> for service booking.</Text>
      </View>
      {errors.termsAccepted && <Text className="text-error text-xs mb-4 text-center">{errors.termsAccepted}</Text>}

      <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`w-full py-4 rounded-xl items-center ${submitting ? 'bg-primary/50' : 'bg-primary '}`}>
        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base tracking-wide">SCHEDULE APPOINTMENT →</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default function BookingScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-8 pb-9">

          <View className="mb-6">
            <Text className="text-2xl font-black text-primary tracking-tight">Quick Service Booking</Text>
            <Text className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">On-demand service request</Text>
          </View>

          <BookingForm currentUser={currentUser} router={router} />

        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}