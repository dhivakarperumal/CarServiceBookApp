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
          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-6">
            {/* TOTAL EARNED */}
            <View className="flex-1 bg-card rounded-[28px] border border-slate-700 p-5">
              <Text className="text-[10px] uppercase tracking-[2px] text-text-secondary font-black mb-3">
                Total Earned
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-black text-text-primary">
                  ₹
                  {bills
                    .reduce((sum, b) => sum + Number(b.grandTotal), 0)
                    .toLocaleString()}
                </Text>
                <View className="w-12 h-12 rounded-2xl bg-success/10 items-center justify-center border border-success/20">
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
              </View>
            </View>

            {/* PENDING */}
            <View className="flex-1 bg-card rounded-[28px] border border-slate-700 p-5">
              <Text className="text-[10px] uppercase tracking-[2px] text-text-secondary font-black mb-3">
                Pending
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-black text-text-primary">
                  {bills.filter((b) => b.paymentStatus !== "Paid").length}
                </Text>
                <View className="w-12 h-12 rounded-2xl bg-warning/10 items-center justify-center border border-warning/20">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.warning}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* CREATE NEW BILLING BUTTON */}
          <TouchableOpacity
            onPress={() => router.push("/(employee)/add-billing" as any)}
            className="mb-6 bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-text-primary font-black uppercase tracking-widest text-xs">
              Create New Billing
            </Text>
          </TouchableOpacity>

          {/* SEARCH */}
          <View className="mb-6">
            <View className="bg-slate-900/30 rounded-2xl flex-row items-center px-4 h-14 border border-slate-700">
              <Ionicons name="search" size={16} color={COLORS.slate600} />
              <TextInput
                placeholder="Search invoice, customer..."
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-white font-semibold text-xs"
              />
            </View>
          </View>

          {/* FILTER PICKER */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 overflow-hidden">
              <Picker
                selectedValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                dropdownIconColor={COLORS.slate600}
                style={{ color: COLORS.textPrimary }}
                itemStyle={{ color: COLORS.textPrimary, fontSize: 14 }}
              >
                <Picker.Item label="All Status" value="all" />
                <Picker.Item label="Paid" value="paid" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Partial" value="partial" />
              </Picker>
            </View>
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
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden"
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
                        <Ionicons
                          name="chevron-down"
                          size={12}
                          color={COLORS.textMuted}
                        />
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
                                    Qty: {part.quantity}
                                  </Text>
                                </View>
                                <Text className="text-sm font-black text-text-secondary">
                                  ₹
                                  {Number(
                                    part.totalPrice || 0,
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
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Print",
                              "Printing functionality will be available in the native build.",
                            )
                          }
                          className="bg-primary py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                        >
                          <Ionicons name="print" size={17} color="#FFFFFF" />
                          <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                            Print Bill
                          </Text>
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
