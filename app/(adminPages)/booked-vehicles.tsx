import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const formatValue = (num: number) => {
  if (num >= 100000) return (num / 100000).toFixed(1) + " L";
  if (num >= 1000) return (num / 1000).toFixed(1) + " K";
  return num.toLocaleString();
};

const StatCard = ({ title, value, icon, gradient }: { title: string, value: string | number, icon: any, gradient: string[] }) => (
  <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl mr-4 w-40">
    <View className="flex-row justify-between items-center mb-3">
      <View className="p-2 bg-slate-800 rounded-xl">
        <Ionicons name={icon} size={18} color="#0ea5e9" />
      </View>
    </View>
    <Text className="text-[8px] text-slate-500 uppercase font-black tracking-widest">{title}</Text>
    <Text className="text-xl font-black text-white mt-1">{value}</Text>
  </View>
);

export default function BookedVehicles() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVehicleBookings();
      setBookings(data || []);
    } catch (err) {
      console.error("Fetch vehicle bookings error", err);
      Alert.alert("Error", "Failed to load vehicle bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelAndRepublish = async (id: any) => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to cancel this booking and republish the vehicle?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteVehicleBooking(id);
              Alert.alert("Success", "Booking cancelled and vehicle republished");
              fetchBookings();
              if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(null);
              }
            } catch (err) {
              Alert.alert("Error", "Failed to cancel booking");
            }
          }
        }
      ]
    );
  };

  const updateStatus = async (id: any, newStatus: string, extraData = {}) => {
    try {
      await apiService.updateVehicleBookingStatus(id, {
        status: newStatus,
        ...extraData
      });
      Alert.alert("Success", "Status updated successfully");
      fetchBookings();
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const stats = useMemo(() => {
    const activeBookings = bookings.filter(b => {
      const s = (b.status || "booked").toLowerCase();
      return s === "booked" || s === "confirmed";
    });

    const total = activeBookings.length;
    const totalAdvance = activeBookings.reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0);
    const confirmed = activeBookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;

    const soldBookings = bookings.filter(b => (b.status || "").toLowerCase() === "sold");
    const soldCount = soldBookings.length;
    const totalRevenue = soldBookings.reduce((sum, b) => {
      const net = Number(b.totalPrice || 0) - Number(b.negotiation || 0);
      return sum + net;
    }, 0);

    return { total, totalAdvance, confirmed, soldCount, totalRevenue };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const searchLower = search.toLowerCase();
      const matchSearch = (
        (b.bookingId || "").toLowerCase().includes(searchLower) ||
        (b.vehicleName || "").toLowerCase().includes(searchLower) ||
        (b.customerName || "").toLowerCase().includes(searchLower) ||
        (b.customerPhone || "").toLowerCase().includes(searchLower)
      );

      let matchStatus = true;
      if (statusFilter !== "all") {
        const currentStatus = (b.status || "booked").toLowerCase();
        matchStatus = currentStatus === statusFilter.toLowerCase();
      }

      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16 }}>Loading Bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* HEADER */}
      <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-900 rounded-xl items-center justify-center border border-slate-800">
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-black uppercase tracking-tight">Booked Vehicles</Text>
            <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[2px]">Admin Management</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchBookings} className="w-10 h-10 bg-sky-500/10 rounded-xl items-center justify-center border border-sky-500/20">
          <Ionicons name="refresh" size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={COLORS.primary} />}
      >
        {/* STATS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-6">
          <StatCard title="Active" value={stats.total} icon="calendar-outline" gradient={[]} />
          <StatCard title="Advance" value={`₹${formatValue(stats.totalAdvance)}`} icon="wallet-outline" gradient={[]} />
          <StatCard title="Confirmed" value={stats.confirmed} icon="checkmark-circle-outline" gradient={[]} />
          <StatCard title="Sold" value={stats.soldCount} icon="cart-outline" gradient={[]} />
          <StatCard title="Revenue" value={`₹${formatValue(stats.totalRevenue)}`} icon="stats-chart-outline" gradient={[]} />
        </ScrollView>

        {/* SEARCH & FILTERS */}
        <View className="px-6 pb-6 gap-4">
          <View className="bg-slate-900 flex-row items-center px-4 rounded-2xl border border-slate-800 h-14">
            <Ionicons name="search" size={18} color="#475569" />
            <TextInput
              placeholder="Search ID, Vehicle or Customer..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-white font-bold"
            />
          </View>

          <View className="flex-row gap-2">
            {(['all', 'booked', 'confirmed', 'sold', 'cancelled'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl border ${statusFilter === filter ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-slate-800'}`}
              >
                <Text className={`text-[9px] font-black uppercase tracking-widest ${statusFilter === filter ? 'text-white' : 'text-slate-500'}`}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LIST */}
        <View className="px-6 pb-20">
          {filteredBookings.length === 0 ? (
            <View className="py-20 items-center bg-slate-900/50 rounded-[40px] border border-dashed border-slate-800">
              <MaterialCommunityIcons name="car-off" size={48} color="#1e293b" />
              <Text className="text-slate-600 font-black uppercase tracking-widest text-[10px] mt-4">No vehicle bookings found</Text>
            </View>
          ) : filteredBookings.map((b, i) => {
             const status = (b.status || 'booked').toLowerCase();
             const sc = status === 'sold' ? { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' }
                       : status === 'confirmed' ? { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/20' }
                       : status === 'cancelled' ? { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' }
                       : { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };

             return (
               <TouchableOpacity 
                 key={b.id || i}
                 onPress={() => setSelectedBooking(b)}
                 className="bg-slate-900 border border-slate-800 rounded-[32px] p-5 mb-4"
               >
                 <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{b.bookingId}</Text>
                      <Text className="text-white text-lg font-black uppercase tracking-tight mt-1">{b.vehicleName}</Text>
                    </View>
                    <View className={`${sc.bg} ${sc.border} border px-3 py-1 rounded-full`}>
                       <Text className={`${sc.text} text-[8px] font-black uppercase tracking-widest`}>{status}</Text>
                    </View>
                 </View>

                 <View className="flex-row justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-white/5 mb-4">
                    <View>
                       <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Customer</Text>
                       <Text className="text-white font-bold text-sm">{b.customerName}</Text>
                       <Text className="text-slate-400 text-[10px]">{b.customerPhone}</Text>
                    </View>
                    <View className="items-end">
                       <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Advance</Text>
                       <Text className="text-emerald-500 font-black text-lg">₹{Number(b.advanceAmount).toLocaleString()}</Text>
                    </View>
                 </View>

                 <View className="flex-row justify-between items-center">
                    <Text className="text-slate-600 text-[9px] font-bold">{new Date(b.createdAt).toLocaleDateString()}</Text>
                    <View className="flex-row gap-2">
                       {status !== 'cancelled' && (
                         <TouchableOpacity 
                           onPress={() => handleCancelAndRepublish(b.id)}
                           className="w-10 h-10 bg-rose-500/10 rounded-xl items-center justify-center border border-rose-500/20"
                         >
                           <Ionicons name="refresh-outline" size={18} color="#f43f5e" />
                         </TouchableOpacity>
                       )}
                       <TouchableOpacity 
                         onPress={() => setSelectedBooking(b)}
                         className="flex-row px-4 h-10 bg-sky-500 rounded-xl items-center justify-center gap-2"
                       >
                          <Ionicons name="eye" size={14} color="white" />
                          <Text className="text-white font-black uppercase text-[9px] tracking-widest">Details</Text>
                       </TouchableOpacity>
                    </View>
                 </View>
               </TouchableOpacity>
             );
          })}
        </View>
      </ScrollView>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancelAndRepublish}
          onUpdateStatus={updateStatus}
        />
      )}
    </SafeAreaView>
  );
}

const BookingModal = ({ booking, onClose, onCancel, onUpdateStatus }: any) => {
  const [totalPrice, setTotalPrice] = useState<number>(booking.expected_price || booking.totalPrice || 0);
  const [negotiation, setNegotiation] = useState<number>(booking.negotiation || 0);
  const [advanceOverride, setAdvanceOverride] = useState<number>(booking.advanceAmount || 0);

  useEffect(() => {
    const fetchFullDetails = async () => {
      // If we already have a price, don't fetch (or if there's no vehicle ID)
      if (totalPrice > 0) return;

      const vId = booking.vehicleId || booking.bikeId || booking.id;
      if (!vId) return;

      try {
        const res = await apiService.getVehicleById(vId);
        if (res) {
          const price = (res as any).expected_price || (res as any).price;
          if (price) {
            setTotalPrice(Number(price));
          }
        }
      } catch (err) {
        console.error("Failed to fetch bike price:", err);
      }
    };
    fetchFullDetails();
  }, [booking, totalPrice]);

  const netPayable = Math.max(0, Number(totalPrice || 0) - Number(negotiation || 0) - Number(advanceOverride || 0));

  const handleSettle = () => {
    if (totalPrice <= 0) {
      Alert.alert("Error", "Please enter a valid vehicle price");
      return;
    }
    onUpdateStatus(booking.id, "Sold", {
      totalPrice,
      negotiation,
      advanceAmount: advanceOverride,
      paidAmount: netPayable,
      remainingAmount: 0
    });
    onClose();
  };

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, maxHeight: '90%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#1e293b', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-6">
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{booking.bookingId}</Text>
              <Text className="text-white text-2xl font-black uppercase tracking-tight">{booking.vehicleName}</Text>
              <Text className="text-sky-500 text-xs font-black uppercase tracking-widest mt-1">{booking.vehicleType}</Text>
            </View>

            <View className="flex-row gap-4 mb-8">
              <View className="flex-1 bg-slate-950 p-4 rounded-3xl border border-white/5">
                <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Advance Collected</Text>
                <Text className="text-emerald-500 text-xl font-black">₹{Number(booking.advanceAmount).toLocaleString()}</Text>
              </View>
              <View className="flex-1 bg-slate-950 p-4 rounded-3xl border border-white/5">
                <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Status</Text>
                <Text className="text-white text-sm font-black uppercase">{booking.status}</Text>
              </View>
            </View>

            <View className="space-y-4 mb-8">
               <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Settlement Form</Text>
               
               <View className="bg-slate-950 p-4 rounded-2xl border border-white/5 mb-4">
                  <Text className="text-slate-600 text-[8px] font-black uppercase mb-2">Final Bike Price</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(totalPrice)}
                    onChangeText={(val) => setTotalPrice(Number(val))}
                    className="text-white font-black text-lg p-0"
                  />
               </View>

               <View className="bg-slate-950 p-4 rounded-2xl border border-white/5 mb-4">
                  <Text className="text-slate-600 text-[8px] font-black uppercase mb-2">Advance Amount</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(advanceOverride)}
                    onChangeText={(val) => setAdvanceOverride(Number(val))}
                    className="text-emerald-500 font-black text-lg p-0"
                  />
               </View>

               <View className="bg-slate-950 p-4 rounded-2xl border border-white/5 mb-4">
                  <Text className="text-slate-600 text-[8px] font-black uppercase mb-2">Negotiation / Discount</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(negotiation)}
                    onChangeText={(val) => setNegotiation(Number(val))}
                    className="text-amber-500 font-black text-lg p-0"
                  />
               </View>

               <View className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mb-4">
                  <Text className="text-emerald-500/50 text-[8px] font-black uppercase mb-2">Net Payable</Text>
                  <Text className="text-emerald-500 font-black text-xl">₹{netPayable.toLocaleString()}</Text>
               </View>
            </View>

            <View className="flex-row gap-3 mb-10">
              <TouchableOpacity onPress={onClose} className="flex-1 h-14 bg-slate-800 rounded-2xl items-center justify-center">
                 <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Close</Text>
              </TouchableOpacity>
              
              {(booking.status || "").toLowerCase() !== "sold" && (booking.status || "").toLowerCase() !== "cancelled" && (
                <TouchableOpacity onPress={handleSettle} className="flex-[2] h-14 bg-white rounded-2xl items-center justify-center">
                   <Text className="text-black font-black uppercase tracking-widest text-[10px]">Commit Sale</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
