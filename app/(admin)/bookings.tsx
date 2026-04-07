import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, RefreshControl, Modal, 
  Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useRouter } from 'expo-router';

/* 🎨 CONFIG */
const BOOKING_STATUS = ["Booked", "Call Verified", "Approved", "Cancelled", "Service Completed"];

const statusColors: any = {
  "Approved": { bg: "bg-indigo-950", text: "text-indigo-400", border: "border-indigo-900" },
  "Service Completed": { bg: "bg-emerald-950", text: "text-emerald-400", border: "border-emerald-900" },
  "Cancelled": { bg: "bg-red-950", text: "text-red-400", border: "border-red-900" },
  "Call Verified": { bg: "bg-sky-950", text: "text-sky-400", border: "border-sky-900" },
  "Booked": { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" },
};

export default function AdminBookings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  /* 🔴 MODAL STATE */
  const [popup, setPopup] = useState<{ type: 'status' | 'approved' | 'cancel', booking: any } | null>(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const fetchData = async () => {
    try {
      const data = await apiService.getBookings();
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.created_at || b.createdAt || 0).getTime() - 
        new Date(a.created_at || a.createdAt || 0).getTime()
      );
      setBookings(sorted);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        (b.bookingId || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.phone || '').includes(search);
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  const updateStatus = async (booking: any, newStatus: string, extraData = {}) => {
    try {
      await apiService.updateBookingStatus(booking.id, {
        status: newStatus,
        ...extraData
      });

      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: newStatus, ...extraData } : b
      ));
      
      Alert.alert("Success", `Status updated to ${newStatus}`);
    } catch (err) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setPopup(null);
    }
  };

  const handleStatusChange = (booking: any, newStatus: string) => {
    if (booking.status === "Service Completed") return;

    if (newStatus === "Approved") {
      setPopup({ type: "approved", booking });
      return;
    }
    if (newStatus === "Cancelled") {
      setPopup({ type: "cancel", booking });
      return;
    }

    updateStatus(booking, newStatus);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-4 border-b border-white/5 bg-slate-950">
         <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-black text-xl uppercase tracking-tighter">Global Bookings</Text>
            <TouchableOpacity 
                onPress={() => router.push('/booking-form')} 
               className="bg-sky-500 px-4 py-2 rounded-full shadow-lg shadow-sky-500/20"
            >
               <Text className="text-white font-black text-[10px] uppercase">+ New Booking</Text>
            </TouchableOpacity>
         </View>

         {/* 🔎 SEARCH & FILTER */}
         <View className="flex-row gap-2">
            <View className="flex-1 bg-slate-900 rounded-2xl flex-row items-center px-4 h-12 border border-slate-800">
                <Ionicons name="search" size={18} color="#475569" />
                <TextInput 
                   placeholder="Search..."
                   placeholderTextColor="#475569"
                   value={search}
                   onChangeText={setSearch}
                   className="flex-1 ml-2 text-white font-bold text-xs"
                />
            </View>
            <TouchableOpacity 
               onPress={() => {
                  const nextStatus = statusFilter === "All" ? "Booked" : 
                                    statusFilter === "Booked" ? "Approved" : 
                                    statusFilter === "Approved" ? "Cancelled" : "All";
                  setStatusFilter(nextStatus);
               }}
               className="bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center border border-slate-800"
            >
                <Ionicons name="filter" size={20} color={statusFilter === "All" ? "#475569" : "#0ea5e9"} />
                {statusFilter !== "All" && (
                   <View className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full" />
                )}
            </TouchableOpacity>
         </View>
         {statusFilter !== "All" && (
            <View className="mt-2 flex-row">
               <View className="bg-sky-950 border border-sky-900 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-sky-500 font-black text-[9px] uppercase">{statusFilter}</Text>
                  <TouchableOpacity onPress={() => setStatusFilter("All")} className="ml-2">
                     <Ionicons name="close-circle" size={12} color="#0ea5e9" />
                  </TouchableOpacity>
               </View>
            </View>
         )}
      </View>

      <ScrollView 
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {filtered.length === 0 ? (
          <View className="p-10 items-center justify-center bg-slate-900 rounded-3xl border border-slate-800 mt-4 border-dashed">
            <Ionicons name="calendar-outline" size={48} color="#475569" className="mb-4" />
            <Text className="text-white font-black text-xs uppercase">No matching records found</Text>
          </View>
        ) : (
          filtered.map((b, i) => (
            <View 
              key={b.id} 
              className={`mb-4 p-4 rounded-3xl bg-slate-900 border border-slate-800`}
            >
               <View className="flex-row justify-between items-start mb-4">
                  <View>
                     <Text className="text-sky-500 font-black text-[9px] uppercase tracking-widest">{b.bookingId || `#${b.id}`}</Text>
                     <Text className="text-white font-black text-base mt-0.5 tracking-tighter">{b.name || "Customer"}</Text>
                  </View>
                  <View className={`${statusColors[b.status]?.bg || 'bg-slate-800'} px-3 py-1.5 rounded-full border ${statusColors[b.status]?.border || 'border-slate-700'}`}>
                     <Text className={`${statusColors[b.status]?.text || 'text-slate-400'} font-black text-[9px] uppercase tracking-widest`}>{b.status}</Text>
                  </View>
               </View>

               <View className="flex-row items-center gap-4 mb-4">
                  <View className="bg-slate-800 px-2 py-1 rounded-lg flex-row items-center gap-1.5">
                     <Ionicons name="car" size={14} color="#94a3b8" />
                     <Text className="text-slate-400 font-black text-[10px] tracking-tighter uppercase">{b.brand} · {b.model}</Text>
                  </View>
                  <View className="bg-slate-800 px-2 py-1 rounded-lg flex-row items-center gap-1.5">
                     <Ionicons name="call" size={12} color="#94a3b8" />
                     <Text className="text-slate-400 font-black text-[10px] tracking-tighter">{b.phone}</Text>
                  </View>
               </View>

               <View className="flex-row justify-between items-center bg-slate-950 -mx-4 -mb-4 p-3 border-t border-slate-800">
                  <View className="flex-row items-center gap-1.5 ml-2">
                     <Ionicons name="time-outline" size={12} color="#475569" />
                     <Text className="text-slate-500 text-[9px] font-black uppercase">
                        {new Date(b.created_at || b.createdAt).toLocaleDateString()}
                     </Text>
                  </View>
                  <TouchableOpacity 
                     onPress={() => setPopup({ type: 'status', booking: b })}
                     className="bg-slate-800 px-4 py-2 rounded-xl mr-2"
                  >
                     <Text className="text-white font-black text-[9px] uppercase">Update Status</Text>
                  </TouchableOpacity>
               </View>
            </View>
          ))
        )}
        <View className="h-20" />
      </ScrollView>

      {/* 🔴 MODAL: STATUS SELECTION */}
      <Modal visible={!!popup} transparent animationType="slide">
         <View className="flex-1 bg-black justify-end">
            <View className="bg-slate-900 rounded-t-3xl p-6 pb-12">
               <View className="w-12 h-1 bg-slate-800 rounded-full self-center mb-6" />
               
               {popup?.type === 'status' && (
                  <>
                     <Text className="text-white font-black text-xl uppercase tracking-tighter text-center mb-6">Change Status</Text>
                     <View className="gap-3">
                        {BOOKING_STATUS.map(s => (
                           <TouchableOpacity 
                              key={s} 
                              onPress={() => handleStatusChange(popup.booking, s)}
                              className={`p-5 rounded-2xl ${popup.booking.status === s ? 'bg-sky-500' : 'bg-slate-800'} flex-row justify-between items-center`}
                           >
                              <Text className={`${popup.booking.status === s ? 'text-white' : 'text-slate-400'} font-black text-xs uppercase`}>{s}</Text>
                              {popup.booking.status === s && <Ionicons name="checkmark-circle" size={20} color="white" />}
                           </TouchableOpacity>
                        ))}
                     </View>
                  </>
               )}

               {popup?.type === 'approved' && (
                  <>
                     <Text className="text-white font-black text-xl uppercase tracking-tighter text-center mb-2">Approve Booking</Text>
                     <Text className="text-slate-400 text-xs text-center mb-6">Enter a tracking number for this service.</Text>
                     <TextInput 
                        placeholder="TRACK NUMBER"
                        placeholderTextColor="#475569"
                        autoFocus
                        value={trackNumber}
                        onChangeText={setTrackNumber}
                        className="bg-slate-800 p-5 rounded-2xl text-white font-black uppercase text-center mb-6 border border-slate-700"
                     />
                     <TouchableOpacity 
                        onPress={() => updateStatus(popup.booking, "Approved", { trackNumber })}
                        className="bg-sky-500 p-5 rounded-2xl items-center shadow-lg shadow-sky-900"
                     >
                        <Text className="text-white font-black uppercase tracking-widest">Confirm Approval</Text>
                     </TouchableOpacity>
                  </>
               )}

               {popup?.type === 'cancel' && (
                  <>
                     <Text className="text-white font-black text-xl uppercase tracking-tighter text-center mb-2">Cancel Service</Text>
                     <Text className="text-red-400 text-xs text-center mb-6 uppercase tracking-widest font-black">Reason Required</Text>
                     <TextInput 
                        placeholder="REASON FOR CANCELLATION"
                        placeholderTextColor="#475569"
                        autoFocus
                        multiline
                        numberOfLines={3}
                        value={cancelReason}
                        onChangeText={setCancelReason}
                        className="bg-slate-800 p-5 rounded-2xl text-white font-bold text-sm mb-6 border border-slate-700 min-h-[100px]"
                     />
                     <TouchableOpacity 
                        onPress={() => updateStatus(popup.booking, "Cancelled", { cancelReason })}
                        className="bg-red-500 p-5 rounded-2xl items-center shadow-lg shadow-red-900"
                     >
                        <Text className="text-white font-black uppercase tracking-widest">Submit Cancellation</Text>
                     </TouchableOpacity>
                  </>
               )}

               <TouchableOpacity 
                  onPress={() => setPopup(null)}
                  className="mt-6 p-4 items-center"
               >
                  <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Dismiss</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
}
