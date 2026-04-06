import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function ServiceCenter() {
  const { user: userProfile } = useAuth();
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchActiveServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/all-services");
      
      const mechanicName = (userProfile as any)?.displayName || userProfile?.username || (userProfile as any)?.name || "";
      
      const filtered = (res.data || []).filter((s: any) => {
        const assignedName = (s.assignedEmployeeName || "");
        return assignedName.toLowerCase() === mechanicName.toLowerCase();
      });
      
      const servicesWithParts = await Promise.all(
        filtered.map(async (service: any) => {
          try {
            const partsRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: partsRes.data?.parts || [],
              issues: partsRes.data?.issues || []
            };
          } catch (err) {
            return { ...service, parts: [], issues: [] };
          }
        })
      );

      setActiveServices(servicesWithParts);
    } catch (err) {
      console.error("Fetch services error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchActiveServices();
    }
  }, [userProfile]);

  const updateStatus = async (id: string | number, newStatus: string) => {
    try {
      await api.put(`/all-services/${id}/status`, {
        serviceStatus: newStatus
      });
      Alert.alert("Success", `Status updated to ${newStatus}`);
      fetchActiveServices();
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert("Error", "Update failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-100" };
      case "Approved":
      case "Assigned": return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" };
      case "Processing": return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" };
      case "Waiting for Spare": return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" };
      case "Service Going on": return { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" };
      case "Bill Pending": return { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100" };
      case "Bill Completed": return { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100" };
      case "Service Completed":
      case "Completed": return { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" };
      default: return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 pb-4 border-b border-gray-100 shadow-sm flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="construct" size={24} color="#2563eb" />
            <Text className="text-2xl font-black text-gray-900 tracking-tight">Service Board</Text>
          </View>
          <Text className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Track and update assigned vehicles</Text>
        </View>
        <View className="items-end bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
           <Text className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total</Text>
           <Text className="text-lg font-black text-blue-600">{activeServices.length}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5 pb-20">
        {loading ? (
          <View className="items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#3b82f6" className="mb-4" />
            <Text className="text-gray-500 font-medium">Loading your assignments...</Text>
          </View>
        ) : activeServices.length === 0 ? (
          <View className="bg-white rounded-[2rem] py-16 items-center border-2 border-dashed border-gray-200 mt-10">
            <View className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={40} color="#e5e7eb" />
            </View>
            <Text className="text-xl font-bold text-gray-800">No Services Assigned</Text>
            <Text className="text-gray-400 mt-1 text-center px-6">You're all caught up! Check back later for new tasks.</Text>
          </View>
        ) : (
          <View className="flex flex-col  gap-y-6 pb-10">
            {activeServices.map((service) => {
              const colors = getStatusColor(service.status || service.serviceStatus);
              
              const partsTotal = (service.parts || []).reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
              const approvedIssues = (service.issues || []).filter((i: any) => (i.issueStatus || '').toLowerCase() === 'approved');
              const issuesTotal = approvedIssues.reduce((sum: number, i: any) => sum + Number(i.issueAmount || 0), 0);

              return (
                <View key={service.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mr-3">
                          <Ionicons name="car" size={24} color="#3b82f6" />
                        </View>
                        <View className="flex-1 pr-2">
                          <View className={`self-start px-2 py-1 rounded-md mb-1 border ${colors.bg} ${colors.border}`}>
                            <Text className={`text-[10px] font-black uppercase tracking-wider ${colors.text}`}>
                              {service.status || service.serviceStatus || "Pending"}
                            </Text>
                          </View>
                          <Text className="text-lg font-black text-gray-900">{service.brand} {service.model}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row justify-between mb-5">
                      <View className="flex-1 mr-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</Text>
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="person" size={14} color="#9ca3af" />
                          <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{service.name}</Text>
                        </View>
                      </View>
                      <View className="flex-1 ml-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle ID</Text>
                        <Text className="text-sm font-bold text-gray-800">{service.vehicle_number || "NO PLATE"}</Text>
                      </View>
                    </View>

                    {/* Reported Issue */}
                    <View className="mb-5">
                      <View className="flex-row items-center mb-2 gap-1">
                        <Ionicons name="alert-circle" size={12} color="#9ca3af" />
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reported Issue</Text>
                      </View>
                      <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <Text className="text-xs font-medium text-amber-800 leading-relaxed">
                          {service.carIssue || "Routine checkup and general service inspection."}
                        </Text>
                      </View>
                    </View>

                    {/* Spare Parts */}
                    {service.parts && service.parts.length > 0 && (
                      <View className="mb-5">
                        <View className="flex-row items-center mb-2 gap-1">
                          <Ionicons name="build" size={12} color="#9ca3af" />
                          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spare Parts Added</Text>
                        </View>
                        <View className="gap-y-2">
                          {service.parts.map((part: any, idx: number) => (
                            <View key={part.id || idx} className="flex-row justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100 mb-2">
                              <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-800">{part.partName}</Text>
                                <Text className="text-[10px] text-gray-500">Qty: {part.qty}</Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-xs font-bold text-blue-600">₹{Number(part.total).toFixed(2)}</Text>
                                <View className={`mt-1 px-2 py-0.5 rounded-full ${
                                  part.status === 'approved' ? 'bg-green-100' :
                                  part.status === 'rejected' ? 'bg-red-100' :
                                  'bg-yellow-100'
                                }`}>
                                  <Text className={`text-[9px] font-bold uppercase ${
                                    part.status === 'approved' ? 'text-green-700' :
                                    part.status === 'rejected' ? 'text-red-700' :
                                    'text-yellow-700'
                                  }`}>{part.status || 'pending'}</Text>
                                </View>
                              </View>
                            </View>
                          ))}
                          <View className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex-row justify-between items-center mt-1">
                            <Text className="text-xs font-bold text-blue-700">Total Parts Cost</Text>
                            <Text className="text-sm font-black text-blue-600">₹{partsTotal.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Approved Issues */}
                    {approvedIssues.length > 0 && (
                      <View className="mb-5">
                        <View className="flex-row items-center mb-2 gap-1">
                          <Ionicons name="checkmark-circle" size={12} color="#9ca3af" />
                          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved Issue for Billing</Text>
                        </View>
                        <View className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                          {approvedIssues.map((issue: any, idx: number) => (
                            <View key={issue.id || idx} className={`flex-row justify-between p-3 ${idx < approvedIssues.length - 1 ? 'border-b border-gray-100' : ''}`}>
                              <Text className="text-xs text-gray-700 font-medium flex-1">{issue.issue}</Text>
                              <Text className="text-xs font-black text-blue-600">₹{Number(issue.issueAmount || 0).toFixed(2)}</Text>
                            </View>
                          ))}
                        </View>
                        <View className="mt-2 flex-row justify-between px-1">
                          <Text className="text-xs font-black text-gray-500">Issue total</Text>
                          <Text className="text-xs font-black text-blue-600">₹{issuesTotal.toFixed(2)}</Text>
                        </View>
                      </View>
                    )}

                  </View>

                  {/* Actions */}
                  <View className="flex-row border-t border-gray-50 p-4 gap-x-3 bg-gray-50/50">
                    {(service.serviceStatus === "Processing" || service.status === "Assigned" || service.status === "Approved" || service.status === "Pending") && (
                      <TouchableOpacity 
                        onPress={() => updateStatus(service.id, "Service Going on")}
                        className="flex-1 flex-row items-center justify-center py-3 bg-blue-600 rounded-xl shadow-sm shadow-blue-200"
                      >
                        <Ionicons name="play" size={16} color="white" />
                        <Text className="text-white font-black text-xs ml-1">START SERVICE</Text>
                      </TouchableOpacity>
                    )}
                    {(service.serviceStatus === "Waiting for Spare" || service.status === "Service Going on") && (
                      <>
                        <TouchableOpacity 
                          onPress={() => router.push(`/(employee)/billing?serviceId=${service.id}` as any)}
                          className="flex-1 flex-row items-center justify-center py-3 bg-slate-800 rounded-xl shadow-sm mr-1.5"
                        >
                          <Ionicons name="add-circle" size={16} color="white" />
                          <Text className="text-white font-black text-[10px] ml-1">ADD PARTS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => updateStatus(service.id, "Service Completed")}
                          className="flex-1 flex-row items-center justify-center py-3 bg-green-600 rounded-xl shadow-sm shadow-green-200 ml-1.5"
                        >
                          <Ionicons name="checkmark-circle" size={16} color="white" />
                          <Text className="text-white font-black text-[10px] ml-1">COMPLETE</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {service.status === "Service Completed" && (
                      <View className="flex-1 py-3 bg-gray-100 rounded-xl flex-row items-center justify-center border border-gray-200">
                         <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                         <Text className="text-gray-500 font-black text-[10px] ml-1">SERVICE FINISHED</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
