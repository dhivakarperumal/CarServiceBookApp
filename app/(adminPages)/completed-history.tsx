import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Alert
} from "react-native";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

const { width } = Dimensions.get("window");

const ITEMS_PER_PAGE = 10;

export default function AdminCompletedHistory() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"issues" | "parts">("issues");

  useEffect(() => {
    fetchCompletedServices();
  }, []);

  const fetchCompletedServices = async () => {
    try {
      setLoading(true);
      const [servRes, billRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/billings")
      ]);
      
      const billings = billRes.data || [];
      const billMap: any = {};

      billings.forEach((b: any) => {
        const keys = [
          b.bookingId, 
          b.appointmentId, 
          b.serviceId, 
          b.jobId,
          b.id
        ].filter(Boolean).map(k => k.toString());
        
        const amount = b.grandTotal || b.totalAmount || b.total_amount || 0;
        keys.forEach(k => { billMap[k] = amount; });
      });

      const filtered = (servRes.data || []).filter((s: any) => {
          const sStat = (s.serviceStatus || s.status || "").toLowerCase();
          return sStat.includes("completed") || sStat === "bill completed";
      }).map((s: any) => {
        const possibleIds = [
          s.id, 
          s.bookingId, 
          s.appointmentId, 
          s.serviceId
        ].filter(Boolean).map(id => id.toString());
        
        let foundAmount = 0;
        for (let id of possibleIds) {
          if (billMap[id] !== undefined) {
            foundAmount = billMap[id];
            break;
          }
        }

        return {
          ...s,
          grandTotal: foundAmount
        };
      });
      
      setServices(filtered.sort((a: any, b: any) => 
        new Date(b.updatedAt || b.created_at || 0).getTime() - 
        new Date(a.updatedAt || a.created_at || 0).getTime()
      ));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load completed services history");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(item => {
      const text = search.toLowerCase();
      const matchesSearch = 
        (item.brand + " " + item.model).toLowerCase().includes(text) ||
        (item.vehicleNumber || item.vehicle_number || "").toLowerCase().includes(text) ||
        (item.name || item.customer_name || "").toLowerCase().includes(text) ||
        (item.bookingId || item.id + "").includes(text);

      let matchesDate = true;
      const bDateStr = item.created_at || item.createdAt || item.updatedAt;
      if (dateFilter !== "all" && bDateStr) {
        const bDate = new Date(bDateStr);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (dateFilter === "today") {
          matchesDate = bDate.toDateString() === today.toDateString();
        } else if (dateFilter === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          matchesDate = bDate >= lastWeek;
        } else if (dateFilter === "month") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = bDate >= lastMonth;
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [services, search, dateFilter]);

  const handleViewDetails = async (item: any) => {
    try {
      setLoading(true);
      const res = await api.get(`/all-services/${item.id}`);
      setSelectedServiceDetail({ ...res.data, grandTotal: item.grandTotal });
      setActiveTab("issues");
      setDetailModalVisible(true);
    } catch (err) {
        Alert.alert("Error", "Failed to load detailed record");
    } finally {
      setLoading(false);
    }
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleViewDetails(item)}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-xl"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
            #{item.bookingId || item.id}
          </Text>
          <Text className="text-white font-black text-lg uppercase tracking-tight">
            {item.brand} {item.model}
          </Text>
          <Text className="text-slate-400 text-xs font-bold mt-1">
             {item.vehicleNumber || item.vehicle_number || "REGISTRY MISSING"}
          </Text>
        </View>
        <View className="bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            Completed
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-slate-800 w-full mb-4" />

      <View className="flex-row justify-between items-center">
        <View>
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="person-outline" size={12} color="#94A3B8" />
            <Text className="text-slate-300 text-xs font-bold">{item.name || item.customer_name}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
            <Text className="text-slate-500 text-[10px] font-bold">
               {new Date(item.updatedAt || item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="items-end">
           <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Final Bill</Text>
           <Text className="text-emerald-400 font-black text-lg">₹{Number(item.grandTotal || 0).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={20} color="white" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white font-black text-2xl uppercase tracking-tighter">History</Text>
                    <Text className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">Completed Protocols</Text>
                </View>
            </View>
            <View className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                <Text className="text-emerald-500 font-black text-xs">{services.length}</Text>
            </View>
        </View>

        {/* Search & Filter */}
        <View className="flex-row gap-3 mb-6">
            <View className="flex-1 relative">
                <View className="absolute left-4 top-3.5 z-10">
                    <Ionicons name="search" size={18} color="#64748B" />
                </View>
                <TextInput
                    placeholder="Search Job ID / Plate..."
                    placeholderTextColor="#64748B"
                    value={search}
                    onChangeText={setSearch}
                    className="bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold text-sm shadow-sm"
                />
            </View>
            <TouchableOpacity 
                onPress={() => {
                    const next = dateFilter === "all" ? "today" : dateFilter === "today" ? "week" : dateFilter === "week" ? "month" : "all";
                    setDateFilter(next);
                }}
                className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl items-center justify-center flex-row gap-2"
            >
                <Ionicons name="filter" size={16} color={COLORS.primary} />
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">{dateFilter}</Text>
            </TouchableOpacity>
        </View>

        {loading && services.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">
                Syncing Archives...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderServiceItem}
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="py-20 items-center justify-center">
                <Ionicons name="document-text-outline" size={48} color="#1E293B" />
                <Text className="text-slate-500 text-sm font-bold mt-4">No completed records found</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-slate-900 rounded-t-[3rem] border-t border-slate-800 max-h-[90%] pb-10">
                {/* Modal Header */}
                <View className="p-8 pb-4">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 bg-emerald-500/10 rounded-2xl items-center justify-center border border-emerald-500/20">
                                <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
                            </View>
                            <View>
                                <Text className="text-white font-black text-xl uppercase tracking-tighter">Service Protocol</Text>
                                <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Finalized Record Entry</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setDetailModalVisible(false)}
                            className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {selectedServiceDetail && (
                        <View className="bg-slate-950/50 rounded-3xl p-5 border border-slate-800/50 flex-row justify-between items-center">
                            <View>
                                <Text className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Valuation</Text>
                                <Text className="text-white text-2xl font-black">₹{Number(selectedServiceDetail.grandTotal || 0).toLocaleString()}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Protocol #</Text>
                                <Text className="text-slate-300 font-bold">{selectedServiceDetail.bookingId || selectedServiceDetail.id}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Tabs */}
                <View className="flex-row px-8 mt-4">
                    <TouchableOpacity 
                        onPress={() => setActiveTab("issues")}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === "issues" ? "border-emerald-500" : "border-slate-800"}`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === "issues" ? "text-emerald-500" : "text-slate-500"}`}>Diagnostic</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveTab("parts")}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === "parts" ? "border-emerald-500" : "border-slate-800"}`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === "parts" ? "text-emerald-500" : "text-slate-500"}`}>Spare Parts</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="px-8 mt-6" showsVerticalScrollIndicator={false}>
                    {activeTab === "issues" ? (
                        <View className="gap-3">
                            {(selectedServiceDetail?.issues || []).map((iss: any, i: number) => (
                                <View key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 flex-row justify-between items-center">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-white font-bold text-sm uppercase">{iss.issue}</Text>
                                        <Text className="text-emerald-500/60 text-[8px] font-black uppercase tracking-widest mt-1">Verified Diagnostic</Text>
                                    </View>
                                    <Text className="text-emerald-400 font-black">₹{iss.issueAmount || 0}</Text>
                                </View>
                            ))}
                            {(selectedServiceDetail?.issues || []).length === 0 && (
                                <View className="py-10 items-center">
                                    <Text className="text-slate-600 text-[10px] font-black uppercase">No diagnostic logs found</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="gap-3">
                            {(selectedServiceDetail?.parts || []).map((p: any, i: number) => (
                                <View key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-sm uppercase">{p.partName}</Text>
                                        <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-1">Qty: {p.qty}</Text>
                                    </View>
                                    <Text className="text-emerald-400 font-black">₹{p.price || 0}</Text>
                                </View>
                            ))}
                            {(selectedServiceDetail?.parts || []).length === 0 && (
                                <View className="py-10 items-center">
                                    <Text className="text-slate-600 text-[10px] font-black uppercase">No spare parts utilized</Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
                
                <View className="px-8 mt-6">
                    <TouchableOpacity 
                        onPress={() => setDetailModalVisible(false)}
                        className="w-full py-5 bg-emerald-600 rounded-3xl items-center shadow-lg shadow-emerald-500/20"
                    >
                        <Text className="text-white font-black uppercase tracking-widest text-sm">Return to Archive</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
