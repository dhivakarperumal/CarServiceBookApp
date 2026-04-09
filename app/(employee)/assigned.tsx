import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
      container: "bg-warning/20 border-warning/30",
      text: "text-warning",
    },
    Assigned: {
      container: "bg-primary-dark/20 border-primary-dark/30",
      text: "text-primary-dark",
    },
    Approved: {
      container: "bg-primary-dark/20 border-primary-dark/30",
      text: "text-primary-dark",
    },
    "Service Going on": {
      container: "bg-primary/20 border-primary/30",
      text: "text-primary",
    },
    "Bill Pending": {
      container: "bg-accent/20 border-accent/30",
      text: "text-accent",
    },
    "Bill Completed": {
      container: "bg-success/20 border-success/30",
      text: "text-success",
    },
    "Service Completed": {
      container: "bg-success/20 border-success/30",
      text: "text-success",
    },
    Completed: {
      container: "bg-success/20 border-success/30",
      text: "text-success",
    },
  };
  return (
    map[s] || {
      container: "bg-text-muted/20 border-text-muted/30",
      text: "text-text-muted",
    }
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = getStatusClasses(status);

  return (
    <View
      className={`self-start px-3 py-1 rounded-full border ${styles.container}`}
    >
      <Text
        className={`text-[10px] font-black uppercase tracking-wider ${styles.text}`}
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

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-[10px] font-black uppercase tracking-widest mt-4 text-text-secondary">
          Syncing your service history...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View className="mb-6">
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
        <View className="space-y-5 mb-6">
          {/* Search Bar */}
          <View className="relative mb-3">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="search" size={20} color="#64748B" />
            </View>

            <TextInput
              placeholder="Search by vehicle, ID, customer..."
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
              className="w-full pl-12 pr-4 py-4 border border-slate-700 bg-slate-800/80 rounded-2xl text-text-primary font-bold shadow-lg"
            />
          </View>

          {/* Filters */}
          <View className="flex-row gap-3 mt-3">
            <View className="bg-slate-800 border border-slate-700 rounded-2xl px-3 py-1 shadow-sm flex-1">
              <Picker
                selectedValue={filterStatus}
                onValueChange={(itemValue) => setFilterStatus(itemValue)}
                dropdownIconColor="#94A3B8"
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

            <View className="bg-slate-800 border border-slate-700 rounded-2xl px-3 py-1 shadow-sm flex-1">
              <Picker
                selectedValue={dateFilter}
                onValueChange={(itemValue) => setDateFilter(itemValue)}
                dropdownIconColor="#94A3B8"
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
            <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mt-4 space-y-3">
              <Text className="text-xs font-black uppercase tracking-widest text-text-muted">
                Custom Date Range
              </Text>
              <View className="flex-row gap-3 flex-wrap">
                <TextInput
                  placeholder="Start YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={dateRange.start}
                  onChangeText={(value) =>
                    setDateRange((prev) => ({ ...prev, start: value }))
                  }
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-text-primary"
                />
                <TextInput
                  placeholder="End YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={dateRange.end}
                  onChangeText={(value) =>
                    setDateRange((prev) => ({ ...prev, end: value }))
                  }
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-text-primary"
                />
              </View>
            </View>
          )}
        </View>

        {/* LIST */}
        {filteredServices.length === 0 ? (
          <View className="rounded-[2rem] p-12 items-center border border-dashed bg-card border-card">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-4 border bg-background border-card">
              <Ionicons name="car-outline" size={40} color="#64748B" />
            </View>
            <Text className="text-lg font-black mt-2 text-center text-text-primary">
              No Services Found
            </Text>
            <Text className="text-center mt-2 px-4 italic leading-5 text-text-secondary">
              Try adjusting your filters or search terms.
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {filteredServices.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleExpanded(item.id)}
                  activeOpacity={0.7}
                  className="rounded-3xl border border-slate-700/40 bg-slate-950/95 p-6 mb-5 shadow-2xl backdrop-blur-lg"
                >
                  {/* Header Row - Always Visible */}
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-3 mb-3">
                        <Text className="text-2xl font-black text-text-primary">
                          {item.customer_name ||
                            item.name ||
                            `${item.brand} ${item.model}`}
                        </Text>
                        <Text className="text-[12px] font-black uppercase tracking-widest text-text-primary">
                          ID: {item.bookingId || item.id}
                        </Text>
                      </View>
                      <StatusBadge status={item.serviceStatus || item.status} />
                    </View>
                    <Ionicons
                      name={
                        isExpanded ? "chevron-up-circle" : "chevron-down-circle"
                      }
                      size={28}
                      color="#0EA5E9"
                    />
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View className="mt-6 pt-6 border-t border-card">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">
                        Brand / Model
                      </Text>
                      <Text className="text-xl font-black text-text-primary mb-4">
                        {item.brand} {item.model}
                      </Text>
                      <Text className="text-sm font-black uppercase tracking-wider text-primary mb-6">
                        {item.vehicle_number ||
                          item.vehicleNumber ||
                          "NO PLATE"}
                      </Text>

                      {/* Info Blocks */}
                      <View className="space-y-5 mb-6">
                        {/* Issue */}
                        <View className="flex-row items-start gap-4">
                          <View className="w-11 h-11 rounded-2xl flex items-center justify-center border border-warning/20 bg-warning/10 shadow-sm">
                            <Ionicons
                              name="alert-circle"
                              size={20}
                              color="#F59E0B"
                            />
                          </View>

                          <View className="flex-1">
                            <Text className="text-[12px] font-black uppercase tracking-wider text-text-muted">
                              Reported Issue
                            </Text>

                            <Text className="text-md font-bold leading-snug mt-1 text-text-primary">
                              {item.carIssue ||
                                item.issue ||
                                "General Inspection"}
                            </Text>
                          </View>
                        </View>

                        {/* Customer */}
                        <View className="flex-row items-center gap-4 pt-5 border-t border-card">
                          <View className="w-11 h-11 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/10 shadow-sm">
                            <Ionicons name="person" size={18} color="#0EA5E9" />
                          </View>

                          <View className="flex-1">
                            <Text className="text-[12px] font-black uppercase tracking-wider text-text-muted">
                              Customer
                            </Text>

                            <Text className="text-md font-black mt-1 truncate text-text-primary">
                              {item.customer_name || item.name}
                            </Text>

                            <View className="flex-row items-center gap-1 mt-2">
                              <Ionicons
                                name="call-outline"
                                size={12}
                                color="#fff"
                              />
                              <Text className="text-md font-bold text-text-primary">
                                {item.phone || item.mobile || "N/A"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Parts Cost */}
                        {(item.parts_cost > 0 || item.partsTotal > 0) && (
                          <View className="flex-row items-center justify-between p-4 rounded-2xl border border-success/20 bg-success/10 shadow-sm mt-5">
                            <View className="flex-row items-center gap-3">
                              <View className="w-9 h-9 rounded-xl items-center justify-center bg-success shadow">
                                <Text className="text-white font-black text-xs">
                                  ₹
                                </Text>
                              </View>

                              <Text className="text-[10px] font-black uppercase tracking-wider text-success">
                                Parts Cost
                              </Text>
                            </View>

                            <Text className="text-lg font-black text-success">
                              ₹{item.parts_cost || item.partsTotal}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Bottom Row */}
                      <View className="flex-row items-center justify-between pt-6 border-t border-card">
                        <View className="flex-row items-center gap-2">
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#fff"
                          />
                          <Text className="text-[11px] font-bold text-text-primary">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "N/A"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/(employee)/service-details?id=${item.id}` as any,
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20"
                        >
                          <View className="flex-row items-center gap-1">
                            <Text className="text-[11px] font-black uppercase tracking-widest text-primary">
                              View Details
                            </Text>

                            <Ionicons name="eye" size={14} color="#0EA5E9" />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
