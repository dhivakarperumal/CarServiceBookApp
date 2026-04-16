import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
import { COLORS } from "../../theme/colors";

const { width } = Dimensions.get("window");

interface PaymentStatusStyle {
  container: string;
  text: string;
}

const getPaymentStatusClasses = (status: string): PaymentStatusStyle => {
  const s = status?.toLowerCase() || "pending";
  const map: { [key: string]: PaymentStatusStyle } = {
    paid: {
      container: "bg-success/10 border-success",
      text: "text-success",
    },
    partial: {
      container: "bg-warning/10 border-warning",
      text: "text-warning",
    },
    pending: {
      container: "bg-error/10 border-error",
      text: "text-error",
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
  const styles = getPaymentStatusClasses(status);

  return (
    <View
      className={`px-3 py-1.5 rounded-full border mb-1 ${styles.container}`}
    >
      <Text
        className={`text-[8px] font-black uppercase tracking-widest ${styles.text}`}
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
  const [statusFilter, setStatusFilter] = useState("paid");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
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

  const handleMarkAsPaid = async (billId: number | string) => {
    try {
      await (api as any).updateBillingStatus(billId, "Paid");
      Alert.alert("Success", "Bill marked as paid successfully!");
      // Refresh the data to update the UI
      loadData(false);
    } catch (error) {
      console.error("Error updating bill status:", error);
      Alert.alert("Error", "Failed to update bill status. Please try again.");
    }
  };

  const dateFilteredBills = useMemo(() => {
    return bills.filter((b) => {
      let matchesDate = true;
      const billDate = new Date(b.createdAt || b.created_at || b.date || "");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter !== "all") {
        if (!billDate || isNaN(billDate.getTime())) {
          matchesDate = false;
        } else if (dateFilter === "today") {
          matchesDate = billDate.toDateString() === today.toDateString();
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          matchesDate = billDate.toDateString() === yesterday.toDateString();
        } else if (dateFilter === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          matchesDate = billDate >= lastWeek;
        } else if (dateFilter === "month") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = billDate >= lastMonth;
        } else if (dateFilter === "custom") {
          const start = dateRange.start ? new Date(dateRange.start) : null;
          const end = dateRange.end ? new Date(dateRange.end) : null;
          if (end) end.setHours(23, 59, 59, 999);
          if (start && end) {
            matchesDate = billDate >= start && billDate <= end;
          } else if (start) {
            matchesDate = billDate >= start;
          } else if (end) {
            matchesDate = billDate <= end;
          }
        }
      }

      return matchesDate;
    });
  }, [bills, dateFilter, dateRange]);

  const filteredBills = useMemo(() => {
    return dateFilteredBills.filter((b) => {
      const text =
        `${b.invoiceNo} ${b.customerName} ${b.carNumber} ${b.bookingId}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "paid"
          ? b.paymentStatus?.toLowerCase() === "paid"
          : b.paymentStatus?.toLowerCase() !== "paid";
      return matchesSearch && matchesStatus;
    });
  }, [dateFilteredBills, search, statusFilter, dateFilter, dateRange]);

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
        <View className="bg-card p-1 rounded-3xl border border-card mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-success/10 px-4 py-5 rounded-2xl border border-success/20">
              <Text className="text-[9px] text-success font-black uppercase tracking-widest">
                Total Earned
              </Text>
              <Text className="text-lg font-black text-success">
                ₹
                {dateFilteredBills
                  .reduce((sum, b) => sum + Number(b.grandTotal), 0)
                  .toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-warning/10 px-4 py-5 rounded-2xl border border-warning/20">
              <Text className="text-[9px] text-warning font-black uppercase tracking-widest">
                Pending
              </Text>
              <Text className="text-lg font-black text-warning">
                {
                  dateFilteredBills.filter(
                    (b) => b.paymentStatus?.toLowerCase() !== "paid",
                  ).length
                }
              </Text>
            </View>
          </View>
        </View>

        {/* FILTERS */}
        <View className="space-y-4 mb-6 p-3">
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

          <View className="flex-row gap-3 mb-3">
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
                  { value: "week", label: "Past Week" },
                  { value: "month", label: "Past Month" },
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
            <View className="bg-slate-900/30 border border-slate-700 rounded-2xl p-4 mb-3 space-y-3">
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

          {/* Status Tabs */}
          <View className="flex-row gap-3 p-5">
            <TouchableOpacity
              onPress={() => setStatusFilter("paid")}
              className={`flex-1 py-3 rounded-2xl items-center border ${
                statusFilter === "paid"
                  ? "bg-success border-success"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <Text
                className={`font-black text-xs uppercase tracking-widest ${
                  statusFilter === "paid" ? "text-white" : "text-slate-400"
                }`}
              >
                {`Paid (${dateFilteredBills.filter((b) => b.paymentStatus?.toLowerCase() === "paid").length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("pending")}
              className={`flex-1 py-3 rounded-2xl items-center border ${
                statusFilter === "pending"
                  ? "bg-error border-error"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <Text
                className={`font-black text-xs uppercase tracking-widest ${
                  statusFilter === "pending" ? "text-white" : "text-slate-400"
                }`}
              >
                {`Pending (${
                  bills.filter((b) => b.paymentStatus?.toLowerCase() !== "paid")
                    .length
                })`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BILLING CARDS */}
        <View className="px-6 pb-24">
          {loading && bills.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons
                name="receipt-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Loading billing data...
              </Text>
            </View>
          ) : filteredBills.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons
                name="receipt-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No billings found
              </Text>
            </View>
          ) : (
            filteredBills.map((bill) => {
              const isExpanded = expandedItems.includes(bill.id);

              return (
                <View
                  key={bill.id}
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden relative"
                >
                  <TouchableOpacity
                    onPress={() => toggleExpanded(bill.id)}
                    activeOpacity={0.8}
                    className="p-5"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">
                          {bill.invoiceNo}
                        </Text>
                        <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                          {bill.customerName}
                        </Text>
                      </View>
                      <View className="items-end">
                        <View className="mb-1">
                          <StatusBadge status={bill.paymentStatus} />
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2 flex-wrap">
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="car-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[10px] font-bold uppercase">
                          {bill.carNumber || "SERVICE JOB"}
                        </Text>
                      </View>
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="cash-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[10px] font-bold">
                          ₹{Number(bill.grandTotal).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View className="absolute bottom-5 right-5 rounded-full bg-primary p-1 flex items-center justify-center">
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color={COLORS.textPrimary}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <>
                      <View className="mb-6 px-5 pt-4">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">
                          Invoice Details
                        </Text>
                        <Text className="text-xl font-black text-text-primary">
                          {bill.invoiceNo}
                        </Text>
                        <Text className="text-sm font-black text-primary mt-4 uppercase mb-2">
                          {bill.carNumber || "SERVICE JOB"}
                        </Text>
                        <Text className="text-sm text-text-secondary font-medium">
                          Job ID: {bill.bookingId}
                        </Text>
                      </View>

                      {/* Detailed Breakdown */}
                      <View className="bg-slate-900/30 rounded-2xl p-5 mx-5 mb-5 space-y-3 border border-slate-700">
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

                        <View className="flex-row justify-between items-center pt-3 border-t border-slate-700 mt-1">
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
                        <View className="bg-slate-900/30 rounded-2xl p-4 mx-5 mb-5 border border-slate-700">
                          <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                            Parts Used
                          </Text>
                          <View className="gap-2">
                            {bill.parts.map((part: any, idx: number) => (
                              <View
                                key={idx}
                                className="flex-row justify-between items-center bg-slate-900/20 rounded-xl p-3"
                              >
                                <View className="flex-1">
                                  <Text className="text-sm font-bold text-text-primary">
                                    {part.partName}
                                  </Text>
                                  <Text className="text-xs text-text-secondary">
                                    Qty: {part.qty || part.quantity || 0}
                                  </Text>
                                </View>
                                <Text className="text-sm font-black text-text-secondary">
                                  ₹
                                  {Number(
                                    part.total || part.totalPrice || 0,
                                  ).toLocaleString()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Issues List */}
                      {bill.issues && bill.issues.length > 0 && (
                        <View className="bg-slate-900/30 rounded-2xl p-4 mx-5 mb-5 border border-slate-700">
                          <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                            Service Issues
                          </Text>
                          <View className="gap-2">
                            {bill.issues.map((issue: any, idx: number) => (
                              <View
                                key={idx}
                                className="bg-slate-900/20 rounded-xl p-3"
                              >
                                <Text className="text-sm font-bold text-text-primary">
                                  {issue.issueName || issue.issue}
                                </Text>
                                <View className="flex-row justify-between items-center mt-2">
                                  <Text className="text-xs text-text-secondary">
                                    Status: {issue.status || "completed"}
                                  </Text>
                                  <Text className="text-sm font-black text-text-secondary">
                                    ₹
                                    {Number(issue.amount || 0).toLocaleString()}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Actions */}
                      <View className="px-5 pb-5">
                        <View className="flex-row gap-3">
                          <TouchableOpacity
                            onPress={() =>
                              Alert.alert(
                                "Print",
                                "Printing functionality will be available in the native build.",
                              )
                            }
                            className="flex-1 bg-primary py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                          >
                            <Ionicons name="print" size={17} color="#FFFFFF" />
                            <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                              Print Bill
                            </Text>
                          </TouchableOpacity>

                          {statusFilter === "paid" && (
                            <TouchableOpacity
                              onPress={() => {
                                // Navigate to edit bill - pass bill data
                                router.push({
                                  pathname: "/(employee)/add-billing",
                                  params: { editBillId: bill.id },
                                } as any);
                              }}
                              className="flex-1 bg-warning py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                            >
                              <Ionicons
                                name="create"
                                size={17}
                                color="#FFFFFF"
                              />
                              <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                                Edit Bill
                              </Text>
                            </TouchableOpacity>
                          )}

                          {statusFilter === "pending" && (
                            <TouchableOpacity
                              onPress={() => handleMarkAsPaid(bill.id)}
                              className="flex-1 bg-success py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                            >
                              <Ionicons
                                name="checkmark"
                                size={17}
                                color="#FFFFFF"
                              />
                              <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                                Mark Paid
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <View className="absolute bottom-6 right-6 z-40">
        <TouchableOpacity
          onPress={() => router.push("/(employee)/add-billing" as any)}
          className="flex-row items-center gap-3 bg-primary px-4 py-3 rounded-full shadow-2xl border border-white/10"
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-white font-black text-sm uppercase tracking-[1px]">
            New Billing
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
