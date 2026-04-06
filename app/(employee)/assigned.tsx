import React, { useEffect, useMemo, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get('window');

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toString().trim();
  const getStatusStyle = (status: string) => {
    const map: any = {
      "Pending": "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      "Assigned": "bg-blue-500/20 text-blue-500 border-blue-500/30",
      "Service Going on": "bg-indigo-500/20 text-indigo-500 border-indigo-500/30",
      "Bill Pending": "bg-purple-500/20 text-purple-500 border-purple-500/30",
      "Bill Completed": "bg-sky-500/20 text-sky-500 border-sky-500/30",
      "Service Completed": "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
      "Completed": "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    };
    return map[status] || "bg-gray-500/20 text-gray-500 border-gray-500/30";
  };

  const style = getStatusStyle(s);
  const bgColor = style.split(' ')[0];
  const textColor = style.split(' ')[1];
  const borderColor = style.split(' ')[2];

  return (
    <View className={`px-3 py-1 rounded-full border ${bgColor} ${borderColor}`}>
      <Text className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>
        {s || "Assigned"}
      </Text>
    </View>
  );
};

export default function AssignedHistory() {
  const { user: userProfile } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAssignedServices();
  }, [userProfile?.id]);

  const fetchAssignedServices = async () => {
    try {
      setLoading(true);
      // Fetching from all-services to include both bookings and appointments
      const res = await api.get("/all-services");
      
      const mechanicName = userProfile?.username || (userProfile as any)?.displayName || (userProfile as any)?.name || "";
      const filtered = (res.data || []).filter((s: any) => 
        (s.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
      );
      
      setServices(filtered);
    } catch (err) {
      console.error("Fetch assigned services failed", err);
      Alert.alert("Error", "Failed to load your assigned services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(item => {
      const statusValue = item.serviceStatus || item.status;
      const matchesStatus = filterStatus === "all" || statusValue === filterStatus;
      const text = search.toLowerCase();
      const matchesSearch = 
        (item.brand || "").toLowerCase().includes(text) ||
        (item.model || "").toLowerCase().includes(text) ||
        (item.vehicle_number || item.vehicleNumber || "").toLowerCase().includes(text) ||
        (item.name || item.customer_name || "").toLowerCase().includes(text) ||
        (item.bookingId || item.id || "").toString().includes(text);
      
      return matchesStatus && matchesSearch;
    });
  }, [services, search, filterStatus]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-gray-400 mt-4 font-medium tracking-widest text-[10px] uppercase">Syncing your service history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 mb-6 shadow-xl">
           <View className="flex-row items-center gap-3 mb-6">
              <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center">
                 <Ionicons name="time" size={24} color="#3b82f6" />
              </View>
              <View>
                 <Text className="text-2xl font-black text-white tracking-tight">Job History</Text>
                 <Text className="text-xs text-gray-400 font-medium mt-0.5">Assigned service logs</Text>
              </View>
           </View>

           <View className="flex-row gap-3">
              <View className="flex-1 bg-blue-500/10 px-4 py-3 rounded-2xl border border-blue-500/20">
                  <Text className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-tight">Total Tasks</Text>
                  <Text className="text-2xl font-black text-blue-500 mt-1">{services.length}</Text>
              </View>
              <View className="flex-1 bg-emerald-500/10 px-4 py-3 rounded-2xl border border-emerald-500/20">
                  <Text className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-tight">Jobs Done</Text>
                  <Text className="text-2xl font-black text-emerald-500 mt-1">
                    {services.filter((s: any) => ["Service Completed", "Completed"].includes(s.serviceStatus || s.status)).length}
                  </Text>
              </View>
           </View>
        </View>

        {/* FILTERS */}
        <View className="space-y-3 mb-6">
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="search" size={20} color="#64748b" />
            </View>
            <TextInput
              placeholder="Search by vehicle, ID, customer..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold"
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {['all', 'Assigned', 'Service Going on', 'Bill Pending', 'Service Completed'].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilterStatus(f)}
                className={`px-5 py-2.5 rounded-xl border ${filterStatus === f ? 'bg-sky-500 border-sky-400' : 'bg-slate-800 border-slate-700'}`}
              >
                <Text className={`text-[10px] font-black uppercase tracking-widest ${filterStatus === f ? 'text-white' : 'text-gray-400'}`}>
                  {f === 'all' ? 'Any Status' : f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LIST */}
        {filteredServices.length === 0 ? (
          <View className="bg-slate-800 rounded-[2rem] p-12 items-center border border-slate-700 border-dashed">
            <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-4 border border-slate-700">
               <Ionicons name="car-outline" size={40} color="#334155" />
            </View>
            <Text className="text-white text-lg font-black mt-2 text-center">No Services Found</Text>
            <Text className="text-gray-400 text-center mt-2 px-4 italic leading-5">Try adjusting your filters or search terms.</Text>
          </View>
        ) : (
          <View className="pb-20">
            {filteredServices.map((item) => (
              <View 
                key={item.id} 
                className="bg-slate-800 rounded-3xl border border-slate-700 p-6 mb-4 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-6">
                  <StatusBadge status={item.serviceStatus || item.status} />
                  <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {item.bookingId || item.id}</Text>
                </View>

                <View className="mb-6">
                  <Text className="text-2xl font-black text-white leading-tight">
                    {item.brand} {item.model}
                  </Text>
                  <Text className="text-sm font-black text-sky-500 mt-1 uppercase tracking-wider">{item.vehicle_number || item.vehicleNumber || "NO PLATE"}</Text>
                </View>

                <View className="space-y-4 mb-6">
                  <View className="flex-row items-start gap-4">
                    <View className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Reported Issue</Text>
                      <Text className="text-sm font-bold text-slate-300 leading-snug mt-0.5">{item.carIssue || item.issue || "General Inspection"}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-4 pt-4 border-t border-slate-700/50">
                    <View className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                      <Ionicons name="person" size={18} color="#0EA5E9" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Customer</Text>
                      <Text className="text-sm font-black text-white truncate">{item.customer_name || item.name}</Text>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Ionicons name="call-outline" size={12} color="#64748b" />
                        <Text className="text-xs font-bold text-slate-500">{item.phone || item.mobile || "N/A"}</Text>
                      </View>
                    </View>
                  </View>

                  {(item.parts_cost > 0 || item.partsTotal > 0) && (
                     <View className="flex-row items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <View className="flex-row items-center gap-2">
                           <View className="w-8 h-8 rounded-xl bg-emerald-500 items-center justify-center">
                              <Text className="text-white font-black text-xs">₹</Text>
                           </View>
                           <Text className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">Parts Cost</Text>
                        </View>
                        <Text className="text-lg font-black text-emerald-500">₹{item.parts_cost || item.partsTotal}</Text>
                     </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between pt-6 border-t border-slate-700/50">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text className="text-[11px] font-bold text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/(employee)/servicecenter?id=${item.id}` as any)}>
                    <Text className="text-xs font-black text-sky-500 uppercase tracking-widest">Open Details →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
