import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const BOOKING_STATUS = { BOOKED: "Booked" };
const APPOINTMENT_STATUS = { BOOKED: "Appointment Booked" };

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
    <Text className="mb-2 text-sm text-gray-300 font-medium ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      {...props}
      editable={!disabled}
      placeholderTextColor="#6b7280"
      className={`w-full bg-white/10 rounded-xl border px-5 py-4 text-white outline-none ${error ? 'border-red-400' : 'border-white/20'} ${disabled ? 'opacity-50' : ''}`}
    />
    {error ? <Text className="mt-1 text-xs text-red-500 ml-1">{error}</Text> : null}
  </View>
);

const CustomSelect = ({ label, required, error, options, value, onSelect, placeholder }: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-gray-300 font-medium ml-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className={`w-full bg-white/10 rounded-xl border px-5 py-4 flex-row justify-between items-center ${error ? 'border-red-400' : 'border-white/20'}`}
      >
        <Text className={value ? "text-white" : "text-gray-500"}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>
      {error ? <Text className="mt-1 text-xs text-red-500 ml-1">{error}</Text> : null}

      <Modal visible={visible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="w-full bg-[#1e293b] rounded-2xl p-4 border border-white/10">
             <Text className="text-white text-lg font-bold mb-4 px-2">Select {label}</Text>
             <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
               {options.map((opt: string) => (
                 <TouchableOpacity key={opt} className="py-4 px-2 border-b border-white/5" onPress={() => { onSelect(opt); setVisible(false); }}>
                   <Text className="text-white text-base">{opt}</Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
             <TouchableOpacity onPress={() => setVisible(false)} className="mt-4 py-3 bg-white/10 rounded-xl items-center border border-white/20">
               <Text className="text-white font-bold">Cancel</Text>
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
    <Text className="text-base font-bold text-[#38bdf8] uppercase tracking-wider">{title}</Text>
  </View>
);

const BookingForm = ({ currentUser, router }: any) => {
  const [vehicleType, setVehicleType] = useState('car');
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", altPhone: "", brand: "", model: "", issue: "", otherIssue: "", vehicleNumber: "", address: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lat: null as any, lng: null as any });
  const [errors, setErrors] = useState<any>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, name: currentUser.username || currentUser.name || prev.name, email: currentUser.email || prev.email, phone: currentUser.mobile || prev.phone }));
    }
  }, [currentUser]);

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
    if (!formData.location) newErrors.location = "Required";
    if (!formData.address) newErrors.address = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      const bookingId = `BS${Math.floor(100000 + Math.random() * 900000)}`;
      await api.post("/bookings/create", { ...formData, bookingId, uid: currentUser.id || currentUser.uid || currentUser._id, vehicleType, latitude: coords.lat, longitude: coords.lng, status: BOOKING_STATUS.BOOKED });
      Alert.alert("Success", "Your service booking was successful!");
      setFormData({ name: currentUser.username || currentUser.name || "", email: currentUser.email || "", phone: currentUser.mobile || "", altPhone: "", brand: "", model: "", issue: "", otherIssue: "", vehicleNumber: "", address: "", location: "" });
      setLocationQuery(""); setCoords({ lat: null, lng: null });
    } catch (error) { Alert.alert("Error", "Booking failed."); } finally { setSubmitting(false); }
  };

  return (
    <View className="bg-white/5 rounded-3xl p-6 border border-[#38bdf8]/20 shadow-2xl mb-8">
      <Text className="text-[#38bdf8] text-xl font-black mb-6">Quick Service Booking</Text>
      <CustomInput label="Full Name" value={formData.name} onChangeText={(val: string) => handleChange('name', val)} placeholder="John Doe" required error={errors.name} />
      <CustomInput label="Email Address" value={formData.email} onChangeText={(val: string) => handleChange('email', val)} placeholder="Optional" disabled />
      <CustomInput label="Phone Number" value={formData.phone} onChangeText={(val: string) => handleChange('phone', val)} placeholder="+91" keyboardType="phone-pad" required error={errors.phone} />
      <CustomInput label="Alternative Phone" value={formData.altPhone} onChangeText={(val: string) => handleChange('altPhone', val)} placeholder="Optional" keyboardType="phone-pad" />
      <View className="flex-row gap-6 py-5 border-y border-white/10 mb-5 justify-around mt-2">
        <TouchableOpacity onPress={() => setVehicleType('car')} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${vehicleType === 'car' ? 'border-[#38bdf8]' : 'border-gray-500'}`}>{vehicleType === 'car' && <View className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />}</View>
          <Text className={`font-bold ${vehicleType === 'car' ? 'text-white' : 'text-gray-400'}`}>Car</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVehicleType('bike')} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${vehicleType === 'bike' ? 'border-[#38bdf8]' : 'border-gray-500'}`}>{vehicleType === 'bike' && <View className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />}</View>
          <Text className={`font-bold ${vehicleType === 'bike' ? 'text-white' : 'text-gray-400'}`}>Bike</Text>
        </TouchableOpacity>
      </View>
      <CustomSelect label="Brand" value={formData.brand} onSelect={(val: string) => handleChange('brand', val)} options={vehicleType === 'car' ? ["Honda", "Hyundai", "BMW", "Audi", "Ford", "Toyota"] : ["Yamaha", "Royal Enfield", "Bajaj", "TVS"]} required error={errors.brand} />
      <CustomInput label="Model" value={formData.model} onChangeText={(val: string) => handleChange('model', val)} placeholder="i20, R15..." required error={errors.model} />
      <CustomSelect label="Issue" value={formData.issue} onSelect={(val: string) => handleChange('issue', val)} options={["Engine Problem", "Brake Issue", "Electrical", "Others"]} required error={errors.issue} />
      {formData.issue === 'Others' && <CustomInput label="Describe Issue" value={formData.otherIssue} onChangeText={(val: string) => handleChange('otherIssue', val)} />}
      <CustomInput label="Vehicle Number" value={formData.vehicleNumber} onChangeText={(val: string) => handleChange('vehicleNumber', val)} placeholder="TN 01 AB 1234" />
      <View className="mb-4 relative z-50">
        <Text className="mb-2 text-sm text-gray-300 font-medium ml-1">Search Location <Text className="text-red-500">*</Text></Text>
        <TextInput value={locationQuery} onChangeText={searchLocation} placeholder="Search area..." placeholderTextColor="#6b7280" className={`w-full bg-white/10 rounded-xl border px-5 py-4 text-white outline-none ${errors.location ? 'border-red-400' : 'border-white/20'}`} />
        {errors.location && <Text className="mt-1 text-xs text-red-500 ml-1">{errors.location}</Text>}
        {locationResults.length > 0 && (
          <View className="mt-2 rounded-xl bg-[#1e293b] border border-white/20 max-h-56 overflow-hidden shadow-2xl">
            {locationResults.map((p, index) => (
              <TouchableOpacity key={p.place_id || index} onPress={() => { setFormData((prev) => ({ ...prev, location: p.display_name })); setLocationQuery(p.display_name); setCoords({ lat: p.lat, lng: p.lon }); setLocationResults([]); }} className="px-5 py-4 border-b border-white/10">
                <Text className="text-gray-300 text-sm">{p.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity onPress={handleUseCurrentLocation} disabled={locationLoading} className="mt-5 px-6 py-3.5 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 items-center flex-row justify-center">
          {locationLoading ? <ActivityIndicator color="#38bdf8" /> : <><Ionicons name="location-outline" size={18} color="#38bdf8" /><Text className="text-[#38bdf8] font-bold tracking-wider text-xs ml-2">USE CURRENT LOCATION</Text></>}
        </TouchableOpacity>
      </View>
      <View className="mb-6 mt-2">
        <Text className="mb-2 text-sm text-gray-300 font-medium ml-1">Service Address <Text className="text-red-500">*</Text></Text>
        <TextInput value={formData.address} onChangeText={(val: string) => handleChange('address', val)} placeholder="Door No, Street Name, City..." placeholderTextColor="#6b7280" multiline numberOfLines={4} textAlignVertical="top" className={`w-full bg-white/10 rounded-xl border px-5 py-4 text-white outline-none min-h-[100px] ${errors.address ? 'border-red-400' : 'border-white/20'}`} />
        {errors.address && <Text className="mt-1 text-xs text-red-500 ml-1">{errors.address}</Text>}
      </View>
      <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`w-full mt-2 py-4 rounded-xl items-center ${submitting ? 'bg-[#38bdf8]/50' : 'bg-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.3)]'}`}>
        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base tracking-widest">BOOK SERVICE →</Text>}
      </TouchableOpacity>
    </View>
  );
};

const AppointmentForm = ({ currentUser, router }: any) => {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "", city: "", pincode: "", vehicleType: "Car", brand: "", model: "", registrationNumber: "", fuelType: "Petrol", yearOfManufacture: "", currentMileage: "", serviceType: "", otherIssue: "", pickupDrop: "No", preferredDate: "", preferredTimeSlot: "Morning (9AM–12PM)" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, name: currentUser.username || currentUser.name || prev.name, email: currentUser.email || prev.email, phone: currentUser.mobile || prev.phone }));
    }
  }, [currentUser]);

  useEffect(() => {
    let cost = SERVICE_PRICES[formData.serviceType] || 0;
    if (formData.pickupDrop === "Yes") cost += 300;
    setEstimatedCost(cost);
  }, [formData.serviceType, formData.pickupDrop]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentUser) { Alert.alert("Login Required", "Please login."); router.push('/(auth)/login'); return; }
    const newErrors: any = {};
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Required";
    if (!formData.serviceType) newErrors.serviceType = "Required";
    if (!formData.preferredDate) newErrors.preferredDate = "Required";
    if (!termsAccepted) newErrors.termsAccepted = "Required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) { Alert.alert("Missing Fields", "Please fix the errors in the form (scroll)."); return; }

    try {
      setSubmitting(true);
      const appointmentData = { ...formData, uid: currentUser.id || currentUser.uid || currentUser._id, estimatedCost, status: APPOINTMENT_STATUS.BOOKED };
      // Assuming you might have /appointments or use /bookings
      await api.post("/appointments", appointmentData).catch(() => api.post("/bookings/appointment", appointmentData)).catch(() => api.post("/bookings", appointmentData));
      Alert.alert("Success", "Service Appointment Scheduled Successfully!");
      setTermsAccepted(false);
      setFormData({ name: currentUser.username || currentUser.name || "", phone: currentUser.mobile || "", email: currentUser.email || "", address: "", city: "", pincode: "", vehicleType: "Car", brand: "", model: "", registrationNumber: "", fuelType: "Petrol", yearOfManufacture: "", currentMileage: "", serviceType: "", otherIssue: "", pickupDrop: "No", preferredDate: "", preferredTimeSlot: "Morning (9AM–12PM)" });
    } catch (err) {
      Alert.alert("Error", "Failed to schedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="bg-white/5 rounded-3xl p-6 border border-teal-400/20 shadow-2xl mb-8">
      <SectionTitle icon="🧾" title="Customer Details" />
      <CustomInput label="Full Name" value={formData.name} onChangeText={(val: string) => handleChange('name', val)} required error={errors.name} />
      <CustomInput label="Mobile Number" value={formData.phone} onChangeText={(val: string) => handleChange('phone', val)} keyboardType="phone-pad" required error={errors.phone} />
      <CustomInput label="Email Address" value={formData.email} onChangeText={(val: string) => handleChange('email', val)} keyboardType="email-address" />
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
      <CustomSelect label="Pickup & Drop" value={formData.pickupDrop} onSelect={(val: string) => handleChange('pickupDrop', val)} options={["No", "Yes"]} />
      <CustomInput label="Describe Problem" value={formData.otherIssue} onChangeText={(val: string) => handleChange('otherIssue', val)} multiline numberOfLines={3} />

      <SectionTitle icon="📅" title="Appointment Scheduling" />
      <CustomInput label="Preferred Date" value={formData.preferredDate} onChangeText={(val: string) => handleChange('preferredDate', val)} placeholder="YYYY-MM-DD" required error={errors.preferredDate} />
      <CustomSelect label="Time Slot" value={formData.preferredTimeSlot} onSelect={(val: string) => handleChange('preferredTimeSlot', val)} options={["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–7PM)"]} required />

      {estimatedCost > 0 && (
        <View className="bg-teal-500/10 border border-teal-500/30 p-4 rounded-xl my-4">
          <Text className="text-teal-400 font-bold text-center">Estimated Base Cost: ₹{estimatedCost}</Text>
        </View>
      )}

      <View className="flex-row items-center gap-3 mt-6 mb-8 border-t border-white/10 pt-6">
        <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: '#374151', true: '#38bdf8' }} thumbColor="#fff" />
        <Text className="text-gray-400 text-sm flex-1">I agree to the <Text className="text-[#38bdf8]">Terms & Conditions</Text> for service booking.</Text>
      </View>
      {errors.termsAccepted && <Text className="text-red-500 text-xs mb-4 text-center">{errors.termsAccepted}</Text>}

      <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`w-full py-4 rounded-xl items-center ${submitting ? 'bg-teal-500/50' : 'bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.3)]'}`}>
        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base tracking-widest">SCHEDULE APPOINTMENT →</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default function BookingScreen() {
  const [activeTab, setActiveTab] = useState<'booking' | 'appointment'>('booking');
  const { user: currentUser } = useAuth();
  const router = useRouter();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-8 pb-32">
          
          <Text className="text-2xl font-black text-white mb-6 tracking-wide">
            {activeTab === 'booking' ? 'Service Booking' : 'Appointments'}
          </Text>

          {/* Toggle Buttons */}
          <View className="flex-row mb-8 bg-white/10 p-1.5 rounded-xl border border-white/5">
            <TouchableOpacity 
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'booking' ? 'bg-[#38bdf8] shadow-lg' : ''}`}
              onPress={() => setActiveTab('booking')}
            >
              <Text className={`font-bold tracking-wide ${activeTab === 'booking' ? 'text-white' : 'text-gray-400'}`}>BOOKING</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'appointment' ? 'bg-[#38bdf8] shadow-lg bg-teal-500' : ''}`}
              onPress={() => setActiveTab('appointment')}
            >
              <Text className={`font-bold tracking-wide ${activeTab === 'appointment' ? 'text-white' : 'text-gray-400'}`}>APPOINTMENT</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'booking' ? (
             <BookingForm currentUser={currentUser} router={router} />
          ) : (
             <AppointmentForm currentUser={currentUser} router={router} />
          )}

        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#38bdf8] rounded-full items-center justify-center shadow-[0_5px_15px_rgba(56,189,248,0.4)] z-50 border border-white/20"
        onPress={() => Alert.alert('Add', `Create new ${activeTab}`)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}