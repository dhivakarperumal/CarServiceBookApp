import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function EmployeeNotificationDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssigned = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/all-services");
      const allServices = res.data || [];

      const todayStr = new Date().toDateString();
      const bookings = allServices.filter((b: any) => {
        const myDisplayName =
          user?.username ||
          (user as any)?.displayName ||
          (user as any)?.name ||
          "";

        const isMine =
          (b.assignedEmployeeName || "").toLowerCase() ===
            myDisplayName.toLowerCase() && b.status !== "Cancelled";

        if (!isMine) return false;

        const dStr = b.created_at || b.createdAt || b.preferredDate;
        const isToday = dStr && new Date(dStr).toDateString() === todayStr;

        return isToday && !b.status?.toLowerCase().includes("completed");
      });
      
      // Sort by newest first
      bookings.sort((a: any, b: any) => {
        const dateA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
        const dateB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setAssignedBookings(bookings.slice(0, 5)); // show up to 5
    } catch (e) {
      console.warn("Error fetching assigned bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDropdownVisible) {
      fetchAssigned();
    }
  }, [isDropdownVisible, user]);

  const assignedCount = assignedBookings.length;

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(true)}
        activeOpacity={0.7}
        className="p-2 bg-[#111827] rounded-2xl border border-[#334155] relative"
      >
        <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
        {assignedCount > 0 && (
          <View className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full items-center justify-center">
            <Text className="text-white text-[8px] font-black">{assignedCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setIsDropdownVisible(false)}
        />

        <View className="absolute top-20 right-5 w-80 max-h-[70%] bg-slate-800 rounded-[24px] border border-white/5 py-4 shadow-2xl overflow-hidden">
          <View className="px-5 py-2 border-b border-white/5 mb-2">
            <Text className="text-white font-bold text-[15px]">
              Notifications
            </Text>
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[8px] mt-1 mb-2">
              {assignedCount} NEW UPDATES TODAY
            </Text>
          </View>
          
          <ScrollView className="max-h-[300px]">
          {loading ? (
             <View className="p-8 items-center justify-center">
                 <ActivityIndicator size="small" color="#0ea5e9" />
             </View>
          ) : assignedCount > 0 ? (
            assignedBookings.map((b, idx) => (
              <TouchableOpacity
                key={b.id || idx}
                onPress={() => {
                  setIsDropdownVisible(false);
                  router.push("/(employee)/assigned");
                }}
                className={`px-5 py-4 flex-row gap-4 border-b border-white/5`}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-sky-500/10 items-center justify-center border border-sky-500/20">
                  <Ionicons name="car-outline" size={16} color="#0ea5e9" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm tracking-tight">{b.name || b.customerName || "Customer"}</Text>
                  <Text className="text-slate-300 font-black text-[11px] uppercase tracking-wider mt-0.5">{b.bookingId || b.id || "N/A"}</Text>
                  <Text className="text-slate-400 text-[10px] mt-1" numberOfLines={1}>
                    {b.brand} {b.model} - {b.name || "Customer"}
                  </Text>
                  <Text className="text-slate-500 font-bold text-[9px] mt-2">
                    {formatTime(b.created_at || b.createdAt || new Date().toISOString())}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
             <View className="p-8 items-center justify-center">
               <Text className="text-slate-400 text-xs">No active assignments</Text>
             </View>
          )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setIsDropdownVisible(false);
              router.push("/(employee)/assigned");
            }}
            className="mt-2 py-4 items-center justify-center"
          >
            <Text className="text-white font-black text-xs">View All Notifications</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
