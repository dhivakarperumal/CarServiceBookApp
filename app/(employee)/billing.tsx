import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const { width } = Dimensions.get("window");

interface PaymentStatusStyle {
  container: string;
  text: string;
}

const getPaymentStatusClasses = (status: string): PaymentStatusStyle => {
  const s = status?.toLowerCase() || "pending";
  const map: { [key: string]: PaymentStatusStyle } = {
    paid: {
      container: "bg-success/20 border-success/30",
      text: "text-success",
    },
    partial: {
      container: "bg-warning/20 border-warning/30",
      text: "text-warning",
    },
    pending: {
      container: "bg-warning/20 border-warning/30",
      text: "text-warning",
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
  const styles = getPaymentStatusClasses(status);

  return (
    <View className={`px-3 py-1 rounded-full border ${styles.container}`}>
      <Text
        className={`text-[10px] font-black uppercase tracking-wider ${styles.text}`}
      >
        {status?.toLowerCase() || "pending"}
      </Text>
    </View>
  );
};

export default function EmployeeBilling() {
  const { user: userProfile } = useAuth();
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState<(string | number)[]>([]);

  const toggleExpanded = (id: string | number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (serviceId) {
      router.push({
        pathname: "/(employee)/add-billing",
        params: { directServiceId: serviceId },
      });
    }
  }, [serviceId]);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [billRes, bookRes] = await Promise.all([
        api.get("/billings"),
        api.get("/bookings"),
      ]);

      const mechanicName =
        userProfile?.username || (userProfile as any)?.name || "";
      const assignedBookings = (bookRes.data || []).filter(
        (b: any) =>
          (b.assignedEmployeeName || "").toLowerCase() ===
          mechanicName.toLowerCase(),
      );

      const assignedBookingIds = new Set(
        assignedBookings.map((b: any) => b.bookingId),
      );

      // Filter bills that belong to this technician's assigned bookings
      const myBills = (billRes.data || []).filter((bill: any) =>
        assignedBookingIds.has(bill.bookingId),
      );

      setBills(myBills);
    } catch (err) {
      console.error(err);
      if (showLoading) Alert.alert("Error", "Failed to load billing history");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [billRes, bookRes] = await Promise.all([
        api.get("/billings"),
        api.get("/bookings"),
      ]);

      const mechanicName =
        userProfile?.username || (userProfile as any)?.name || "";
      const assignedBookings = (bookRes.data || []).filter(
        (b: any) =>
          (b.assignedEmployeeName || "").toLowerCase() ===
          mechanicName.toLowerCase(),
      );

      const assignedBookingIds = new Set(
        assignedBookings.map((b: any) => b.bookingId),
      );

      const myBills = (billRes.data || []).filter((bill: any) =>
        assignedBookingIds.has(bill.bookingId),
      );

      setBills(myBills);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const text =
        `${b.invoiceNo} ${b.customerName} ${b.carNumber} ${b.bookingId}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        b.paymentStatus?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, search, statusFilter]);

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
        <View className="bg-card p-1 rounded-3xl border border-card mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-success/10 px-4 py-5 rounded-2xl border border-success/20">
              <Text className="text-[9px] text-success font-black uppercase tracking-widest">
                Total Earned
              </Text>
              <Text className="text-lg font-black text-success">
                ₹
                {bills
                  .reduce((sum, b) => sum + Number(b.grandTotal), 0)
                  .toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-warning/10 px-4 py-5 rounded-2xl border border-warning/20">
              <Text className="text-[9px] text-warning font-black uppercase tracking-widest">
                Pending
              </Text>
              <Text className="text-lg font-black text-warning">
                {bills.filter((b) => b.paymentStatus !== "Paid").length}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(employee)/add-billing" as any)}
            className="mt-4 bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-text-primary font-black uppercase tracking-widest text-xs">
              Create New Billing
            </Text>
          </TouchableOpacity>
        </View>

        {/* FILTERS */}
        <View className="space-y-5 mb-6">
          {/* Search Bar */}
          <View className="relative mb-3">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="search" size={20} color="#64748B" />
            </View>

            <TextInput
              placeholder="Search invoice, customer..."
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
              className="w-full pl-12 pr-4 py-4 border border-slate-700 bg-slate-800/80 rounded-2xl text-text-primary font-bold shadow-lg"
            />
          </View>

          {/* Filters */}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-1 shadow-sm overflow-hidden">
              <Picker
                selectedValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                mode="dropdown"
                dropdownIconColor="#64748B"
                style={{
                  color: "#FFFFFF",
                  backgroundColor: "transparent",
                  height: 50,
                }}
                itemStyle={{
                  color: "#FFFFFF",
                  backgroundColor: "#1e293b",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                <Picker.Item label="All Status" value="all" />
                <Picker.Item label="Paid" value="paid" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Partial" value="partial" />
              </Picker>
            </View>
          </View>
        </View>

        {/* LIST */}
        {loading && bills.length === 0 ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text className="text-text-secondary mt-4 font-medium italic">
              Synchronizing records...
            </Text>
          </View>
        ) : filteredBills.length === 0 ? (
          <View className="bg-card rounded-[2rem] p-12 items-center border border-card border-dashed">
            <Ionicons name="alert-circle-outline" size={48} color="#64748B" />
            <Text className="text-text-primary text-lg font-black mt-4">
              No Billings Found
            </Text>
            <Text className="text-text-secondary text-center mt-2 px-4 italic">
              Once you generate bills for assigned services, they will appear
              here.
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {filteredBills.map((bill) => {
              const isExpanded = expandedItems.includes(bill.id);

              return (
                <View
                  key={bill.id}
                  className="rounded-3xl border border-slate-700/40 bg-slate-950/95 p-6 mb-5 shadow-2xl backdrop-blur-lg"
                >
                  <TouchableOpacity
                    onPress={() => toggleExpanded(bill.id)}
                    activeOpacity={0.8}
                    className="mb-4"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-xl font-black text-text-primary leading-tight">
                            {bill.customerName}
                          </Text>
                          <Text className="text-[12px] font-black text-text-primary uppercase tracking-widest">
                            INV: {bill.invoiceNo}
                          </Text>
                        </View>
                        <View className="self-start mt-3">
                          <StatusBadge status={bill.paymentStatus} />
                        </View>
                      </View>
                      <Ionicons
                        name={
                          isExpanded
                            ? "chevron-up-circle"
                            : "chevron-down-circle"
                        }
                        size={28}
                        color="#0EA5E9"
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="mt-4">
                      <View className="mb-5">
                        <Text className="text-sm font-black text-primary mt-1 uppercase tracking-wider">
                          {bill.carNumber || "SERVICE JOB"}
                        </Text>
                        <Text className="text-[12px] text-text-primary font-bold uppercase mt-1 tracking-widest">
                          Job ID: {bill.bookingId}
                        </Text>
                      </View>

                      {/* Detailed Breakdown */}
                      <View className="bg-background/60 rounded-2xl p-5 space-y-3 mb-5 border border-card shadow-sm">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-[12px] font-bold text-text-muted uppercase">
                            Parts Total
                          </Text>
                          <Text className="text-md font-black text-text-secondary">
                            ₹{Number(bill.partsTotal || 0).toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row justify-between items-center">
                          <Text className="text-[12px] font-bold text-text-muted uppercase">
                            Issues Total
                          </Text>
                          <Text className="text-md font-black text-text-secondary">
                            ₹{Number(bill.issueTotal || 0).toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row justify-between items-center">
                          <Text className="text-[12px] font-bold text-text-muted uppercase">
                            Labour Charges
                          </Text>
                          <Text className="text-md font-black text-text-secondary">
                            ₹{Number(bill.labour || 0).toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row justify-between items-center">
                          <Text className="text-[12px] font-bold text-text-muted uppercase">
                            GST ({bill.gstPercent || 0}%)
                          </Text>
                          <Text className="text-md font-black text-text-secondary">
                            ₹{Number(bill.gstAmount || 0).toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row justify-between items-center pt-3 border-t border-card mt-1">
                          <Text className="text-xs font-black text-text-primary uppercase tracking-widest">
                            Grand Total
                          </Text>
                          <Text className="text-xl font-black text-success">
                            ₹{Number(bill.grandTotal).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {/* Parts List */}
                      {bill.parts && bill.parts.length > 0 && (
                        <View className="bg-background/60 rounded-2xl p-4 mb-5 border border-card">
                          <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                            Parts Used
                          </Text>
                          <View className="gap-2">
                            {bill.parts.map((part: any, idx: number) => (
                              <View
                                key={idx}
                                className="flex-row justify-between items-center bg-card p-2.5 rounded-xl border border-card"
                              >
                                <View>
                                  <Text className="text-md font-bold text-text-primary">
                                    {part.partName}
                                  </Text>
                                  <Text className="text-[12px] text-text-primary">
                                    Qty: {part.qty || 1}
                                  </Text>
                                </View>
                                <Text className="text-md font-black text-text-primary">
                                  ₹{Number(part.total || 0).toFixed(2)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Issues List */}
                      {bill.issues && bill.issues.length > 0 && (
                        <View className="bg-background/60 rounded-2xl p-4 mb-5 border border-card">
                          <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                            Service Issues
                          </Text>
                          <View className="gap-2">
                            {bill.issues.map((issue: any, idx: number) => (
                              <View
                                key={idx}
                                className="bg-card p-3 rounded-xl border border-card"
                              >
                                <Text className="text-xs font-bold text-text-secondary leading-snug">
                                  {issue.issueName || issue.issue}
                                </Text>
                                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-card">
                                  <Text className="text-[10px] font-black text-success">
                                    ₹{Number(issue.amount || 0).toFixed(2)}
                                  </Text>
                                  <Text className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                                    {issue.status || "completed"}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Actions */}
                  <View className="flex-row gap-3">
                    {/* Premium Print Button */}
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Print",
                          "Printing functionality will be available in the native build.",
                        )
                      }
                      className="flex-1 bg-primary py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg"
                    >
                      <Ionicons name="print" size={17} color="#FFFFFF" />

                      <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                        Print Bill
                      </Text>
                    </TouchableOpacity>

                   
                   
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
