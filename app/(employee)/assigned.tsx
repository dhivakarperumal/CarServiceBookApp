import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const { width } = Dimensions.get("window");

interface StatusStyle {
  container: string;
  text: string;
}

const getStatusClasses = (status: string): StatusStyle => {
  const s = status?.toString().trim();
  const map: { [key: string]: StatusStyle } = {
    Pending: {
      container: "bg-warning/10 border-warning",
      text: "text-warning",
    },
    Assigned: {
      container: "bg-primary/10 border-primary",
      text: "text-primary",
    },
    Approved: {
      container: "bg-primary/10 border-primary",
      text: "text-primary",
    },
    "Service Going on": {
      container: "bg-warning/10 border-warning",
      text: "text-warning",
    },
    "Bill Pending": {
      container: "bg-error/10 border-error",
      text: "text-error",
    },
    "Bill Completed": {
      container: "bg-success/10 border-success",
      text: "text-success",
    },
    "Service Completed": {
      container: "bg-success/10 border-success",
      text: "text-success",
    },
    Completed: {
      container: "bg-success/10 border-success",
      text: "text-success",
    },
  };
  return (
    map[s] || {
      container: "bg-slate-900/50 border-slate-700",
      text: "text-text-secondary",
    }
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = getStatusClasses(status);

  return (
    <View
      className={`px-3 py-1.5 rounded-full border mb-1 ${styles.container}`}
    >
      <Text
        className={`text-[8px] font-black uppercase tracking-widest ${styles.text}`}
      >
        {status?.toString().trim() || "Assigned"}
      </Text>
    </View>
  );
};

export default function AssignedHistory() {
  const { user: userProfile } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssignedServices();
  }, [userProfile?.id]);

  const fetchAssignedServices = async () => {
    try {
      setLoading(true);
      // Fetching from all-services to include both bookings and appointments
      const res = await api.get("/all-services");

      const mechanicName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";
      const filtered = (res.data || []).filter(
        (s: any) =>
          (s.assignedEmployeeName || "").toLowerCase() ===
          mechanicName.toLowerCase(),
      );

      setServices(filtered);
    } catch (err) {
      console.error("Fetch assigned services failed", err);
      Alert.alert("Error", "Failed to load your assigned services");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/all-services");
      const mechanicName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";
      const filtered = (res.data || []).filter(
        (s: any) =>
          (s.assignedEmployeeName || "").toLowerCase() ===
          mechanicName.toLowerCase(),
      );
      setServices(filtered);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const statusValue = item.serviceStatus || item.status;
      const matchesStatus =
        filterStatus === "all" || statusValue === filterStatus;
      const text = search.toLowerCase();
      const matchesSearch =
        (item.brand || "").toLowerCase().includes(text) ||
        (item.model || "").toLowerCase().includes(text) ||
        (item.vehicle_number || item.vehicleNumber || "")
          .toLowerCase()
          .includes(text) ||
        (item.name || item.customer_name || "").toLowerCase().includes(text) ||
        (item.bookingId || item.id || "").toString().includes(text);

      let matchesDate = true;
      const bDateStr = item.created_at || item.createdAt;
      if (dateFilter !== "all") {
        if (!bDateStr) {
          matchesDate = false;
        } else {
          const bDate = new Date(bDateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (dateFilter === "today") {
            matchesDate = bDate.toDateString() === today.toDateString();
          } else if (dateFilter === "yesterday") {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            matchesDate = bDate.toDateString() === yesterday.toDateString();
          } else if (dateFilter === "week") {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            matchesDate = bDate >= lastWeek;
          } else if (dateFilter === "month") {
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
            matchesDate = bDate >= lastMonth;
          } else if (dateFilter === "custom") {
            const start = dateRange.start ? new Date(dateRange.start) : null;
            const end = dateRange.end ? new Date(dateRange.end) : null;
            if (end) end.setHours(23, 59, 59, 999);
            if (start && end) {
              matchesDate = bDate >= start && bDate <= end;
            } else if (start) {
              matchesDate = bDate >= start;
            } else if (end) {
              matchesDate = bDate <= end;
            }
          }
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [services, search, filterStatus, dateFilter, dateRange]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4">
          {/* Stats */}
          <View className="flex-row gap-4">
            {/* Total Tasks */}
            <View className="flex-1 px-5 py-4 rounded-2xl border border-primary/20 shadow-md bg-gradient-to-br from-primary/15 to-primary/5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Total Tasks
                </Text>

                <Ionicons name="list-outline" size={16} color="#0EA5E9" />
              </View>

              <Text className="text-[28px] font-black text-primary">
                {services.length}
              </Text>
            </View>

            {/* Jobs Done */}
            <View className="flex-1 px-5 py-4 rounded-2xl border border-success/20 shadow-md bg-gradient-to-br from-success/15 to-success/5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-success">
                  Jobs Done
                </Text>

                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color="#10B981"
                />
              </View>

              <Text className="text-[28px] font-black text-success">
                {
                  services.filter((s: any) =>
                    ["Service Completed", "Completed"].includes(
                      s.serviceStatus || s.status,
                    ),
                  ).length
                }
              </Text>
            </View>
          </View>
        </View>

        {/* FILTERS */}
        <View className="px-6 pb-4">
          {/* Search Bar */}
          <View className="mb-6">
            <View className="bg-slate-900/30 rounded-2xl flex-row items-center px-4 h-14 border border-slate-700">
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                placeholder="Search by vehicle, ID, customer..."
                placeholderTextColor="#64748B"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-white font-semibold text-xs"
              />
            </View>
          </View>

          {/* Filters */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 overflow-hidden">
              <Picker
                selectedValue={filterStatus}
                onValueChange={(itemValue) => setFilterStatus(itemValue)}
                dropdownIconColor="#64748B"
                style={{ color: "white" }}
              >
                {[
                  "all",
                  "Assigned",
                  "Approved",
                  "Processing",
                  "Waiting for Spare",
                  "Service Going on",
                  "Bill Pending",
                  "Service Completed",
                ].map((f) => (
                  <Picker.Item
                    key={f}
                    label={f === "all" ? "All" : f}
                    value={f}
                  />
                ))}
              </Picker>
            </View>

            <View className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 overflow-hidden">
              <Picker
                selectedValue={dateFilter}
                onValueChange={(itemValue) => setDateFilter(itemValue)}
                dropdownIconColor="#64748B"
                style={{ color: "white" }}
              >
                {[
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                  { value: "custom", label: "Custom Range" },
                ].map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {dateFilter === "custom" && (
            <View className="bg-slate-900/30 border border-slate-700 rounded-2xl p-4 mb-6 space-y-3">
              <Text className="text-[12px] font-black uppercase tracking-wider text-text-muted">
                Custom Date Range
              </Text>
              <View className="flex-row gap-3 flex-wrap">
                <TextInput
                  placeholder="Start YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                  value={dateRange.start}
                  onChangeText={(value) =>
                    setDateRange((prev) => ({ ...prev, start: value }))
                  }
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-text-primary"
                />
                <TextInput
                  placeholder="End YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                  value={dateRange.end}
                  onChangeText={(value) =>
                    setDateRange((prev) => ({ ...prev, end: value }))
                  }
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-text-primary"
                />
              </View>
            </View>
          )}
        </View>

        {/* SERVICE CARDS */}
        <View className="px-6 pb-24">
          {loading && services.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="car-outline" size={48} color="#64748B" />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Loading assigned services...
              </Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="car-outline" size={48} color="#64748B" />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No services found
              </Text>
            </View>
          ) : (
            filteredServices.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const statusColors = getStatusClasses(
                item.serviceStatus || item.status,
              );

              return (
                <View
                  key={item.id}
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden relative"
                >
                  <TouchableOpacity
                    onPress={() => toggleExpanded(item.id)}
                    activeOpacity={0.8}
                    className="p-5"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">
                          {item.bookingId || `SER-${item.id}`}
                        </Text>
                        <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                          {item.customer_name ||
                            item.name ||
                            `${item.brand} ${item.model}`}
                        </Text>
                      </View>
                      <View className="items-end">
                        <View
                          className={`px-3 py-1.5 rounded-full border mb-1 ${statusColors.container}`}
                        >
                          <Text
                            className={`text-[8px] font-black uppercase tracking-widest ${statusColors.text}`}
                          >
                            {item.serviceStatus || item.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2 flex-wrap">
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="car-outline"
                          size={12}
                          color="#0EA5E9"
                        />
                        <Text className="text-text-secondary text-[10px] font-bold uppercase">
                          {item.brand} {item.model}
                        </Text>
                      </View>
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color="#0EA5E9"
                        />
                        <Text className="text-text-secondary text-[10px] font-bold">
                          {item.phone || item.mobile}
                        </Text>
                      </View>
                    </View>
                    <View className="absolute bottom-5 right-5 rounded-full bg-primary p-1 flex items-center justify-center">
                      <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <>
                      <View className="mb-6 px-5 pt-4">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">
                          Brand / Model
                        </Text>
                        <Text className="text-xl font-black text-text-primary">
                          {item.brand} {item.model}
                        </Text>
                        <Text className="text-sm font-black text-primary mt-4 uppercase mb-2">
                          {item.vehicle_number ||
                            item.vehicleNumber ||
                            "NO PLATE"}
                        </Text>
                        <Text className="text-sm text-text-secondary font-medium">
                          Customer: {item.customer_name || item.name} •{" "}
                          {item.phone || item.mobile}
                        </Text>
                      </View>

                      {/* Issue */}
                      <View className="bg-slate-900/30 rounded-2xl p-4 mx-5 mb-5 border border-slate-700">
                        <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                          Reported Issue
                        </Text>
                        <Text className="text-sm font-bold text-text-primary">
                          {item.carIssue || item.issue || "General Inspection"}
                        </Text>
                      </View>

                      {/* Parts Cost */}
                      {(item.parts_cost > 0 || item.partsTotal > 0) && (
                        <View className="bg-slate-900/30 rounded-2xl p-4 mx-5 mb-5 border border-slate-700">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                              Parts Cost
                            </Text>
                            <Text className="text-lg font-black text-success">
                              ₹{item.parts_cost || item.partsTotal}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* View Details Button */}
                      <View className="px-5 pb-5">
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/(employee)/service-details?id=${item.id}` as any,
                            )
                          }
                          className="bg-primary py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                        >
                          <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                            View Details
                          </Text>
                          <Ionicons name="eye" size={14} color="white" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
