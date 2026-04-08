import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { apiService } from "../../services/api";

const StatusBadge = ({ status }: { status: string }) => {
  const isPaid = status.toLowerCase() === 'paid';
  return (
    <View className={`px-2 py-0.5 rounded-md ${isPaid ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
      <Text className={`text-[8px] font-black uppercase tracking-widest ${isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>
        {status}
      </Text>
    </View>
  );
};

export default function BillingsLedger() {
  const router = useRouter();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBillings = async () => {
    try {
      const data = await apiService.getBillings();
      setBillings(Array.isArray(data) ? [...data].reverse() : []); // Latest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const filteredBillings = billings.filter(b => {
    if (statusFilter === 'all') return true;
    return (b.paymentStatus || 'Pending').toLowerCase() === statusFilter.toLowerCase();
  });

  const handleMarkPaid = async (id: any) => {
    Alert.alert("Confirm Payment", "Mark this invoice as fully PAID?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await apiService.updateBillingStatus(id, "Paid");
            fetchBillings();
          } catch (err) {
            Alert.alert("Error", "Failed to update payment status");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* HEADER */}
      <View className="px-6 pt-14 pb-10 flex-row justify-between items-center bg-slate-950">
        <View>
          <Text className="text-white font-black text-4xl tracking-tighter">LEDGER</Text>
          <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[4px] mt-1">Invoicing System</Text>
        </View>
        <TouchableOpacity 
           onPress={() => router.push('/(adminPages)/add-billing')}
           className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-2xl shadow-sky-500/20"
        >
          <Ionicons name="add" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View className="px-6 flex-row gap-3 mb-6">
        <View className="flex-1 bg-slate-900/50 p-4 rounded-[28px] border border-white/5">
           <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Combined Total</Text>
           <Text className="text-white font-black text-xl">₹{billings.reduce((s, b) => s + Number(b.grandTotal || 0), 0).toLocaleString()}</Text>
        </View>
        <View className="flex-1 bg-slate-900/50 p-4 rounded-[28px] border border-white/5">
           <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Unpaid count</Text>
           <Text className="text-rose-500 font-black text-xl">{billings.filter(b => b.paymentStatus?.toLowerCase() !== 'paid').length}</Text>
        </View>
      </View>

      {/* FILTERS */}
      <View className="px-6 mb-8">
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
               {['all', 'paid', 'partial', 'pending'].map((f) => (
                  <TouchableOpacity 
                    key={f}
                    onPress={() => setStatusFilter(f)}
                    className={`px-6 h-10 items-center justify-center rounded-xl border ${statusFilter === f ? 'bg-white border-white' : 'bg-slate-900 border-slate-800'}`}
                  >
                    <Text className={`${statusFilter === f ? 'text-black' : 'text-slate-500'} text-[10px] font-black uppercase tracking-widest`}>{f}</Text>
                  </TouchableOpacity>
               ))}
            </View>
         </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" className="mt-20" />
      ) : (
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchBillings} tintColor="#fff" />
          }
        >
          <View className="gap-4 pb-20">
            {filteredBillings.map((b) => (
              <View key={b.id} className="bg-slate-900/50 rounded-[32px] p-6 border border-white/5 overflow-hidden">
                {/* Accent Glow */}
                {b.paymentStatus?.toLowerCase() === 'paid' && <View className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full" />}
                
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <Text className="text-sky-500 font-black text-[10px] tracking-widest uppercase mb-1">{b.invoiceNo}</Text>
                    <Text className="text-white font-black text-lg tracking-tight">{b.customerName}</Text>
                    <Text className="text-slate-500 text-[10px] font-bold mt-0.5">{b.car || "VEHICLE DETAILS"}</Text>
                  </View>
                  <StatusBadge status={b.paymentStatus || 'Pending'} />
                </View>
 
                <View className="h-[1px] bg-white/5 mb-4" />
 
                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Grand Total</Text>
                    <Text className="text-white font-black text-2xl">₹{Number(b.grandTotal || 0).toLocaleString()}</Text>
                  </View>
                  
                  <View className="flex-row gap-2">
                    {b.paymentStatus?.toLowerCase() !== 'paid' && (
                      <TouchableOpacity 
                        onPress={() => handleMarkPaid(b.id)}
                        className="bg-emerald-500 h-10 px-4 rounded-xl items-center justify-center"
                      >
                        <Text className="text-black font-black text-[10px] uppercase tracking-widest">Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      className="px-4 h-10 bg-white rounded-xl items-center justify-center border border-white/10"
                    >
                      <Text className="text-black font-black text-[10px] uppercase tracking-widest">View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
