import React, { useEffect, useMemo, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get('window');

const BOOKING_STATUS = [
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Booked":
    case "Approved": return "bg-indigo-600 text-white";
    case "Processing": return "bg-purple-600 text-white";
    case "Waiting for Spare": return "bg-yellow-600 text-black";
    case "Service Going on": return "bg-orange-600 text-white";
    case "Bill Pending": return "bg-pink-600 text-white";
    case "Bill Completed": return "bg-cyan-600 text-white";
    case "Service Completed": return "bg-emerald-600 text-white";
    default: return "bg-gray-600 text-white";
  }
};

export default function ServiceCenter() {
  const router = useRouter();
  const { id: directId } = useLocalSearchParams();
  const { user: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";

  const [mainTab, setMainTab] = useState("booked"); // booked | addVehicle
  const [subTab, setSubTab] = useState(isMechanic ? "assigned" : "unassigned");
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status Selection Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeServiceForStatus, setActiveServiceForStatus] = useState<any>(null);

  // Issue Editing Modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueEntries, setIssueEntries] = useState<any[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<any>(null);
  const [savingIssues, setSavingIssues] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
      ]);

      const servicesWithDetails = [];
      const servicesRaw = servRes.data || [];

      // Fetch details for each service to get parts and issues
      for (const service of servicesRaw) {
        try {
          const detailRes = await api.get(`/all-services/${service.id}`);
          servicesWithDetails.push({
            ...service,
            parts: detailRes.data?.parts || [],
            issues: detailRes.data?.issues || [],
          });
        } catch (err) {
          servicesWithDetails.push({ ...service, parts: [], issues: [] });
        }
      }

      setServices(servicesWithDetails);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const filteredList = useMemo(() => {
    const mechanicName = userProfile?.username || (userProfile as any)?.displayName || (userProfile as any)?.name || "";
    
    return services.filter((s) => {
      // Main Tab Filter
      const isDirect = !!s.addVehicle;
      if (mainTab === "booked" && isDirect) return false;
      if (mainTab === "addVehicle" && !isDirect) return false;

      // Sub Tab Filter
      if (subTab === "assigned") {
        if (!s.assignedEmployeeId) return false;
        if (isMechanic && (s.assignedEmployeeName || "").toLowerCase() !== mechanicName.toLowerCase()) return false;
      } else {
        if (s.assignedEmployeeId) return false;
      }

      // Search Filter
      const text = `${s.bookingId || ""} ${s.name || s.customer_name || ""} ${s.phone || s.mobile || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || s.vehicle_number || ""}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [services, mainTab, subTab, search, userProfile]);

  const handleStatusChange = async (service: any, newStatus: string) => {
    if (!service.assignedEmployeeId) {
      Alert.alert("Error", "Assign mechanic first");
      return;
    }

    try {
      await api.put(`/all-services/${service.id}/status`, {
        serviceStatus: newStatus,
      });
      Alert.alert("Success", "Status updated successfully");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Update failed");
    }
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;

    try {
      setAssigning(true);
      const emp = employees.find((e) => e.id.toString() === selectedEmployeeId.toString());
      if (!emp) return;

      await api.put(`/all-services/${selectedBooking.id}/assign`, {
        assignedEmployeeId: emp.id,
        assignedEmployeeName: emp.name,
        serviceStatus: "Processing",
      });

      Alert.alert("Success", `Mechanic ${emp.name} assigned!`);
      setModalVisible(false);
      setSelectedEmployeeId("");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const openIssueEditor = (service: any) => {
    setEditingServiceId(service.id);
    let initialIssues = [...(service.issues || [])];
    if (initialIssues.length === 0 && service.carIssue) {
      initialIssues.push({
        issue: service.carIssue,
        issueAmount: service.issueAmount || 0,
        issueStatus: service.issueStatus || 'pending'
      });
    }
    setIssueEntries(initialIssues);
    setIssueModalVisible(true);
  };

  const saveIssues = async () => {
    if (!editingServiceId || savingIssues) return;

    try {
      setSavingIssues(true);
      const toSave = issueEntries.filter(entry => entry.issue && entry.issue.trim());
      
      for (const entry of toSave) {
        if (entry.id) {
          // Update existing
          await api.put(`/all-services/${editingServiceId}/issues/${entry.id}`, {
            issue: entry.issue.trim(),
            issueAmount: Number(entry.issueAmount || 0),
          });
          if (entry.issueStatus && entry.issueStatus !== 'pending') {
             await api.put(`/all-services/${editingServiceId}/issues/${entry.id}/status`, {
               issueStatus: entry.issueStatus,
             });
          }
        } else {
          // Create new
          const newIssue = await api.post(`/all-services/${editingServiceId}/issues`, {
            issue: entry.issue.trim(),
            issueAmount: Number(entry.issueAmount || 0),
          });
          if (entry.issueStatus && entry.issueStatus !== 'pending') {
             await api.put(`/all-services/${editingServiceId}/issues/${newIssue.data.issue.id}/status`, {
                issueStatus: entry.issueStatus,
             });
          }
        }
      }

      Alert.alert("Success", "Issue entries saved");
      setIssueModalVisible(false);
      loadData();
    } catch (error) {
       Alert.alert("Error", "Failed to save issue entries");
    } finally {
      setSavingIssues(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4 font-bold tracking-widest text-[10px] uppercase">Syncing workshop data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* HEADER */}
      <View className="bg-slate-800 p-6 pb-4 border-b border-slate-700">
        <View className="flex-row items-center justify-between mb-4">
           <View>
              <Text className="text-2xl font-black text-white">Service Board</Text>
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Track vehicle flow</Text>
           </View>
           <TouchableOpacity 
             onPress={() => router.push("/(employee)/add-billing" as any)}
             className="bg-sky-500 rounded-xl px-4 py-2.5 flex-row items-center gap-1"
           >
              <Ionicons name="receipt-outline" size={16} color="white" />
              <Text className="text-white font-black text-[10px] uppercase">New Invoice</Text>
           </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View className="relative mb-4">
           <View className="absolute left-4 top-3.5 z-10">
              <Ionicons name="search" size={18} color="#64748b" />
           </View>
           <TextInput
             placeholder="Search bookings, vehicles..."
             placeholderTextColor="#64748b"
             value={search}
             onChangeText={setSearch}
             className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold text-sm"
           />
        </View>

        {/* MAIN TABS */}
        <View className="flex-row bg-slate-900 p-1 rounded-2xl border border-slate-700">
           <TouchableOpacity 
             onPress={() => setMainTab("booked")}
             className={`flex-1 py-3 items-center rounded-xl ${mainTab === "booked" ? 'bg-slate-700' : ''}`}
           >
              <Text className={`font-black text-[10px] uppercase tracking-widest ${mainTab === "booked" ? 'text-white' : 'text-gray-500'}`}>
                Appointment ({services.filter(s => 
                  !s.addVehicle && 
                  (isMechanic ? (
                    (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.username || "").toLowerCase()
                  ) : true)
                ).length})
              </Text>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={() => setMainTab("addVehicle")}
             className={`flex-1 py-3 items-center rounded-xl ${mainTab === "addVehicle" ? 'bg-slate-700' : ''}`}
           >
              <Text className={`font-black text-[10px] uppercase tracking-widest ${mainTab === "addVehicle" ? 'text-white' : 'text-gray-500'}`}>
                Direct Visit ({services.filter(s => 
                  !!s.addVehicle && 
                  (isMechanic ? (
                    (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.username || "").toLowerCase()
                  ) : true)
                ).length})
              </Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
         {/* SUB TABS */}
         <View className="flex-row p-5 gap-3">
            <TouchableOpacity 
              onPress={() => setSubTab("assigned")}
              className={`px-6 py-2 rounded-full border ${subTab === "assigned" ? 'bg-sky-500 border-sky-400' : 'bg-slate-800 border-slate-700'}`}
            >
               <Text className={`text-[10px] font-black uppercase tracking-widest ${subTab === "assigned" ? 'text-white' : 'text-gray-500'}`}>
                 My Tasks ({services.filter(s => s.assignedEmployeeId && (isMechanic ? (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.username || "").toLowerCase() : true)).length})
               </Text>
            </TouchableOpacity>
            {!isMechanic && (
              <TouchableOpacity 
                onPress={() => setSubTab("unassigned")}
                className={`px-6 py-2 rounded-full border ${subTab === "unassigned" ? 'bg-sky-500 border-sky-400' : 'bg-slate-800 border-slate-700'}`}
              >
                 <Text className={`text-[10px] font-black uppercase tracking-widest ${subTab === "unassigned" ? 'text-white' : 'text-gray-500'}`}>
                   Unassigned ({services.filter(s => !s.assignedEmployeeId).length})
                 </Text>
              </TouchableOpacity>
            )}
         </View>

         {/* SERVICE CARDS */}
         <View className="px-5 pb-24">
            {filteredList.length === 0 ? (
              <View className="bg-slate-800 rounded-3xl p-12 items-center border border-slate-700 border-dashed mt-10">
                 <Ionicons name="car-outline" size={48} color="#334155" />
                 <Text className="text-gray-300 font-black mt-4">No Vehicles Found</Text>
                 <Text className="text-gray-500 text-xs text-center mt-2 leading-4">No matching records in the current queue.</Text>
              </View>
            ) : (
              filteredList.map((item) => (
                <View key={item.id} className="bg-slate-800 rounded-3xl border border-slate-700 p-6 mb-5">
                   <View className="flex-row justify-between items-start mb-5">
                      <View className={`px-3 py-1 rounded-full border ${getStatusColor(item.serviceStatus || "Booked")}`}>
                        <Text className="text-[10px] font-black uppercase tracking-widest">{item.serviceStatus || "Booked"}</Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                         <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {item.bookingId || `SER-${item.id}`}</Text>
                         <TouchableOpacity onPress={() => router.push({ pathname: "/(employee)/service-details", params: { id: item.id } })}>
                            <Ionicons name="eye" size={16} color="#64748b" />
                         </TouchableOpacity>
                      </View>
                   </View>

                   <View className="mb-4">
                      <Text className="text-2xl font-black text-white">{item.brand} {item.model}</Text>
                      <Text className="text-sm font-black text-sky-500 mt-1 uppercase">{item.vehicleNumber || item.vehicle_number || "NO PLATE"}</Text>
                      <Text className="text-xs text-gray-400 font-medium mt-2">Customer: {item.name || item.customer_name} • {item.phone || item.mobile}</Text>
                   </View>

                   {/* PROGRESS BAR */}
                   <View className="flex-row items-center gap-1 mb-6 mt-2">
                     {STATUS_STEPS.map((step, idx) => {
                       const currentIdx = STATUS_STEPS.indexOf(item.serviceStatus || "Booked");
                       const active = idx <= currentIdx;
                       return (
                         <View key={step} className={`h-1.5 flex-1 rounded-full ${active ? 'bg-sky-500' : 'bg-slate-700'}`} />
                       );
                     })}
                   </View>

                   {/* ISSUES SECTION */}
                   <View className="bg-slate-900 rounded-2xl p-4 border border-slate-700 mb-5">
                      <View className="flex-row justify-between items-center mb-3">
                         <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Job Details / Issues</Text>
                         {item.assignedEmployeeId && (
                           <TouchableOpacity onPress={() => openIssueEditor(item)}>
                              <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Manage Issues</Text>
                           </TouchableOpacity>
                         )}
                      </View>
                      {item.issues?.length > 0 || item.carIssue ? (
                        <View className="gap-2">
                           {(item.issues?.length > 0 ? item.issues : [{ issue: item.carIssue || item.issue, issueAmount: item.issueAmount || 0, status: item.issueStatus || 'pending' }]).map((iss: any, idx: number) => (
                             <View key={idx} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                <Text className="text-xs font-bold text-slate-300 leading-snug">{iss.issue}</Text>
                                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                   <Text className="text-[10px] font-black text-emerald-500">₹{Number(iss.issueAmount || 0).toFixed(2)}</Text>
                                   <Text className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{iss.issueStatus || iss.status || 'pending'}</Text>
                                </View>
                             </View>
                           ))}
                        </View>
                      ) : (
                        <Text className="text-[10px] text-gray-500 italic">No job issues recorded yet.</Text>
                      )}
                   </View>

                   {/* SPARE PARTS */}
                   {item.parts?.length > 0 && (
                      <View className="bg-slate-900 rounded-2xl p-4 border border-slate-700 mb-6">
                        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Assigned Parts</Text>
                        <View className="gap-2">
                             {item.parts.map((part: any, idx: number) => (
                              <View key={part.id || idx} className="flex-row justify-between items-center bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                                 <View>
                                    <Text className="text-xs font-bold text-slate-300">{part.partName}</Text>
                                    <Text className="text-[10px] text-slate-500">Qty: {part.qty || 1}</Text>
                                 </View>
                                 <View className="items-end">
                                    <Text className="text-xs font-black text-white">₹{Number(part.total || 0).toFixed(2)}</Text>
                                    <View className={`px-2 py-0.5 rounded-md mt-1 border ${part.status === 'approved' ? 'bg-emerald-500 border-emerald-500' : 'bg-yellow-500 border-yellow-500'}`}>
                                       <Text className={`text-[8px] font-black uppercase ${part.status === 'approved' ? 'text-white' : 'text-black'}`}>{part.status || 'pending'}</Text>
                                    </View>
                                 </View>
                              </View>
                            ))}
                        </View>
                     </View>
                   )}

                   {/* FOOTER ACTIONS */}
                   <View className="flex-row gap-3">
                      {!item.assignedEmployeeId ? (
                        <TouchableOpacity 
                          onPress={() => { setSelectedBooking(item); setModalVisible(true); }}
                          className="flex-1 bg-sky-500 py-3.5 rounded-2xl items-center justify-center flex-row"
                        >
                           <Ionicons name="person-add" size={16} color="white" />
                           <Text className="text-white font-black text-xs ml-2">ASSIGN MECHANIC</Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="flex-1 flex-row gap-3">
                           <TouchableOpacity 
                             onPress={() => {
                               setActiveServiceForStatus(item);
                               setStatusModalVisible(true);
                             }}
                             className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
                           >
                              <View className="flex-row items-center px-4 py-2">
                                 <Ionicons name="construct" size={14} color="#64748b" />
                                 <Text className="text-[10px] font-black text-slate-500 ml-2 uppercase">Status</Text>
                              </View>
                              <View className="px-4 pb-3 flex-row justify-between items-center">
                                 <Text className="text-white font-bold text-sm">
                                    {item.serviceStatus || "Booked"}
                                 </Text>
                                 <Ionicons name="chevron-down" size={14} color="#64748b" />
                              </View>
                           </TouchableOpacity>

                           {(item.serviceStatus === "Processing" || item.serviceStatus === "Waiting for Spare") && (
                             <TouchableOpacity 
                               onPress={() => router.push({ pathname: "/(employee)/add-parts", params: { serviceId: item.id } })}
                               className="bg-emerald-600 p-4 px-6 rounded-2xl items-center justify-center"
                             >
                                <Ionicons name="cart" size={20} color="white" />
                             </TouchableOpacity>
                           )}

                           <TouchableOpacity 
                             onPress={() => router.push({ pathname: "/(employee)/billing", params: { serviceId: item.id } })}
                             className="bg-orange-500 p-4 px-6 rounded-2xl items-center justify-center"
                           >
                              <Ionicons name="receipt" size={20} color="white" />
                           </TouchableOpacity>
                        </View>
                      )}
                   </View>
                   
                   {item.assignedEmployeeName && (
                     <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                        <Ionicons name="settings" size={12} color="#64748b" />
                        <Text className="text-xs font-bold text-slate-400">Assigned to: <Text className="text-sky-400">{item.assignedEmployeeName}</Text></Text>
                     </View>
                   )}
                </View>
              ))
            )}
         </View>
      </ScrollView>

      {/* ASSIGN MODAL */}
       <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center p-6">
           <View className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <Text className="text-2xl font-black text-white text-center mb-2">Assign Mechanic</Text>
              <Text className="text-slate-500 text-center text-xs font-medium mb-8 uppercase tracking-widest">Select staff for this vehicle</Text>

              <View className="bg-slate-900 border border-slate-700 rounded-2xl p-2 mb-8">
                 {employees.map((emp) => (
                   <TouchableOpacity 
                     key={emp.id} 
                     onPress={() => setSelectedEmployeeId(emp.id.toString())}
                     className={`flex-row items-center p-4 rounded-xl mb-1 ${selectedEmployeeId === emp.id.toString() ? 'bg-sky-500' : ''}`}
                   >
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedEmployeeId === emp.id.toString() ? 'bg-white/20' : 'bg-slate-800'}`}>
                         <Ionicons name="person" size={16} color={selectedEmployeeId === emp.id.toString() ? 'white' : '#64748b'} />
                      </View>
                      <View>
                        <Text className={`font-bold ${selectedEmployeeId === emp.id.toString() ? 'text-white' : 'text-slate-300'}`}>{emp.name}</Text>
                        <Text className={`text-[10px] ${selectedEmployeeId === emp.id.toString() ? 'text-white/70' : 'text-slate-500'}`}>{emp.role || 'Staff'}</Text>
                      </View>
                   </TouchableOpacity>
                 ))}
              </View>

              <View className="flex-row gap-4">
                 <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedEmployeeId(""); }} className="flex-1 py-4 bg-slate-700 rounded-2xl items-center">
                    <Text className="text-slate-300 font-bold">Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={assignEmployee} 
                   disabled={!selectedEmployeeId || assigning}
                   className={`flex-1 py-4 bg-sky-500 rounded-2xl items-center ${(!selectedEmployeeId || assigning) ? 'opacity-50' : ''}`}
                 >
                    {assigning ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Assign Now</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* ISSUE MODAL */}
       <Modal visible={issueModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
           <View className="bg-slate-800 rounded-t-3xl p-8 pb-12 border-t border-slate-700">
              <View className="flex-row justify-between items-center mb-6">
                 <View>
                   <Text className="text-2xl font-black text-white">Manage Issues</Text>
                   <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Itemized service reporting</Text>
                 </View>
                 <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#64748b" />
                 </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[50vh] mb-6" showsVerticalScrollIndicator={false}>
                 {issueEntries.map((entry, idx) => (
                   <View key={idx} className="bg-slate-900 border border-slate-700 rounded-3xl p-5 mb-4">
                      <View className="flex-row justify-between items-center mb-4">
                         <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task #{idx + 1}</Text>
                         <TouchableOpacity onPress={() => {
                           const copy = [...issueEntries];
                           copy.splice(idx, 1);
                           setIssueEntries(copy);
                         }}>
                            <Ionicons name="trash" size={16} color="#ef4444" />
                         </TouchableOpacity>
                      </View>

                      <TextInput
                        value={entry.issue}
                        onChangeText={(t) => {
                          const copy = [...issueEntries];
                          copy[idx].issue = t;
                          setIssueEntries(copy);
                        }}
                        placeholder="Describe car issue..."
                        placeholderTextColor="#475569"
                        multiline
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold text-sm min-h-[80px]"
                      />

                      <View className="flex-row gap-4 mt-4 items-center">
                         <View className="flex-1 relative">
                            <Text className="absolute left-4 top-3.5 z-10 text-emerald-500 font-black">₹</Text>
                            <TextInput
                              value={entry.issueAmount?.toString()}
                              onChangeText={(t) => {
                                const copy = [...issueEntries];
                                copy[idx].issueAmount = t;
                                setIssueEntries(copy);
                              }}
                              placeholder="0.00"
                              placeholderTextColor="#475569"
                              keyboardType="numeric"
                              className="bg-slate-800 border border-slate-700 rounded-2xl pl-8 pr-4 py-3.5 text-white font-black"
                            />
                         </View>
                         <View className={`px-4 py-3 rounded-2xl border ${entry.issueStatus === 'approved' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}>
                            <Text className={`text-[10px] font-black uppercase tracking-widest ${entry.issueStatus === 'approved' ? 'text-white' : 'text-slate-500'}`}>
                               {entry.issueStatus || 'pending'}
                            </Text>
                         </View>
                      </View>
                   </View>
                 ))}

                 <TouchableOpacity 
                   onPress={() => setIssueEntries([...issueEntries, { issue: '', issueAmount: '', issueStatus: 'pending' }])}
                   className="flex-row items-center justify-center p-4 rounded-2xl border border-slate-700 border-dashed"
                 >
                    <Ionicons name="add-circle" size={20} color="#64748b" />
                    <Text className="text-slate-500 font-bold ml-2 uppercase text-[10px] tracking-widest">Add another task</Text>
                 </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity 
                onPress={saveIssues}
                disabled={savingIssues}
                className={`w-full py-4 bg-sky-500 rounded-2xl items-center ${savingIssues ? 'opacity-30' : ''}`}
              >
                 {savingIssues ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest">Save All Changes</Text>}
              </TouchableOpacity>
           </View>
         </KeyboardAvoidingView>
      </Modal>

      {/* STATUS SELECT MODAL */}
       <Modal visible={statusModalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center p-6">
           <View className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <Text className="text-2xl font-black text-white text-center mb-6">Update Status</Text>
              
              <View className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden max-h-[60vh]">
                 <ScrollView showsVerticalScrollIndicator={false}>
                    {["Processing", "Waiting for Spare"].map((s) => (
                      <TouchableOpacity 
                        key={s}                         onPress={() => {
                          handleStatusChange(activeServiceForStatus, s);
                          setStatusModalVisible(false);
                        }}
                        className={`p-5 border-b border-slate-800 flex-row items-center justify-between ${activeServiceForStatus?.serviceStatus === s ? 'bg-sky-500' : ''}`}
                      >
                         <Text className={`font-black uppercase tracking-widest text-xs ${activeServiceForStatus?.serviceStatus === s ? 'text-white' : 'text-slate-300'}`}>
                            {s}
                         </Text>
                         {activeServiceForStatus?.serviceStatus === s && (
                           <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                         )}
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
              </View>

              <TouchableOpacity 
                onPress={() => setStatusModalVisible(false)}
                className="mt-6 w-full py-4 bg-slate-700 rounded-2xl items-center"
              >
                 <Text className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Close</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
