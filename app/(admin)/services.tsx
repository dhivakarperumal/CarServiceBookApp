import React, { useEffect, useMemo, useState } from "react";
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
  StyleSheet
} from "react-native";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_STEPS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const StatCard = ({ title, value, IconComponent, iconName, iconColor }: any) => (
  <View style={{ backgroundColor: COLORS.card }} className="mr-4 p-5 rounded-3xl border border-white/5 w-48 shadow-lg">
    <View className="flex-row justify-between items-start mb-6">
      <View className="w-12 h-12 rounded-2xl items-center justify-center bg-white/5">
        <IconComponent name={iconName} size={24} color={iconColor} />
      </View>
      <Text className="text-white/20 font-black text-[8px] uppercase tracking-widest">{title}</Text>
    </View>
    <Text className="text-white text-3xl font-black">{value}</Text>
  </View>
);

export default function Services() {
  const router = useRouter();
  const { user: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";

  const [mainTab, setMainTab] = useState("booked"); 
  const [subTab, setSubTab] = useState("assigned"); 
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [issueEntries, setIssueEntries] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState("issues");
  const [editingParts, setEditingParts] = useState<any>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
      ]);
      
      const servicesData = servRes.data || [];
      const servicesWithDetails = [];

      for (const service of servicesData) {
        try {
          const detailRes = await api.get(`/all-services/${service.id}`);
          const details = detailRes.data || {};
          servicesWithDetails.push({ 
            ...service, 
            parts: details.parts || [], 
            issues: details.issues || [] 
          });
        } catch (err) {
          servicesWithDetails.push({ ...service, parts: [], issues: [] });
        }
      }
      
      setServices(servicesWithDetails);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const searchedServices = useMemo(() => {
    return services.filter((s: any) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
      
      const bDateStr = s.created_at || s.createdAt;
      if (dateFilter === "All Time") return true;
      if (!bDateStr) return false;

      const bookingDate = new Date(bDateStr);
      const today = new Date();
      if (dateFilter === "Today") return bookingDate.toDateString() === today.toDateString();
      if (dateFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return bookingDate.toDateString() === yesterday.toDateString();
      }
      if (dateFilter === "This Week") {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        return bookingDate >= lastWeek;
      }
      if (dateFilter === "This Month") {
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 30);
        lastMonth.setHours(0, 0, 0, 0);
        return bookingDate >= lastMonth;
      }
      return true;
    });
  }, [services, search, dateFilter]);

  const stats = useMemo(() => {
    const relevantServices = isMechanic 
      ? services.filter((s: any) => (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.username || "").toLowerCase())
      : services;

    return {
      total: relevantServices.length,
      assigned: relevantServices.filter((s: any) => !!s.assignedEmployeeId).length,
      unassigned: isMechanic ? 0 : relevantServices.filter((s: any) => !s.assignedEmployeeId).length,
      completed: relevantServices.filter((s: any) => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat.includes("completed") || sStat.includes("bill completed");
      }).length
    };
  }, [services, isMechanic, userProfile]);

  const currentMainList = mainTab === "booked" ? searchedServices.filter((s: any) => !s.addVehicle) : searchedServices.filter((s: any) => s.addVehicle);
  
  const assignedServices = currentMainList.filter((s: any) => {
    if (!s.assignedEmployeeId) return false;
    if (isMechanic) return (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.username || "").toLowerCase();
    return true;
  });
  
  const unassignedServices = isMechanic ? [] : currentMainList.filter((s: any) => !s.assignedEmployeeId);
  const listData = subTab === "assigned" ? assignedServices : unassignedServices;

  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getMappedStatus = (status: string) => {
    if (!status) return "Booked";
    const found = STATUS_STEPS.find(s => s.toLowerCase() === status.toLowerCase());
    return found || "Booked";
  };

  const getStatusColor = (status: string) => {
    const mapped = getMappedStatus(status);
    switch (mapped) {
      case "Booked": case "Approved": return COLORS.primary;
      case "Processing": return "#A855F7";
      case "Waiting for Spare": return COLORS.warning;
      case "Service Going on": return "#F97316";
      case "Bill Pending": return "#EC4899";
      case "Bill Completed": return "#06B6D4";
      case "Service Completed": return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to delete this record?",
      [
        { text: "Abort", style: "cancel" },
        { 
          text: "Confirm", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/all-services/${id}`);
              Alert.alert("Registry Updated", "Service record purged successfully.");
              loadData();
            } catch {
              Alert.alert("Protocol Error", "Failed to delete service record.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/all-services/${id}/status`, { serviceStatus: newStatus });
      Alert.alert("Success", `Status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    try {
      setAssigning(true);
      const emp: any = employees.find((e: any) => e.id.toString() === selectedEmployeeId.toString());
      if (!emp) return Alert.alert("Error", "Mechanic not found");
      await api.put(`/all-services/${selectedBooking.id}/assign`, { 
        assignedEmployeeId: emp.id, 
        assignedEmployeeName: emp.name, 
        serviceStatus: "Processing" 
      });
      Alert.alert("Success", `Mechanic ${emp.name} assigned!`);
      setModalVisible(false); loadData();
    } catch {
      Alert.alert("Error", "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenIssueModal = (item: any) => {
    setEditingIssueId(item.id);
    let initialIssues = [...(item.issues || [])];
    if (initialIssues.length === 0) {
      const mainIssueText = item.issue || item.otherIssue || item.carIssue || "Routine Checkup";
      initialIssues = [{
        issue: mainIssueText,
        issueAmount: item.issueAmount || 0,
        issueStatus: item.issueStatus || 'pending'
      }];
    }
    setIssueEntries(initialIssues);
    setEditingParts([...(item.parts || [])]);
    setActiveModalTab("issues");
    setIssueModalVisible(true);
  };

  if (loading && services.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="px-6 pt-10 pb-8">
           <View className="flex-row justify-between items-start">
             <View>
                <Text className="text-white text-3xl font-black uppercase">Service Ops</Text>
                <Text className="text-sky-500 font-bold text-[9px] uppercase mt-2">Technical Workflow</Text>
             </View>
             <TouchableOpacity 
               onPress={() => router.push({ pathname: '/(employee)/add-parts' as any })}
               className="w-12 h-12 bg-white rounded-2xl items-center justify-center"
             >
                <Ionicons name="add" size={24} color="black" />
             </TouchableOpacity>
           </View>
        </View>

        {/* Stats Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-10">
          <StatCard title="Active Volume" value={stats.total} IconComponent={MaterialCommunityIcons} iconName="gauge" iconColor={COLORS.primary} />
          <StatCard title="In Field" value={stats.assigned} IconComponent={Ionicons} iconName="construct" iconColor="#818CF8" />
          <StatCard title="In Queue" value={stats.unassigned} IconComponent={Ionicons} iconName="timer" iconColor="#FBBF24" />
          <StatCard title="Decommissioned" value={stats.completed} IconComponent={Ionicons} iconName="checkmark-done" iconColor="#34D399" />
        </ScrollView>

        {/* Tabs */}
        <View className="px-6 mb-8 flex-row bg-white/5 p-2 rounded-3xl border border-white/10">
           <TouchableOpacity onPress={() => { setMainTab("booked"); setCurrentPage(1); }} className={`flex-1 py-4 rounded-3xl items-center ${mainTab === "booked" ? "bg-white" : ""}`}>
              <Text className={`font-black text-[10px] uppercase ${mainTab === "booked" ? "text-black" : "text-white/40"}`}>Portal Logs</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setMainTab("addVehicle"); setCurrentPage(1); }} className={`flex-1 py-4 rounded-3xl items-center ${mainTab === "addVehicle" ? "bg-white" : ""}`}>
              <Text className={`font-black text-[10px] uppercase ${mainTab === "addVehicle" ? "text-black" : "text-white/40"}`}>Walk-ins</Text>
           </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-6 mb-8 gap-4">
           <View className="flex-row items-center bg-white/5 border border-white/10 rounded-3xl px-6 py-5">
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput 
                placeholder="Search Registry..."
                placeholderTextColor={COLORS.textMuted}
                className="flex-1 ml-4 text-white font-bold text-sm"
                value={search}
                onChangeText={(val) => { setSearch(val); setCurrentPage(1); }}
              />
           </View>
           <View className="flex-row gap-4">
              <View className="flex-1 flex-row bg-white/5 p-1 rounded-2xl border border-white/10">
                 <TouchableOpacity onPress={() => { setSubTab("assigned"); setCurrentPage(1); }} className={`flex-1 py-3 rounded-xl items-center ${subTab === "assigned" ? "bg-slate-800" : ""}`}>
                   <Text className={`text-[8px] font-black uppercase ${subTab === "assigned" ? "text-white" : "text-white/20"}`}>Active ({assignedServices.length})</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => { setSubTab("unassigned"); setCurrentPage(1); }} className={`flex-1 py-3 rounded-xl items-center ${subTab === "unassigned" ? "bg-slate-800" : ""}`}>
                   <Text className={`text-[8px] font-black uppercase ${subTab === "unassigned" ? "text-white" : "text-white/20"}`}>Queue ({unassignedServices.length})</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>

        {/* List */}
        <View className="px-6 gap-8">
          {paginatedData.map((item: any) => (
            <View key={item.id} style={{ backgroundColor: COLORS.card }} className="p-8 rounded-3xl border border-white/5 shadow-xl">
               <View className="flex-row justify-between items-start mb-8">
                  <View>
                    <Text className="text-white/20 font-black text-[8px] uppercase">ID: {item.bookingId || item.id}</Text>
                    <Text className="text-sky-400 font-black text-sm uppercase">{item.brand} {item.model}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedBooking(item); setStatusModalVisible(true); }} style={{ backgroundColor: getStatusColor(item.serviceStatus || item.status) + '20', borderColor: getStatusColor(item.serviceStatus || item.status) + '40' }} className="px-4 py-2 rounded-full border">
                     <Text style={{ color: getStatusColor(item.serviceStatus || item.status) }} className="text-[9px] font-black uppercase">{getMappedStatus(item.serviceStatus || item.status)}</Text>
                  </TouchableOpacity>
               </View>
               <View className="bg-black/20 rounded-2xl p-4 gap-4 mb-6 border border-white/5">
                  <View className="flex-row items-center gap-4">
                     <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-white/5"><Text className="text-white font-black">{item.name?.charAt(0)}</Text></View>
                     <View><Text className="text-white/20 text-[8px] uppercase">Client</Text><Text className="text-white text-xs font-black uppercase">{item.name}</Text></View>
                  </View>
                  <View className="flex-row items-center gap-4">
                     <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-white/5"><Ionicons name="construct" size={14} color={COLORS.primary} /></View>
                     <View><Text className="text-white/20 text-[8px] uppercase">Mechanic</Text><Text className="text-white text-xs font-black uppercase">{item.assignedEmployeeName || "Pending"}</Text></View>
                  </View>
               </View>
               <View className="flex-row gap-3">
                  {!item.assignedEmployeeId && (
                    <TouchableOpacity onPress={() => { setSelectedBooking(item); setModalVisible(true); }} className="flex-1 bg-white py-4 rounded-xl items-center"><Text className="text-black font-black text-[10px] uppercase">Assign</Text></TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleOpenIssueModal(item)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl items-center justify-center"><Ionicons name="options-outline" size={20} color="white" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push({ pathname: "/(employee)/service-details", params: { id: item.id } })} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl items-center justify-center"><Ionicons name="eye-outline" size={20} color="white" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"><Ionicons name="trash-outline" size={20} color={COLORS.error} /></TouchableOpacity>
               </View>
            </View>
          ))}

          {totalPages > 1 && (
            <View className="flex-row justify-center items-center gap-6 mt-10">
               <TouchableOpacity disabled={currentPage === 1} onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))} className={`w-10 h-10 rounded-xl items-center justify-center border border-white/10 ${currentPage === 1 ? "opacity-20" : ""}`}><Ionicons name="chevron-back" size={20} color="white" /></TouchableOpacity>
               <Text className="text-white font-black text-[10px]">PAGE {currentPage} / {totalPages}</Text>
               <TouchableOpacity disabled={currentPage === totalPages} onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className={`w-10 h-10 rounded-xl items-center justify-center border border-white/10 ${currentPage === totalPages ? "opacity-20" : ""}`}><Ionicons name="chevron-forward" size={20} color="white" /></TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
           <View className="bg-slate-900 rounded-t-3xl p-10">
              <Text className="text-white text-2xl font-black uppercase text-center mb-6">Assign Tech</Text>
              <View className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-8">
                <ScrollView style={{ maxHeight: 300 }}>
                  {employees.map((emp: any) => (
                    <TouchableOpacity key={emp.id} onPress={() => setSelectedEmployeeId(emp.id)} className={`p-5 rounded-xl mb-1 flex-row justify-between items-center ${selectedEmployeeId === emp.id ? "bg-white" : ""}`}>
                      <Text className={`font-black text-xs uppercase ${selectedEmployeeId === emp.id ? "text-black" : "text-white"}`}>{emp.name}</Text>
                      {selectedEmployeeId === emp.id && <Ionicons name="checkmark" size={18} color="black" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View className="flex-row gap-4">
                 <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 py-5 rounded-2xl bg-white/5 items-center"><Text className="text-white/40 font-black text-[10px] uppercase">Abort</Text></TouchableOpacity>
                 <TouchableOpacity onPress={assignEmployee} disabled={!selectedEmployeeId || assigning} className={`flex-1 py-5 rounded-2xl bg-white items-center ${!selectedEmployeeId ? "opacity-20" : ""}`}><Text className="text-black font-black text-[10px] uppercase">Confirm</Text></TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
           <View className="bg-slate-900 rounded-t-3xl p-10">
              <Text className="text-white text-2xl font-black uppercase text-center mb-6">Update Status</Text>
              <ScrollView style={{ maxHeight: 400 }} className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-4">
                {STATUS_STEPS.map((s: string) => (
                  <TouchableOpacity key={s} onPress={async () => { if (selectedBooking) { await handleUpdateStatus(selectedBooking.id, s); setStatusModalVisible(false); }}} className={`p-5 rounded-xl mb-1 flex-row justify-between items-center ${getMappedStatus(selectedBooking?.serviceStatus || selectedBooking?.status) === s ? "bg-white" : ""}`}>
                    <Text className={`font-black text-[10px] uppercase ${getMappedStatus(selectedBooking?.serviceStatus || selectedBooking?.status) === s ? "text-black" : "text-white/40"}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)} className="py-6 rounded-2xl bg-white/5 items-center"><Text className="text-white/40 font-black text-[10px] uppercase">Close</Text></TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Manifest Modal */}
      <Modal visible={issueModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/95">
           <View className="flex-1 bg-slate-950 mt-10 rounded-t-3xl border-t border-white/10">
              <View className="px-10 py-6 border-b border-white/5 flex-row justify-between items-center">
                 <Text className="text-white text-xl font-black uppercase">Manifest</Text>
                 <TouchableOpacity onPress={() => setIssueModalVisible(false)} className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center"><Ionicons name="close" size={24} color="white" /></TouchableOpacity>
              </View>
              <View className="flex-row border-b border-white/5">
                 <TouchableOpacity onPress={() => setActiveModalTab("issues")} className={`flex-1 py-4 items-center ${activeModalTab === "issues" ? "border-b-2 border-white" : ""}`}><Text className="text-white font-black text-[10px] uppercase">Issues</Text></TouchableOpacity>
                 <TouchableOpacity onPress={() => setActiveModalTab("parts")} className={`flex-1 py-4 items-center ${activeModalTab === "parts" ? "border-b-2 border-white" : ""}`}><Text className="text-white font-black text-[10px] uppercase">Parts</Text></TouchableOpacity>
              </View>
              <ScrollView className="flex-1 p-8">
                 {activeModalTab === "issues" ? (
                   issueEntries.map((entry: any, idx: number) => (
                     <View key={idx} className="bg-white/5 p-6 rounded-2xl mb-4 border border-white/10">
                        <TextInput placeholder="Details..." placeholderTextColor="#666" multiline className="text-white font-bold text-xs mb-4 bg-black/20 p-4 rounded-xl min-h-[80px]" value={entry.issue} onChangeText={(val) => { const copy = [...issueEntries]; copy[idx].issue = val; setIssueEntries(copy); }}/>
                        <View className="flex-row gap-4">
                           <View className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 flex-row items-center"><Text className="text-white/20 mr-2">₹</Text><TextInput placeholder="Cost" placeholderTextColor="#666" keyboardType="numeric" className="text-white font-black text-xs flex-1" value={entry.issueAmount?.toString()} onChangeText={(val) => { const copy = [...issueEntries]; copy[idx].issueAmount = val; setIssueEntries(copy); }}/></View>
                           <TouchableOpacity className="flex-1 bg-black/20 p-3 rounded-xl items-center justify-center" onPress={() => { const copy = [...issueEntries]; const cycles = ['pending', 'approved', 'rejected']; copy[idx].issueStatus = cycles[(cycles.indexOf(copy[idx].issueStatus || 'pending') + 1) % 3]; setIssueEntries(copy); }}><Text className="text-amber-400 font-bold text-[8px] uppercase">{entry.issueStatus || 'pending'}</Text></TouchableOpacity>
                        </View>
                     </View>
                   ))
                 ) : (
                    editingParts.map((part: any, idx: number) => (
                      <View key={idx} className="bg-white/5 p-6 rounded-2xl mb-4 border border-white/10">
                         <TextInput placeholder="Part..." placeholderTextColor="#666" className="text-white font-bold text-xs mb-4 bg-black/20 p-4 rounded-xl" value={part.partName} onChangeText={(val) => { const copy = [...editingParts]; copy[idx].partName = val; setEditingParts(copy); }}/>
                         <View className="flex-row gap-4">
                            <TextInput placeholder="Qty" placeholderTextColor="#666" keyboardType="numeric" className="bg-black/20 p-3 rounded-xl text-white font-bold text-xs w-16" value={part.qty?.toString()} onChangeText={(val) => { const copy = [...editingParts]; copy[idx].qty = val; setEditingParts(copy); }}/>
                            <View className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 flex-row items-center"><Text className="text-white/20 mr-2">₹</Text><TextInput placeholder="Price" placeholderTextColor="#666" keyboardType="numeric" className="text-white font-black text-xs flex-1" value={part.price?.toString()} onChangeText={(val) => { const copy = [...editingParts]; copy[idx].price = val; setEditingParts(copy); }}/></View>
                         </View>
                      </View>
                    ))
                 )}
                 <TouchableOpacity onPress={() => { if (activeModalTab === 'issues') setIssueEntries([...issueEntries, { issue: '', issueAmount: '', issueStatus: 'pending' }]); else setEditingParts([...editingParts, { partName: '', qty: 1, price: 0, status: 'pending' }]); }} className="py-10 border border-dashed border-white/20 rounded-2xl items-center mb-32"><Ionicons name="add" size={32} color="#666" /></TouchableOpacity>
              </ScrollView>
              <View className="p-8 border-t border-white/5 bg-slate-950 flex-row gap-4">
                 <TouchableOpacity onPress={() => setIssueModalVisible(false)} className="flex-1 py-5 rounded-2xl bg-white/5 items-center"><Text className="text-white/40 font-black text-[10px] uppercase">Abort</Text></TouchableOpacity>
                 <TouchableOpacity onPress={async () => { try {
                        const issuesToSave = issueEntries.filter((e: any) => e.issue?.trim());
                        for (const entry of issuesToSave) {
                          if (entry.id) await api.put(`/all-services/${editingIssueId}/issues/${entry.id}`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0), issueStatus: entry.issueStatus || 'pending' });
                          else await api.post(`/all-services/${editingIssueId}/issues`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0), issueStatus: entry.issueStatus || 'pending' });
                        }
                        const partsToSave = editingParts.filter((p: any) => p.partName?.trim());
                        if (partsToSave.length > 0 || editingParts.length === 0) await api.post(`/all-services/${editingIssueId}/parts`, { parts: partsToSave.map((p: any) => ({ ...p, status: p.status || 'pending'})) });
                        if (issuesToSave.length > 0) await api.put(`/all-services/${editingIssueId}/issue`, { issue: issuesToSave[0].issue, issueAmount: Number(issuesToSave[0].issueAmount || 0) });
                        Alert.alert("Success", "Manifest Sync OK"); setIssueModalVisible(false); loadData();
                      } catch { Alert.alert("Error", "Sync Fail"); } }} className="flex-2 py-5 rounded-2xl bg-white items-center"><Text className="text-black font-black text-[10px] uppercase">Sync</Text></TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
