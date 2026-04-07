import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    SafeAreaView, ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiService } from '../../services/api';

const VEHICLE_TYPES = ["Two Wheeler", "Four Wheeler", "Three Wheeler", "Heavy Vehicle"];
const ISSUE_OPTIONS = [
  "Engine Problem", "Brake Issue", "Tyre / Wheel", "Electrical Problem",
  "AC Not Working", "Battery Issue", "Oil Leak", "Suspension / Steering", "Others",
];

const CustomInput = ({ label, required, value, onChangeText, placeholder, ...props }: any) => (
  <View className="mb-4">
    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#475569"
      className="bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-xs"
      {...props}
    />
  </View>
);

const CustomSelect = ({ label, options, value, onSelect, placeholder }: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className="bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 flex-row justify-between items-center"
      >
        <Text className={value ? "text-white font-bold text-xs" : "text-slate-500 font-bold text-xs"}>
           {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#475569" />
      </TouchableOpacity>

      {visible && (
        <View className="mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          {options.map((opt: string) => (
            <TouchableOpacity 
              key={opt} 
              onPress={() => { onSelect(opt); setVisible(false); }}
              className="p-4 border-b border-white/5"
            >
              <Text className="text-white font-bold text-xs">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const SectionTitle = ({ icon, title }: { icon: string, title: string }) => (
  <View className="flex-row items-center gap-2 mb-4 mt-6 border-b border-white/10 pb-2">
    <Text className="text-xl">{icon}</Text>
    <Text className="text-base font-bold text-text-primary uppercase tracking-wide">{title}</Text>
  </View>
);

export default function AdminBookingForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "",
    vehicleType: "Four Wheeler", vehicleNumber: "", brand: "", model: "",
    issue: "", otherIssue: "", preferredDate: new Date().toISOString().split('T')[0]
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (key: string, value: string) => 
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const newErrors: any = {};
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    if (!formData.email) newErrors.email = "Required";
    if (!formData.vehicleType) newErrors.vehicleType = "Required";
    if (!formData.vehicleNumber) newErrors.vehicleNumber = "Required";
    if (!formData.brand) newErrors.brand = "Required";
    if (!formData.model) newErrors.model = "Required";
    if (!formData.issue) newErrors.issue = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      const now = new Date();
      const bookingId = `BKG${now.getTime()}`;
      
      const serviceData = {
        bookingId,
        uid: "admin-created",
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || "Shop Address",
        location: "Shop",
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        brand: formData.brand || "Unknown",
        model: formData.model || "Unknown",
        issue: formData.issue === "Others" ? formData.otherIssue : formData.issue || "General Service",
        status: "Booked",
        preferredDate: formData.preferredDate,
        place: "shop",
        createdDate: now.toLocaleDateString("en-GB"),
        createdTime: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };

      // 1. Create Booking
      await apiService.createBooking(serviceData);

      // 2. Auto-Create Account
      try {
        await apiService.register({
          username: formData.name,
          email: formData.email,
          mobile: formData.phone,
          password: formData.phone, // Phone as password
          role: "customer"
        });
      } catch (authErr) {
        console.log("Account creation skipped or failed", authErr);
      }

      setSuccessId(bookingId);
      Alert.alert("Success", `Booking created and customer account registered! ID: ${bookingId}`);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to register vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-6 border border-emerald-500/30">
          <Ionicons name="checkmark-done" size={40} color="#10b981" />
        </View>
        <Text className="text-white font-black text-2xl uppercase tracking-tighter text-center mb-2">Vehicle Registered</Text>
        <Text className="text-slate-400 text-sm text-center mb-10 leading-relaxed px-4">
           The service vehicle has been added to the queue and a customer account was created automatically.
        </Text>

        <View className="bg-slate-900 border border-white/5 p-6 rounded-3xl w-full items-center mb-12 shadow-2xl">
           <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-2">Booking Identifier</Text>
           <Text className="text-sky-500 font-black text-2xl tracking-widest">{successId}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => { setSuccessId(null); setFormData({ name: "", phone: "", email: "", address: "", vehicleType: "Four Wheeler", vehicleNumber: "", brand: "", model: "", issue: "", otherIssue: "", preferredDate: new Date().toISOString().split('T')[0] }); }}
          className="bg-sky-500 w-full py-5 rounded-2xl items-center shadow-2xl shadow-sky-500/20 mb-4"
        >
          <Text className="text-white font-black uppercase tracking-widest">Register Another Vehicle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(admin)/bookings')}
          className="bg-white/5 w-full py-5 rounded-2xl items-center border border-white/5"
        >
          <Text className="text-slate-400 font-black uppercase tracking-widest">Return to Bookings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          <View className="mb-8">
            <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/5">
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-black text-2xl uppercase tracking-tighter">Add Service Vehicle</Text>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Register walk-in customers & vehicles</Text>
          </View>

          <View className="bg-slate-900/50 p-6 rounded-[32px] border border-white/5 shadow-2xl mb-24 overflow-hidden">
             
             <SectionTitle icon="person-circle-outline" title="Customer Details" />

             <CustomInput 
                label="Customer Name" 
                placeholder="e.g. Rajan Kumar" 
                value={formData.name}
                onChangeText={(val: string) => handleChange("name", val)}
                required
             />

             <CustomInput 
                label="Phone Number" 
                placeholder="9876543210" 
                keyboardType="numeric"
                value={formData.phone}
                onChangeText={(val: string) => handleChange("phone", val)}
                required
             />

             <CustomInput 
                label="Customer Email" 
                placeholder="customer@email.com" 
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(val: string) => handleChange("email", val)}
                required
             />

             <CustomInput 
                label="Service Address" 
                placeholder="House / Street / Area" 
                value={formData.address}
                onChangeText={(val: string) => handleChange("address", val)}
             />

             <SectionTitle icon="car-outline" title="Vehicle Details" />

             <CustomSelect 
                label="Vehicle Type" 
                options={VEHICLE_TYPES} 
                value={formData.vehicleType}
                onSelect={(val: string) => handleChange("vehicleType", val)}
                placeholder="Select Type"
             />

             <CustomInput 
                label="Vehicle Number" 
                placeholder="TN01AB1234" 
                autoCapitalize="characters"
                value={formData.vehicleNumber}
                onChangeText={(val: string) => handleChange("vehicleNumber", val)}
                required
             />

             <CustomInput label="Brand" placeholder="Honda" value={formData.brand} onChangeText={(val: string) => handleChange("brand", val)} />

             <CustomInput label="Model" placeholder="City" value={formData.model} onChangeText={(val: string) => handleChange("model", val)} />

             <CustomSelect 
                label="Select Issue" 
                options={ISSUE_OPTIONS} 
                value={formData.issue}
                onSelect={(val: string) => handleChange("issue", val)}
                placeholder="General Service"
             />

             {formData.issue === "Others" && (
                <CustomInput 
                   label="Describe the Issue" 
                   placeholder="Details..." 
                   multiline 
                   numberOfLines={3}
                   value={formData.otherIssue}
                   onChangeText={(val: string) => handleChange("otherIssue", val)}
                />
             )}

             <SectionTitle icon="calendar-outline" title="Preferred Date" />

             <View className="mb-4">
               <Text className="mb-2 text-sm text-slate-400 font-medium ml-1">Preferred Date <Text className="text-red-500">*</Text></Text>
               <TouchableOpacity onPress={() => setShowDatePicker(true)} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 flex-row justify-between items-center">
                 <Text className={formData.preferredDate ? "text-white font-bold text-xs" : "text-slate-500 font-bold text-xs"}>{formData.preferredDate || "Select Date"}</Text>
                 <Ionicons name="calendar-outline" size={18} color="#475569" />
               </TouchableOpacity>
               {showDatePicker && (
                 <DateTimePicker
                   value={new Date(formData.preferredDate || Date.now())}
                   mode="date"
                   display="default"
                   onChange={(event, selectedDate) => {
                     setShowDatePicker(false);
                     if (selectedDate) {
                       setFormData(prev => ({ ...prev, preferredDate: selectedDate.toISOString().split('T')[0] }));
                     }
                   }}
                 />
               )}
             </View>

             <TouchableOpacity 
                onPress={handleSubmit}
                disabled={submitting}
                className={`mt-6 rounded-2xl overflow-hidden ${submitting ? 'opacity-50' : ''}`}
             >
                <View className="bg-sky-500 p-5 items-center">
                   {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest">Add Service Vehicle →</Text>}
                </View>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}