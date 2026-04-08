import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView,
  Switch
} from "react-native";
import { useRouter } from "expo-router";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

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

const SectionTitle = ({ icon, title }: any) => (
  <View className="flex-row items-center gap-3 mb-6 mt-8">
    <View className="w-10 h-10 rounded-xl bg-sky-500/10 items-center justify-center">
       <Ionicons name={icon} size={20} color="#0EA5E9" />
    </View>
    <Text className="text-lg font-black text-white uppercase tracking-wider">{title}</Text>
    <View className="flex-1 h-[1px] bg-white/5 ml-4" />
  </View>
);

const InputField = ({ label, required, value, onChangeText, placeholder, icon, keyboardType = "default", multiline = false }: any) => (
  <View className="mb-6">
    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 ml-1">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
      {icon && <Ionicons name={icon} size={18} color="#475569" className="mr-3" />}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#334155"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        className={`flex-1 text-white font-bold text-sm ${multiline ? "min-h-[100px] text-top" : ""}`}
      />
    </View>
  </View>
);

export default function AddAppointment() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

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
    uid: "admin-created",
    status: "Appointment Booked"
  });

  useEffect(() => {
    let cost = SERVICE_PRICES[formData.serviceType] || 0;
    if (formData.emergencyService) cost += 500;
    if (formData.pickupDrop === "Yes") cost += 300;
    setEstimatedCost(cost);
  }, [formData.serviceType, formData.emergencyService, formData.pickupDrop]);

  const updateForm = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name) { Alert.alert("Required", "Full name is required"); return false; }
    if (!formData.phone) { Alert.alert("Required", "Mobile number is required"); return false; }
    if (!formData.registrationNumber) { Alert.alert("Required", "Registration number is required"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const appointmentData = {
        ...formData,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        estimatedCost: estimatedCost || 0,
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
      };

      await apiService.createAppointment(appointmentData);
      Alert.alert("Success", "Appointment Created Successfully!", [
        { text: "OK", onPress: () => router.push('/(admin)/bookings') }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="px-6 pt-10 pb-8 flex-row justify-between items-center bg-slate-950 border-b border-white/5">
           <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                 <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>
              <View>
                 <Text className="text-white text-2xl font-black uppercase tracking-tighter">Reservation</Text>
                 <Text className="text-sky-500 font-bold text-[8px] uppercase tracking-widest mt-1 text-center">New Appointment Entry</Text>
              </View>
           </View>
           
           <View className="bg-sky-500/10 border border-sky-500/20 rounded-2xl px-5 py-3 items-end">
              <Text className="text-[8px] font-black text-sky-500 uppercase tracking-widest">Projected Fee</Text>
              <Text className="text-xl font-black text-white mt-1">₹{estimatedCost}</Text>
           </View>
        </View>

        <View className="p-6">
           
           {/* CUSTOMER SECTION */}
           <SectionTitle icon="person-outline" title="Customer Dossier" />
           <InputField label="Full Name" value={formData.name} onChangeText={(val: string) => updateForm("name", val)} required placeholder="John Doe" icon="person-outline" />
           <InputField label="Mobile Number" value={formData.phone} onChangeText={(val: string) => updateForm("phone", val)} required placeholder="+91 00000 00000" keyboardType="phone-pad" icon="call-outline" />
           <InputField label="Email Address" value={formData.email} onChangeText={(val: string) => updateForm("email", val)} placeholder="john@example.com" keyboardType="email-address" icon="mail-outline" />
           <InputField label="Full Address" value={formData.address} onChangeText={(val: string) => updateForm("address", val)} placeholder="Street name, neighborhood..." multiline icon="location-outline" />

           {/* VEHICLE SECTION */}
           <SectionTitle icon="car-outline" title="Vehicle Intel" />
           <View className="flex-row gap-4 mb-6">
              {["Car", "Bike"].map(type => (
                <TouchableOpacity key={type} onPress={() => updateForm("vehicleType", type)} className={`flex-1 py-4 rounded-xl items-center border ${formData.vehicleType === type ? "bg-white border-white" : "bg-white/5 border-white/5"}`}>
                   <Text className={`font-black text-[10px] uppercase tracking-widest ${formData.vehicleType === type ? "text-black" : "text-white/40"}`}>{type}</Text>
                </TouchableOpacity>
              ))}
           </View>
           <InputField label="Registration Number" value={formData.registrationNumber} onChangeText={(val: string) => updateForm("registrationNumber", val)} required placeholder="MH 12 AB 1234" icon="barcode-outline" />
           <View className="flex-row gap-4">
              <View className="flex-1">
                 <InputField label="Brand" value={formData.brand} onChangeText={(val: string) => updateForm("brand", val)} placeholder="Honda" />
              </View>
              <View className="flex-1">
                 <InputField label="Model" value={formData.model} onChangeText={(val: string) => updateForm("model", val)} placeholder="City" />
              </View>
           </View>

           {/* SERVICE SECTION */}
           <SectionTitle icon="construct-outline" title="Service Config" />
           <View className="mb-8 p-6 bg-sky-500/5 border border-sky-500/10 rounded-3xl">
              <Text className="text-sky-500 font-black text-[9px] uppercase tracking-widest mb-4">Operations Profile</Text>
              <View className="flex-row flex-wrap gap-2">
                 {Object.keys(SERVICE_PRICES).map(type => (
                    <TouchableOpacity key={type} onPress={() => updateForm("serviceType", type)} className={`px-4 py-3 rounded-xl border ${formData.serviceType === type ? "bg-sky-500 border-sky-500" : "bg-white/5 border-white/10"}`}>
                       <Text className={`font-bold text-[9px] uppercase tracking-widest ${formData.serviceType === type ? "text-white" : "text-white/20"}`}>{type}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
           </View>

           <View className="flex-row items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 mb-6">
              <View className="flex-row items-center gap-4">
                 <View className="w-10 h-10 rounded-xl bg-sky-500/10 items-center justify-center">
                    <Ionicons name="flash-outline" size={18} color="#0EA5E9" />
                 </View>
                 <View>
                    <Text className="text-white font-black text-xs uppercase">Emergency Protocol</Text>
                    <Text className="text-white/20 text-[8px] font-bold uppercase mt-0.5">+₹500 Surcharge Applied</Text>
                 </View>
              </View>
              <Switch 
                value={formData.emergencyService} 
                onValueChange={(val) => updateForm("emergencyService", val)}
                trackColor={{ false: "#1e293b", true: "#0EA5E9" }}
              />
           </View>

           <InputField label="Preferred Date" value={formData.preferredDate} onChangeText={(val: string) => updateForm("preferredDate", val)} placeholder="YYYY-MM-DD" icon="calendar-outline" />
           <InputField label="Issue Description" value={formData.otherIssue} onChangeText={(val: string) => updateForm("otherIssue", val)} placeholder="Describe specific technical faults..." multiline icon="chatbubble-outline" />

           {/* ACTIONS */}
           <TouchableOpacity 
             onPress={handleSubmit} 
             disabled={submitting}
             className="bg-white py-6 rounded-[2rem] items-center mt-10 shadow-2xl active:scale-95"
           >
              {submitting ? <ActivityIndicator size="small" color="black" /> : <Text className="text-black font-black uppercase tracking-[4px] text-xs">Verify & Execute</Text>}
           </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
