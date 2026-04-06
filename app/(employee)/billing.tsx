import React, { useEffect, useMemo, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get('window');

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || "pending";
  let bg = "bg-gray-100";
  let text = "text-gray-700";
  let border = "border-gray-200";

  if (s === 'paid') {
    bg = "bg-emerald-100";
    text = "text-emerald-700";
    border = "border-emerald-200";
  } else if (s === 'partial') {
    bg = "bg-orange-100";
    text = "text-orange-700";
    border = "border-orange-200";
  } else if (s === 'pending') {
    bg = "bg-yellow-100";
    text = "text-yellow-700";
    border = "border-yellow-200";
  }

  return (
    <View className={`px-3 py-1 rounded-full border ${bg} ${border}`}>
      <Text className={`text-[10px] font-black uppercase tracking-wider ${text}`}>
        {s}
      </Text>
    </View>
  );
};

export default function EmployeeBilling() {
  const { user: userProfile } = useAuth();
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (serviceId) {
      router.push({ pathname: "/(employee)/add-billing", params: { directServiceId: serviceId } });
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [userProfile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billRes, bookRes] = await Promise.all([
        api.get('/billings'),
        api.get('/bookings')
      ]);

      const mechanicName = userProfile?.username || (userProfile as any)?.name || "";
      const assignedBookings = (bookRes.data || []).filter((b: any) => 
        (b.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
      );
      
      const assignedBookingIds = new Set(assignedBookings.map((b: any) => b.bookingId));
      
      // Filter bills that belong to this technician's assigned bookings
      const myBills = (billRes.data || []).filter((bill: any) => 
        assignedBookingIds.has(bill.bookingId)
      );

      setBills(myBills);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const text = `${b.invoiceNo} ${b.customerName} ${b.carNumber} ${b.bookingId}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || b.paymentStatus?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, search, statusFilter]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-gray-400 mt-4 font-medium">Fetching billing records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
             <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center">
                <Ionicons name="receipt" size={24} color="#3b82f6" />
             </View>
             <View>
                <Text className="text-2xl font-black text-white tracking-tight">Job Billing</Text>
                <Text className="text-xs text-gray-400 font-medium mt-0.5">Assigned service payments</Text>
             </View>
          </View>

          <View className="flex-row gap-3">
             <View className="flex-1 bg-emerald-500/10 px-4 py-3 rounded-2xl border border-emerald-500/20">
                <Text className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Total Earned</Text>
                <Text className="text-lg font-black text-emerald-500">₹{bills.reduce((sum, b) => sum + Number(b.grandTotal), 0).toLocaleString()}</Text>
             </View>
             <View className="flex-1 bg-amber-500/10 px-4 py-3 rounded-2xl border border-amber-500/20">
                <Text className="text-[9px] text-amber-400 font-black uppercase tracking-widest">Pending</Text>
                <Text className="text-lg font-black text-amber-500">{bills.filter(b => b.paymentStatus !== 'Paid').length}</Text>
             </View>
          </View>
          
          <TouchableOpacity
             onPress={() => router.push("/(employee)/add-billing" as any)}
             className="mt-4 bg-sky-500 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          >
             <Ionicons name="add-circle" size={20} color="white" />
             <Text className="text-white font-black uppercase tracking-widest text-xs">Create New Billing</Text>
          </TouchableOpacity>
        </View>

        {/* FILTERS */}
        <View className="space-y-3 mb-6">
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="search" size={20} color="#64748b" />
            </View>
            <TextInput
              placeholder="Search invoice, customer..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold"
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {['all', 'paid', 'pending', 'partial'].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f)}
                className={`px-6 py-2 rounded-xl border ${statusFilter === f ? 'bg-sky-500 border-sky-400' : 'bg-slate-800 border-slate-700'}`}
              >
                <Text className={`text-xs font-black uppercase tracking-widest ${statusFilter === f ? 'text-white' : 'text-gray-400'}`}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LIST */}
        {filteredBills.length === 0 ? (
          <View className="bg-slate-800 rounded-[2rem] p-12 items-center border border-slate-700 border-dashed">
            <Ionicons name="alert-circle-outline" size={48} color="#334155" />
            <Text className="text-white text-lg font-black mt-4">No Billings Found</Text>
            <Text className="text-gray-400 text-center mt-2 px-4 italic">Once you generate bills for assigned services, they will appear here.</Text>
          </View>
        ) : (
          <View className="pb-20">
            {filteredBills.map((bill) => (
              <View key={bill.id} className="bg-slate-800 rounded-3xl border border-slate-700 p-6 mb-4">
                <View className="flex-row justify-between items-start mb-4">
                   <StatusBadge status={bill.paymentStatus} />
                   <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">INV: {bill.invoiceNo}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-xl font-black text-white leading-tight">{bill.customerName}</Text>
                  <Text className="text-sm font-black text-sky-500 mt-1 uppercase tracking-wider">{bill.carNumber || "SERVICE JOB"}</Text>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Job ID: {bill.bookingId}</Text>
                </View>

                <View className="bg-slate-900/50 rounded-2xl p-4 space-y-2 mb-4 border border-slate-700/50">
                   <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-bold text-slate-500 uppercase">Subtotal</Text>
                      <Text className="text-xs font-bold text-slate-300 font-black">₹{Number(bill.subTotal || 0).toLocaleString()}</Text>
                   </View>
                   <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-bold text-slate-500 uppercase">GST Amount</Text>
                      <Text className="text-xs font-bold text-slate-300 font-black">₹{Number(bill.gstAmount || 0).toLocaleString()}</Text>
                   </View>
                   <View className="flex-row justify-between items-center pt-2 border-t border-slate-700 mt-1">
                      <Text className="text-xs font-black text-white uppercase">Grand Total</Text>
                      <Text className="text-lg font-black text-emerald-500">₹{Number(bill.grandTotal).toLocaleString()}</Text>
                   </View>
                </View>

                <View className="flex-row gap-3">
                   <TouchableOpacity 
                    onPress={() => Alert.alert("Print", "Printing functionality will be available in the native build.")}
                    className="flex-1 bg-slate-700 py-3 rounded-xl flex-row items-center justify-center gap-2"
                   >
                      <Ionicons name="print" size={16} color="white" />
                      <Text className="text-white text-[10px] font-black uppercase tracking-widest">Print Bill</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                    onPress={() => Alert.alert("History", "Detail view coming soon.")}
                    className="w-12 bg-sky-500/10 border border-sky-500/20 rounded-xl items-center justify-center"
                   >
                      <Ionicons name="eye" size={18} color="#0EA5E9" />
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
