import React, { useEffect, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  SafeAreaView,
  FlatList,
  Platform
} from "react-native";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

const ITEMS_PER_PAGE = 8;

const StatCard = ({ title, value, iconName, IconComponent, gradientColors }: any) => (
  <View style={{ backgroundColor: COLORS.card }} className="mr-4 p-6 rounded-3xl border border-white/5 w-48 shadow-xl">
    <View className="flex-row justify-between items-start mb-6">
      <View className="w-12 h-12 rounded-2xl items-center justify-center bg-white/5">
        <IconComponent name={iconName} size={24} color={gradientColors[0]} />
      </View>
      <Text className="text-white/50 font-black text-[8px] uppercase tracking-widest leading-none">{title}</Text>
    </View>
    <Text className="text-white text-3xl font-black">{value}</Text>
  </View>
);

export default function AdminAssignServices() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [globalModalVisible, setGlobalModalVisible] = useState(false);

  const [mainTab, setMainTab] = useState("all"); 
  const [tab, setTab] = useState("unassigned");
  const [dateFilter, setDateFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("card"); 
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, apptsRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/appointments/all")
      ]);
      
      const bList = bookingsRes.data || [];
      const aRaw = apptsRes.data || [];
      const aList = Array.isArray(aRaw) ? aRaw : (aRaw.data || aRaw.appointments || []);
      
      // Combine list and tag appointments to distinguish them if needed
      const combined = [
        ...bList.map((b: any) => ({ ...b, isAppointment: false })),
        ...aList.map((a: any) => ({ ...a, isAppointment: true }))
      ];
      
      setBookings(combined);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get("/staff");
      const list = (res.data || []).filter((emp: any) => emp.status === "active");
      setEmployees(list);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const currentMainList = useMemo(() => {
    return bookings.filter(b => {
      const bStatus = (b.status || "").toLowerCase();
      if (mainTab === "all") return true;
      const isAddVehicle = b.addVehicle === 1 || b.addVehicle === "1" || b.uid === 'admin-created';
      return mainTab === "booked" ? !isAddVehicle : isAddVehicle;
    });
  }, [bookings, mainTab]);

  const dateFilteredList = useMemo(() => {
    return currentMainList.filter((b) => {
      const search = searchText.toLowerCase();
      const matchSearch =
        b.name?.toLowerCase().includes(search) ||
        b.phone?.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search) ||
        b.model?.toLowerCase().includes(search) ||
        b.vehicleNumber?.toLowerCase().includes(search) ||
        b.registrationNumber?.toLowerCase().includes(search) ||
        b.bookingId?.toLowerCase().includes(search) ||
        b.appointmentId?.toLowerCase().includes(search) ||
        b.id?.toString().toLowerCase().includes(search) ||
        b._id?.toString().toLowerCase().includes(search) ||
        b.assignedEmployeeName?.toLowerCase().includes(search);

      if (!matchSearch) return false;

      const bDateStr = b.created_at || b.createdAt;
      const bookingDate = bDateStr ? new Date(bDateStr) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "All") return true;

      if (!bookingDate) return false;
      const d = new Date(bookingDate);
      d.setHours(0, 0, 0, 0);

      if (dateFilter === "Today") return d.getTime() === today.getTime();
      if (dateFilter === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return d.getTime() === yesterday.getTime();
      }
      if (dateFilter === "This Week") {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return bookingDate >= lastWeek;
      }
      if (dateFilter === "This Month") {
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        return bookingDate >= lastMonth;
      }
      return true;
    });
  }, [currentMainList, searchText, dateFilter]);

  const stats = useMemo(() => {
    const list = dateFilteredList;
    return {
      unassigned: list.filter((b) => !(b.assignedEmployeeId || b.assignedEmployeeName || b.assigned_employee_id)).length,
      assigned: list.filter((b) => (b.assignedEmployeeId || b.assignedEmployeeName || b.assigned_employee_id) && !((b.serviceStatus || b.status || b.appointmentStatus || "").toLowerCase().includes("completed"))).length,
      approved: list.filter((b) => {
        const s = (b.serviceStatus || b.status || b.appointmentStatus || "").toLowerCase();
        return s === "approved" || s === "confirmed" || s.includes("booked") || s.includes("assigned");
      }).length,
      completed: list.filter((b) => (b.serviceStatus || b.status || "").toLowerCase().includes("completed")).length,
      total: list.length
    };
  }, [dateFilteredList]);

  const filteredBookings = useMemo(() => {
    return dateFilteredList.filter((b) => {
      const s = (b.serviceStatus || b.status || b.appointmentStatus || "").toLowerCase();
      const hasAssignee = !!(b.assignedEmployeeId || b.assignedEmployeeName || b.assigned_employee_id);
      
      if (tab === "unassigned") return !hasAssignee;
      if (tab === "assigned") return hasAssignee && !s.includes("completed");
      if (tab === "approved") return s === "approved" || s === "confirmed" || s.includes("booked") || s.includes("assigned");
      if (tab === "completed") return s.includes("completed");
      return true;
    });
  }, [dateFilteredList, tab]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const openAssignModal = async (booking: any) => {
    setSelectedBooking(booking);
    setSelectedEmployeeId("");
    await fetchEmployees();
    setModalVisible(true);
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    try {
      setAssigning(true);
      const selectedEmployee = employees.find(
        (emp) => (emp.id || emp._id).toString() === selectedEmployeeId.toString()
      );
      if (!selectedEmployee) return Alert.alert("Error", "Mechanic not found");

      const bookingId = selectedBooking.id || selectedBooking._id;
      await api.put(`/bookings/assign/${bookingId}`, {
        assignedEmployeeId: selectedEmployee.id || selectedEmployee._id,
        assignedEmployeeName: selectedEmployee.name,
        status: "Assigned"
      });

      Alert.alert("Success", `Mechanic ${selectedEmployee.name} assigned successfully`);
      setModalVisible(false);
      setGlobalModalVisible(false);
      setSelectedBooking(null);
      setSelectedEmployeeId("");
      fetchData();
    } catch (e) {
      Alert.alert("Error", "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-GB"),
      time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    };
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="px-6 pt-10 pb-8 flex-row justify-between items-start">
           <View>
             <Text className="text-white text-3xl font-black tracking-tighter uppercase italic">Assign</Text>
             <Text className="text-white/50 font-black text-[8px] uppercase tracking-widest mt-1">Personnel Management</Text>
           </View>
           <TouchableOpacity 
             onPress={async () => {
               setSelectedBooking(null);
               setSelectedEmployeeId("");
               await fetchEmployees();
               setGlobalModalVisible(true);
             }}
             className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-xl shadow-white/10"
           >
              <Ionicons name="person-add" size={20} color="black" />
           </TouchableOpacity>
        </View>

        {/* ANALYTICS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-10">
           <StatCard title="Open Orders" value={stats.unassigned} iconName="user-slash" IconComponent={FontAwesome5Wrapper} gradientColors={["#F59E0B"]} />
           <StatCard title="Active Jobs" value={stats.assigned} iconName="user-check" IconComponent={FontAwesome5Wrapper} gradientColors={["#3B82F6"]} />
           <StatCard title="Verified" value={stats.approved} iconName="clipboard-check" IconComponent={FontAwesome5Wrapper} gradientColors={["#6366F1"]} />
           <StatCard title="Closed" value={stats.completed} iconName="check-circle" IconComponent={FontAwesome5Wrapper} gradientColors={["#10B981"]} />
        </ScrollView>

        {/* MAIN TABS */}
        <View className="px-6 mb-8 flex-row bg-white/5 p-2 rounded-3xl border border-white/10">
           {[
             { id: "all", label: "Global" },
             { id: "booked", label: "Portal" },
             { id: "addVehicle", label: "Walk-ins" }
           ].map(t => (
             <TouchableOpacity 
               key={t.id} 
               onPress={() => { setMainTab(t.id); setCurrentPage(1); }} 
               className={`flex-1 py-4 rounded-3xl items-center ${mainTab === t.id ? "bg-white" : ""}`}
             >
                <Text className={`font-black text-[10px] uppercase tracking-widest ${mainTab === t.id ? "text-black" : "text-white/40"}`}>{t.label}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* SEARCH & FILTERS */}
        <View className="px-6 mb-8 gap-4">
           <View className="flex-row items-center bg-white/5 border border-white/10 rounded-3xl px-6 py-5">
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput 
                placeholder="Search Registry..."
                placeholderTextColor={COLORS.textMuted}
                className="flex-1 ml-4 text-white font-bold text-sm"
                value={searchText}
                onChangeText={(val) => { setSearchText(val); setCurrentPage(1); }}
              />
           </View>

           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
             {[
               { id: "unassigned", label: `Open (${stats.unassigned})` },
               { id: "assigned", label: `Active (${stats.assigned})` },
               { id: "approved", label: `Verified (${stats.approved})` },
               { id: "completed", label: `Closed (${stats.completed})` },
               { id: "all", label: `Full (${stats.total})` }
             ].map(s => (
               <TouchableOpacity 
                 key={s.id} 
                 onPress={() => { setTab(s.id); setCurrentPage(1); }} 
                 className={`px-6 py-4 rounded-2xl border ${tab === s.id ? "bg-white border-white" : "bg-white/5 border-white/10"}`}
               >
                  <Text className={`text-[9px] font-black uppercase tracking-widest ${tab === s.id ? "text-black" : "text-white/40"}`}>{s.label}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        {/* CONTENT */}
        <View className="px-6 gap-6">
           {paginatedBookings.length === 0 ? (
             <View className="bg-white/5 p-20 rounded-3xl items-center border border-dashed border-white/10">
                <Feather name="inbox" size={48} color={COLORS.textMuted} />
                <Text className="text-white/20 font-black text-[10px] uppercase mt-4">No Records Encountered</Text>
             </View>
           ) : (
             paginatedBookings.map((item: any) => (
               <View key={item.id || item._id} style={{ backgroundColor: COLORS.card }} className="p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                  <View className="flex-row justify-between items-start mb-6">
                     <View>
                        <Text className="text-white/50 font-black text-[8px] uppercase">DB-ID: {item.id || item._id}</Text>
                        <Text className="text-white font-black text-sm uppercase">{item.appointmentId || item.bookingId || (item.id ? `ID-${item.id}` : "SVC-NEW")}</Text>
                     </View>
                     <View className="flex-row gap-2">
                        {item.isAppointment && (
                          <View className="px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10">
                            <Text className="text-sky-400 text-[8px] font-black uppercase">APPOINTMENT</Text>
                          </View>
                        )}
                        <View className={`px-4 py-1.5 rounded-full border border-white/10 bg-white/5`}>
                           <Text className="text-white/40 text-[9px] font-black uppercase">{(item.serviceStatus || item.status || item.appointmentStatus || "BOOKED").toUpperCase()}</Text>
                        </View>
                     </View>
                  </View>

                  <View className="mb-6">
                     <View className="flex-row items-center gap-2 mb-2">
                        <View className={`px-3 py-1 rounded-lg ${item.vehicleType === 'bike' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                           <Text className={`text-[8px] font-black uppercase ${item.vehicleType === 'bike' ? 'text-orange-400' : 'text-blue-400'}`}>{item.vehicleType || 'Car'}</Text>
                        </View>
                        <Text className="text-white text-xl font-black uppercase">{item.brand} {item.model}</Text>
                     </View>
                     {(item.vehicleNumber || item.registrationNumber) && <Text className="text-sky-500 font-bold text-xs bg-sky-500/10 px-3 py-1 rounded-lg self-start border border-sky-500/20">{item.vehicleNumber || item.registrationNumber}</Text>}
                  </View>

                  <View className="bg-black/20 p-6 rounded-2xl gap-4 mb-8 border border-white/5">
                     <View className="flex-row justify-between border-b border-white/5 pb-4 mb-2">
                        <View className="flex-row items-center gap-3">
                           <Ionicons name="calendar-outline" size={14} color="#666" />
                           <Text className="text-white/60 font-bold text-[10px]">{formatDateTime(item.created_at || item.createdAt).date}</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                           <Ionicons name="time-outline" size={14} color="#666" />
                           <Text className="text-white/60 font-bold text-[10px]">{formatDateTime(item.created_at || item.createdAt).time}</Text>
                        </View>
                     </View>
                     <View className="flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"><Text className="text-white font-black">{item.name?.charAt(0)}</Text></View>
                        <View className="flex-1">
                           <Text className="text-white/20 text-[8px] font-black uppercase">Customer</Text>
                           <Text className="text-white text-xs font-black uppercase">{item.name}</Text>
                        </View>
                        {item.phone && <TouchableOpacity onPress={() => {}} className="w-10 h-10 bg-sky-500/10 rounded-xl items-center justify-center border border-sky-500/20"><Ionicons name="call" size={16} color="#0EA5E9" /></TouchableOpacity>}
                     </View>
                     {(item.assignedEmployeeName || item.assignedEmployeeId || item.assignedEmployee) && (
                       <View className="flex-row items-center gap-4 mt-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <Ionicons name="construct" size={16} color="#10B981" />
                          <View>
                             <Text className="text-emerald-500/40 text-[8px] font-black uppercase">Assigned Technician</Text>
                             <Text className="text-emerald-500 text-xs font-black uppercase">{item.assignedEmployeeName || item.assignedEmployee?.name || "Service Personnel"}</Text>
                          </View>
                       </View>
                     )}
                  </View>

                  {!item.assignedEmployeeId && !item.assignedEmployeeName && !item.assignedEmployee?._id ? (
                    <TouchableOpacity 
                      onPress={() => openAssignModal(item)}
                      className="w-full bg-white py-5 rounded-2xl items-center shadow-xl shadow-white/5 active:scale-[0.98]"
                    >
                       <Text className="text-black font-black text-[10px] uppercase tracking-widest">Assign Mechanic</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="w-full bg-white/5 py-4 rounded-xl items-center border border-white/10">
                       <Text className="text-white/20 font-black text-[10px] uppercase">Secure Allocation Locked</Text>
                    </View>
                  )}
               </View>
             ))
           )}

           {/* PAGINATION */}
           {totalPages > 1 && (
             <View className="flex-row justify-center items-center gap-6 mt-10">
                <TouchableOpacity disabled={currentPage === 1} onPress={() => setCurrentPage(p => Math.max(1, p - 1))} className={`w-12 h-12 rounded-2xl items-center justify-center border border-white/10 ${currentPage === 1 ? "opacity-20" : "bg-white/5"}`}><Ionicons name="chevron-back" size={20} color="white" /></TouchableOpacity>
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">Page {currentPage} / {totalPages}</Text>
                <TouchableOpacity disabled={currentPage === totalPages} onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={`w-12 h-12 rounded-2xl items-center justify-center border border-white/10 ${currentPage === totalPages ? "opacity-20" : "bg-white/5"}`}><Ionicons name="chevron-forward" size={20} color="white" /></TouchableOpacity>
             </View>
           )}
        </View>
      </ScrollView>

      {/* ASSIGNMENT MODAL */}
      <Modal visible={modalVisible || globalModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
           <View className="bg-slate-950 border-t border-white/10 rounded-t-[3rem] p-10">
              <View className="w-16 h-1 w-full bg-white/10 rounded-full mb-8 self-center" />
              <Text className="text-white text-2xl font-black uppercase text-center mb-2">Technician Selection</Text>
              <Text className="text-white/40 text-[9px] uppercase text-center mb-8 tracking-widest">Authorize personnel for service fulfillment</Text>

              {!selectedBooking && globalModalVisible && (
                <View className="mb-6">
                   <Text className="text-white/40 text-[9px] font-black uppercase mb-3 ml-2">Select Approved Protocol</Text>
                   <ScrollView style={{ maxHeight: 200 }} className="bg-white/5 border border-white/10 rounded-2xl p-2">
                     {bookings
                      .filter(b => !(b.assignedEmployeeId || b.assignedEmployeeName || b.assigned_employee_id) && ((b.serviceStatus || b.status || "").toLowerCase() === "approved" || (b.serviceStatus || b.status || "").toLowerCase() === "confirmed"))
                      .map(b => (
                        <TouchableOpacity key={b.id || b._id} onPress={() => setSelectedBooking(b)} className={`p-4 rounded-xl mb-1 ${selectedBooking?.id === (b.id || b._id) ? "bg-white" : ""}`}>
                          <Text className={`font-bold text-xs uppercase ${selectedBooking?.id === (b.id || b._id) ? "text-black" : "text-white"}`}>{b.brand} {b.model} - {b.name}</Text>
                        </TouchableOpacity>
                      ))}
                   </ScrollView>
                </View>
              )}

              <View className="mb-8">
                 <Text className="text-white/40 text-[9px] font-black uppercase mb-3 ml-2">Available Squad</Text>
                 <ScrollView style={{ maxHeight: 250 }} className="bg-white/5 border border-white/10 rounded-2xl p-2">
                   {employees.map(emp => (
                     <TouchableOpacity key={emp.id} onPress={() => setSelectedEmployeeId(emp.id)} className={`p-5 rounded-xl mb-1 flex-row justify-between items-center ${selectedEmployeeId === emp.id ? "bg-white" : ""}`}>
                       <Text className={`font-black text-xs uppercase ${selectedEmployeeId === emp.id ? "text-black" : "text-white"}`}>{emp.name}</Text>
                       {selectedEmployeeId === emp.id && <Ionicons name="checkmark-circle" size={20} color="black" />}
                     </TouchableOpacity>
                   ))}
                   {employees.length === 0 && <Text className="text-white/20 p-5 text-center text-[10px] font-black uppercase">No Active Personnel</Text>}
                 </ScrollView>
              </View>

              <View className="flex-row gap-4 mb-4">
                 <TouchableOpacity onPress={() => { setModalVisible(false); setGlobalModalVisible(false); }} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 items-center">
                    <Text className="text-white/40 font-black text-[10px] uppercase tracking-widest">Abort</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={assignEmployee} 
                   disabled={!selectedBooking || !selectedEmployeeId || assigning}
                   className={`flex-1 py-5 rounded-2xl bg-white items-center ${(!selectedBooking || !selectedEmployeeId) ? "opacity-20" : ""}`}
                 >
                    {assigning ? <ActivityIndicator size="small" color="black" /> : <Text className="text-black font-black text-[10px] uppercase tracking-widest">Authorize</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const FontAwesome5Wrapper = ({ name, size, color }: any) => {
  const mapping: any = {
    'user-slash': 'person-remove',
    'user-check': 'person-add',
    'clipboard-check': 'clipboard',
    'check-circle': 'checkmark-circle'
  };
  return <Ionicons name={mapping[name] || name} size={size} color={color} />;
};
