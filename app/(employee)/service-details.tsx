import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../services/api";

export default function ServiceDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/all-services/${id}`);
      setService(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-gray-400 mt-4 font-bold tracking-widest text-[10px] uppercase">Retrieving dossier...</Text>
      </View>
    );
  }

  if (!service) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="bg-slate-800 p-6 pb-4 border-b border-slate-700 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-900">
           <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white">Project Details</Text>
        <TouchableOpacity onPress={fetchDetails} className="w-10 h-10 items-center justify-center rounded-full bg-slate-900">
           <Ionicons name="refresh" size={18} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* TOP BADGE & STATUS */}
        <View className="items-center mb-8">
           <View className="bg-slate-800 px-6 py-2 rounded-full border border-sky-500/30 mb-3">
              <Text className="text-sky-500 font-black text-[10px] uppercase tracking-widest">{service.serviceStatus || "Active Service"}</Text>
           </View>
           <Text className="text-white font-black text-xs uppercase tracking-[4px]">ID: {service.bookingId || `SER-${service.id}`}</Text>
        </View>

        {/* CUSTOMER SECTION */}
        <View className="bg-slate-800 rounded-3xl p-6 mb-6 border border-slate-700">
           <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-sky-500 rounded-2xl items-center justify-center mr-4">
                 <Ionicons name="person" size={24} color="white" />
              </View>
              <View>
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Customer Dossier</Text>
                 <Text className="text-white text-xl font-black">{service.name || service.customer_name}</Text>
              </View>
           </View>
           
           <View className="gap-4">
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${service.phone || service.mobile}`)} className="flex-row items-center bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Ionicons name="call" size={18} color="#3b82f6" />
                 <Text className="text-white font-bold ml-3">{service.phone || service.mobile}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${service.email || 'N/A'}`)} className="flex-row items-center bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Ionicons name="mail" size={18} color="#6366f1" />
                 <Text className="text-white font-bold ml-3">{service.email || "No Email Provided"}</Text>
              </TouchableOpacity>
              <View className="flex-row items-start bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Ionicons name="location" size={18} color="#10b981" />
                 <Text className="text-white font-bold ml-3 flex-1">{service.address || "No address recorded."}</Text>
              </View>
           </View>
        </View>

        {/* VEHICLE SECTION */}
        <View className="bg-slate-800 rounded-3xl p-6 mb-6 border border-slate-700">
           <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-orange-500 rounded-2xl items-center justify-center mr-4">
                 <Ionicons name="car" size={24} color="white" />
              </View>
              <View>
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Vehicle Specifications</Text>
                 <Text className="text-white text-xl font-black">{service.brand} {service.model}</Text>
              </View>
           </View>

           <View className="grid grid-cols-2 gap-3 mb-2">
              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Plate Number</Text>
                 <Text className="text-white font-black">{service.vehicleNumber || service.vehicle_number || "N/A"}</Text>
              </View>
              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Year</Text>
                 <Text className="text-white font-black">{service.year || "N/A"}</Text>
              </View>
           </View>
           
           <View className="grid grid-cols-2 gap-3 mt-3">
              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Fuel Type</Text>
                 <Text className="text-white font-black uppercase">{service.fuelType || "N/A"}</Text>
              </View>
              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Kilometers</Text>
                 <Text className="text-white font-black">{service.km || 0} KM</Text>
              </View>
           </View>
        </View>

        {/* JOB DETAILS */}
        <View className="bg-slate-800 rounded-3xl p-6 mb-24 border border-slate-700">
           <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Service Breakdown</Text>
           
           <View className="mb-6">
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Primary Diagnosis</Text>
              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                 <Text className="text-white font-bold leading-5">{service.carIssue || "No initial problem description recorded."}</Text>
              </View>
           </View>

           {service.issues?.length > 0 && (
             <View className="mb-6">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Itemized Tasks</Text>
                {service.issues.map((iss: any, idx: number) => (
                  <View key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 mb-3 flex-row justify-between items-center">
                    <Text className="text-white font-bold flex-1 pr-4">{iss.issue}</Text>
                    <Text className="text-emerald-500 font-black">₹{Number(iss.issueAmount || 0).toFixed(2)}</Text>
                  </View>
                ))}
             </View>
           )}

           {service.parts?.length > 0 && (
             <View>
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Spares & Inventory</Text>
                {service.parts.map((p: any, idx: number) => (
                  <View key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 mb-2 flex-row justify-between items-center">
                    <View>
                       <Text className="text-white font-bold">{p.partName}</Text>
                       <Text className="text-slate-500 text-[10px]">Qty: {p.qty || 1}</Text>
                    </View>
                    <Text className="text-white font-black">₹{Number(p.total || 0).toFixed(2)}</Text>
                  </View>
                ))}
             </View>
           )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
