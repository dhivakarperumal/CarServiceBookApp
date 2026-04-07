import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
    <View className={`px-3 py-1 rounded-full border ${styles.container}`}>
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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

      return matchesStatus && matchesSearch;
    });
  }, [services, search, filterStatus]);

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
      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="bg-card/90 p-6 rounded-3xl border border-card mb-6 shadow-xl backdrop-blur-lg">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl items-center justify-center border border-primary/20 shadow-md">
              <Ionicons name="time" size={26} color="#0EA5E9" />
            </View>

            <View className="flex-1">
              <Text className="text-[22px] font-extrabold tracking-tight text-text-primary">
                Job History
              </Text>

              <Text className="text-xs font-medium mt-1 text-text-secondary">
                Assigned service logs
              </Text>
            </View>
          </View>

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            <View className="flex-row items-center gap-3">
              {[
                "all",
                "Assigned",
                "Service Going on",
                "Bill Pending",
                "Service Completed",
              ].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilterStatus(f)}
                  className={`px-5 py-3 rounded-2xl border shadow-sm ${
                    filterStatus === f
                      ? "bg-primary border-primary"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      filterStatus === f
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {f === "all" ? "Any Status" : f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
            {filteredServices.map((item) => (
              <View
                key={item.id}
                className="rounded-3xl border border-card bg-card/90 p-6 mb-5 shadow-xl backdrop-blur-lg"
              >
                {/* Top Row */}
                <View className="flex-row justify-between items-start mb-6">
                  <StatusBadge status={item.serviceStatus || item.status} />

                  <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    ID: {item.bookingId || item.id}
                  </Text>
                </View>

                {/* Vehicle Info */}
                <View className="mb-6">
                  <Text className="text-2xl font-black leading-tight text-text-primary">
                    {item.brand} {item.model}
                  </Text>

                  <Text className="text-sm font-black mt-1 uppercase tracking-wider text-primary">
                    {item.vehicle_number || item.vehicleNumber || "NO PLATE"}
                  </Text>
                </View>

                {/* Info Blocks */}
                <View className="space-y-5 mb-6">
                  {/* Issue */}
                  <View className="flex-row items-start gap-4">
                    <View className="w-11 h-11 rounded-2xl flex items-center justify-center border border-warning/20 bg-warning/10 shadow-sm">
                      <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        Reported Issue
                      </Text>

                      <Text className="text-sm font-bold leading-snug mt-1 text-text-secondary">
                        {item.carIssue || item.issue || "General Inspection"}
                      </Text>
                    </View>
                  </View>

                  {/* Customer */}
                  <View className="flex-row items-center gap-4 pt-5 border-t border-card">
                    <View className="w-11 h-11 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/10 shadow-sm">
                      <Ionicons name="person" size={18} color="#0EA5E9" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        Customer
                      </Text>

                      <Text className="text-sm font-black truncate text-text-primary">
                        {item.customer_name || item.name}
                      </Text>

                      <View className="flex-row items-center gap-1 mt-1">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color="#64748B"
                        />
                        <Text className="text-xs font-bold text-text-muted">
                          {item.phone || item.mobile || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Parts Cost */}
                  {(item.parts_cost > 0 || item.partsTotal > 0) && (
                    <View className="flex-row items-center justify-between p-4 rounded-2xl border border-success/20 bg-success/10 shadow-sm">
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
                      color="#64748B"
                    />
                    <Text className="text-[11px] font-bold text-text-muted">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>

                  {/* Premium Open Details Button */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/(employee)/servicecenter?id=${item.id}` as any,
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20"
                  >
                    <View className="flex-row items-center gap-1">
                      <Text className="text-[11px] font-black uppercase tracking-widest text-primary">
                        Open Details
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#0EA5E9"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
