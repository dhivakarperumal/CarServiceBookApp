import React, { useEffect, useState, useMemo } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function AddServiceParts() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const { user: userProfile } = useAuth();

  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [parts, setParts] = useState([
    { partName: "", qty: "1", price: "0" },
  ]);

  useEffect(() => {
    loadInitialData();
  }, [serviceId]);

  const loadInitialData = async () => {
    try {
      setFetching(true);
      const [prodRes, servRes] = await Promise.all([
        api.get("/products"),
        api.get("/all-services")
      ]);
      setProducts(prodRes.data || []);
      setServices(servRes.data || []);

      if (serviceId) {
        const found = servRes.data.find((s: any) => s.id.toString() === serviceId.toString());
        if (found) setSelectedService(found);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  const filteredServices = useMemo(() => {
    if (!search) return [];
    return services.filter((s) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [services, search]);

  const handlePartChange = (i: number, field: string, value: string) => {
    const copy = [...parts];
    (copy[i] as any)[field] = value;
    setParts(copy);
  };

  const addPartRow = () => {
    setParts([...parts, { partName: "", qty: "1", price: "0" }]);
  };

  const removePartRow = (i: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, idx) => idx !== i));
    }
  };

  const totalPartsCost = parts.reduce(
    (sum, p) => sum + Number(p.qty || 0) * Number(p.price || 0),
    0
  );

  const handleSave = async () => {
    if (!selectedService) {
      Alert.alert("Error", "Please select a vehicle first");
      return;
    }

    const validParts = parts.filter((p) => p.partName.trim());
    if (validParts.length === 0) {
      Alert.alert("Error", "Add at least one part");
      return;
    }

    try {
      setLoading(true);
      const payloadParts = validParts.map((part) => ({
        partName: part.partName,
        qty: Number(part.qty),
        price: Number(part.price),
        status: 'pending',
      }));

      await api.post(`/all-services/${selectedService.id}/parts`, { parts: payloadParts });

      // Update service status to "Waiting for Spare"
      await api.put(`/all-services/${selectedService.id}/status`, {
        serviceStatus: "Waiting for Spare"
      });

      Alert.alert("Success", "Parts added and status updated to 'Waiting for Spare'");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save parts");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-400 mt-4 font-bold tracking-widest text-[10px] uppercase">Loading inventory...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="bg-slate-800 p-6 pb-4 border-b border-slate-700 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-900">
           <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white">Add Spare Parts</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* VEHICLE SELECTION */}
        {!selectedService ? (
          <View className="mb-6">
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Search Linked Vehicle</Text>
            <View className="relative">
              <View className="absolute left-4 top-3.5 z-10">
                <Ionicons name="search" size={18} color="#64748b" />
              </View>
              <TextInput
                placeholder="Booking ID / Mobile / Plate..."
                placeholderTextColor="#475569"
                value={search}
                onChangeText={setSearch}
                className="bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold"
              />
            </View>
            
            {filteredServices.length > 0 && (
              <View className="bg-slate-800 border border-slate-700 rounded-2xl mt-2 overflow-hidden">
                {filteredServices.map(s => (
                  <TouchableOpacity 
                    key={s.id} 
                    onPress={() => { setSelectedService(s); setSearch(""); }}
                    className="p-4 border-b border-slate-700/50"
                  >
                    <Text className="text-white font-bold">{s.bookingId || `ID: ${s.id}`}</Text>
                    <Text className="text-slate-500 text-xs">{s.name} • {s.brand} {s.model}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="bg-emerald-600/10 border border-emerald-500/20 p-5 rounded-3xl mb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Vehicle Match</Text>
              <Text className="text-white font-black text-lg">{selectedService.brand} {selectedService.model}</Text>
              <Text className="text-emerald-500/70 text-xs font-bold">{selectedService.vehicleNumber || selectedService.vehicle_number || "NO PLATE"}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedService(null)} className="bg-emerald-500/20 p-2 rounded-xl">
               <Ionicons name="close" size={18} color="#10b981" />
            </TouchableOpacity>
          </View>
        )}

        {/* PARTS LIST */}
        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Spare Parts List</Text>
        {parts.map((p, i) => (
          <View key={i} className="bg-slate-800 border border-slate-700 rounded-3xl p-5 mb-4 shadow-sm">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Part #{i + 1}</Text>
                {parts.length > 1 && (
                  <TouchableOpacity onPress={() => removePartRow(i)}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
             </View>

             <TextInput
               placeholder="Enter Part Name..."
               placeholderTextColor="#475569"
               value={p.partName}
               onChangeText={(t) => {
                 const selected = products.find(prod => prod.name.toLowerCase() === t.toLowerCase());
                 const copy = [...parts];
                 copy[i].partName = t;
                 if (selected) copy[i].price = selected.offerPrice.toString();
                 setParts(copy);
               }}
               className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold mb-4"
             />

             <View className="flex-row gap-4">
                <View className="flex-1">
                   <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Quantity</Text>
                   <TextInput
                     keyboardType="numeric"
                     value={p.qty}
                     onChangeText={(t) => handlePartChange(i, "qty", t)}
                     className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-white font-black text-center"
                   />
                </View>
                <View className="flex-[2]">
                   <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Price (₹)</Text>
                   <View className="relative">
                      <Text className="absolute left-4 top-3.5 z-10 text-emerald-500 font-black">₹</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={p.price}
                        onChangeText={(t) => handlePartChange(i, "price", t)}
                        className="bg-slate-900 border border-slate-700 rounded-2xl pl-8 pr-4 py-3.5 text-white font-black"
                      />
                   </View>
                </View>
             </View>
          </View>
        ))}

        <TouchableOpacity 
          onPress={addPartRow}
          className="flex-row items-center justify-center p-5 rounded-3xl border border-slate-700 border-dashed mb-10"
        >
           <Ionicons name="add-circle" size={24} color="#10b981" />
           <Text className="text-emerald-500 font-black ml-2 uppercase text-xs tracking-widest">Add Another Spare</Text>
        </TouchableOpacity>

        <View className="pb-20">
          <View className="bg-slate-800 p-8 rounded-3xl border border-slate-700 mb-6">
             <Text className="text-slate-500 font-black uppercase text-[10px] tracking-widest text-center mb-2">Total Parts Valuation</Text>
             <Text className="text-white text-4xl font-black text-center">₹{totalPartsCost.toLocaleString()}</Text>
          </View>

          <TouchableOpacity 
            onPress={handleSave}
            disabled={loading}
            className={`w-full py-5 bg-emerald-600 rounded-2xl items-center shadow-lg shadow-emerald-600/20 ${loading ? 'opacity-50' : ''}`}
          >
             {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest text-base">Confirm & Save Parts</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
