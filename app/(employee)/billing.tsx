import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  useEffect(() => {
    if (serviceId) {
      router.push({
        pathname: "/(employee)/add-billing",
        params: { directServiceId: serviceId },
      });
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [userProfile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      Alert.alert("Error", "Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-text-secondary mt-4 font-medium">
          Fetching billing records...
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
        <View className="bg-card p-6 rounded-3xl border border-card mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 bg-primary/20 rounded-2xl items-center justify-center">
              <Ionicons name="receipt" size={24} color="#0EA5E9" />
            </View>
            <View>
              <Text className="text-2xl font-black text-text-primary tracking-tight">
                Job Billing
              </Text>
              <Text className="text-xs text-text-secondary font-medium mt-0.5">
                Assigned service payments
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-success/10 px-4 py-3 rounded-2xl border border-success/20">
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
            <View className="flex-1 bg-warning/10 px-4 py-3 rounded-2xl border border-warning/20">
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            <View className="flex-row items-center gap-3">
              {["all", "paid", "pending", "partial"].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setStatusFilter(f)}
                  className={`px-5 py-3 rounded-2xl border shadow-sm ${
                    statusFilter === f
                      ? "bg-primary border-primary"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      statusFilter === f
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* LIST */}
        {filteredBills.length === 0 ? (
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
            {filteredBills.map((bill) => (
              <View
                key={bill.id}
                className="bg-card/90 rounded-3xl border border-card p-6 mb-5 shadow-xl backdrop-blur-lg"
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-5">
                  <StatusBadge status={bill.paymentStatus} />

                  <Text className="text-[14px] font-black text-text-primary uppercase tracking-widest">
                    INV: {bill.invoiceNo}
                  </Text>
                </View>

                {/* Customer Info */}
                <View className="mb-5">
                  <Text className="text-xl font-black text-text-primary leading-tight">
                    {bill.customerName}
                  </Text>

                  <Text className="text-sm font-black text-primary mt-1 uppercase tracking-wider">
                    {bill.carNumber || "SERVICE JOB"}
                  </Text>

                  <Text className="text-[12px] text-text-primary font-bold uppercase mt-1 tracking-widest">
                    Job ID: {bill.bookingId}
                  </Text>
                </View>

                {/* Summary Box */}
                <View className="bg-background/60 rounded-2xl p-5 space-y-3 mb-5 border border-card shadow-sm">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[12px] font-bold text-text-muted uppercase">
                      Subtotal
                    </Text>

                    <Text className="text-md font-black text-text-secondary">
                      ₹{Number(bill.subTotal || 0).toLocaleString()}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[12px] font-bold text-text-muted uppercase">
                      GST Amount
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

                  {/* View Button */}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("History", "Detail view coming soon.")
                    }
                    className="w-12 bg-primary/10 border border-primary/20 rounded-2xl items-center justify-center"
                  >
                    <Ionicons name="eye" size={18} color="#0EA5E9" />
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
